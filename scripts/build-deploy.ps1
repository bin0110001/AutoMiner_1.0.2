[CmdletBinding()]
param(
    [string] $PackType = "all",
    [string] $MinecraftRoot,
    [switch] $SkipDeploy,
    [switch] $NoZip
)

$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) { $scriptRoot = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent }

function Convert-ToFileUri {
    param([string]$Path)
    return "file:///$($Path.Replace('\', '/').Replace(' ', '%20'))"
}

function Find-LockingProcesses {
    param([string]$Path)
    $pathNorm = (Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue).Path
    if (-not $pathNorm) { $pathNorm = (Resolve-Path -LiteralPath (Split-Path -LiteralPath $Path -Parent) -ErrorAction SilentlyContinue).Path }
    if (-not $pathNorm) { return }
    $results = @()
    Get-CimInstance Win32_Process | ForEach-Object {
         $cmdLine = $_.CommandLine
        $cwd = $_.ExecutablePath
        $name = $_.Name
        $procId = $_.ProcessId
        $hit = $false
        if ($cmdLine -and $cmdLine -like "*$pathNorm*") { $hit = $true }
        if (-not $hit -and $cwd -and $cwd -like "*$pathNorm*") { $hit = $true }
        $mw = $null
        try { $mw = (Get-Process -Id $procId -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle) } catch { }
        if ($hit) {
            $results += [pscustomobject]@{
                PID = $procId
                Name = $name
                CommandLine = $cmdLine
                MainWindowTitle = $mw
            }
        }
    }
    if ($results) {
        Write-Host "=== Locking processes for '$pathNorm' ===" -ForegroundColor Yellow
        $results | Format-Table -AutoSize | Out-String | Write-Host
    } else {
        Write-Host "No obvious lock source found via WMI for '$pathNorm'." -ForegroundColor DarkYellow
    }
}

function Sync-BehaviorScripts {
    param(
        [string]$ProjectRoot,
        [string]$SourceScripts,
        [string]$TargetScripts
    )

    $sourcePath = Join-Path $ProjectRoot $SourceScripts
    $targetPath = Join-Path $ProjectRoot $TargetScripts

    if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) {
        throw "Source scripts folder not found: $sourcePath"
    }

    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null

    Get-ChildItem -LiteralPath $sourcePath -Filter "*.js" -File | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $targetPath $_.Name) -Force
    }

    Write-Host "Synced scripts: $SourceScripts -> $TargetScripts"
}

function Get-PackItemNames {
    param([string]$PackType)
    switch ($PackType) {
        "behavior-pack" { @("manifest.json", "pack_icon.png", "items", "recipes", "scripts", "blocks", "loot_tables", "entities", "texts") }
        "resource-pack" { @("manifest.json", "pack_icon.png", "textures", "models", "entity", "animations", "animation_controllers", "particles", "sounds", "texts", "sounds.json") }
    }
}

function Get-TargetFolders {
    param([string]$PackType)
    switch ($PackType) {
        "behavior-pack" { @("development_behavior_packs") }
        "resource-pack" { @("development_resource_packs") }
    }
}

function Invoke-PackBuild {
    param(
        [string]$PackRoot,
        [string]$PackType,
        [string]$MinecraftRoot,
        [bool]$ShouldSkipDeploy,
        [bool]$ShouldSkipZip
    )

    $resolvedPackRoot = Resolve-Path -LiteralPath $PackRoot -ErrorAction Stop

    if (-not (Test-Path -LiteralPath (Join-Path $resolvedPackRoot.Path "manifest.json") -PathType Leaf)) {
        throw "manifest.json not found at: $resolvedPackRoot"
    }

    $manifest = Get-Content -LiteralPath (Join-Path $resolvedPackRoot.Path "manifest.json") -Raw | ConvertFrom-Json -ErrorAction Stop
    $version = ($manifest.header.version -join ".")
    $packFolderName = "{0}_v{1}" -f ($manifest.header.name -replace "[^A-Za-z0-9]+", "_"), $version

    $packItemNames = Get-PackItemNames -PackType $PackType
    $packPaths = foreach ($itemName in $packItemNames) {
        $itemPath = Join-Path $resolvedPackRoot.Path $itemName
        if (-not (Test-Path -LiteralPath $itemPath)) {
            Write-Warning "Pack item not found (skipping): $itemPath"
        } else {
            $itemPath
        }
    }

    $resolvedMinecraftRoot = if ($MinecraftRoot) { 
        $MinecraftRoot 
    } else {
        $candidate1 = Join-Path $env:LOCALAPPDATA "Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang"
        if (Test-Path -LiteralPath $candidate1) { $candidate1 } else { Join-Path $env:APPDATA "Minecraft Bedrock\users\shared\games\com.mojang" }
    }

    if (-not $ShouldSkipZip) {
        $zipPath = Join-Path $resolvedPackRoot.Path "..\$packFolderName.zip"
        if (Test-Path -LiteralPath $zipPath) {
            Remove-Item -LiteralPath $zipPath -Force
        }
        Compress-Archive -Path $packPaths -DestinationPath $zipPath -Force
        Write-Host "Built zip: $(Convert-ToFileUri -Path $zipPath)"
    }

    if (-not $ShouldSkipDeploy) {
        $targetFolders = Get-TargetFolders -PackType $PackType
        foreach ($targetFolder in $targetFolders) {
            $targetRoot = Join-Path $resolvedMinecraftRoot $targetFolder
            if (-not (Test-Path -LiteralPath $targetRoot -PathType Container)) {
                New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
            }

            $destination = Join-Path $targetRoot $packFolderName
            if (Test-Path -LiteralPath $destination) {
                $maxRetries = 3
                $retryDelayMs = 1500
                for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
                    try {
                        Remove-Item -LiteralPath $destination -Recurse -Force
                        break
                    } catch {
                        if ($attempt -lt $maxRetries) {
                            $minecraftProcs = Get-Process | Where-Object { $_.ProcessName -like "Minecraft*" -or $_.ProcessName -like "*Bedrock*" }
                            if ($minecraftProcs) {
                                Write-Host "Closing Minecraft processes to release locks..."
                                $minecraftProcs | Stop-Process -Force
                            }
                            $frameLocks = Get-Process ApplicationFrameHost -ErrorAction SilentlyContinue | Where-Object {
                                try { $_.MainWindowTitle -match "Minecraft" } catch { $false }
                            }
                            if ($frameLocks) {
                                Write-Host "Closing ApplicationFrameHost window holding Minecraft..."
                                $frameLocks | Stop-Process -Force
                            }
                            Write-Host "Retry $attempt/$maxRetries : Waiting for locks to release..."
                            Start-Sleep -Milliseconds $retryDelayMs
                        } else {
                            Find-LockingProcesses -Path $destination
                            throw "Failed to remove '$destination' after $maxRetries attempts: $_"
                        }
                    }
                }
            }

            foreach ($packPath in $packPaths) {
                New-Item -ItemType Directory -Force -Path $destination | Out-Null
                $packItemName = [System.IO.Path]::GetFileName($packPath)
                $packDestination = Join-Path $destination $packItemName
                if (Test-Path -LiteralPath $packPath -PathType Container) {
                    if (Test-Path -LiteralPath $packDestination) {
                        Remove-Item -LiteralPath $packDestination -Recurse -Force
                    }
                    New-Item -ItemType Directory -Force -Path $packDestination | Out-Null
                    & robocopy $packPath $packDestination /E /NFL /NDL /NJH /NJS /NP | Out-Null
                    if ($LASTEXITCODE -gt 7) {
                        throw "Robocopy failed for '$packPath' to '$packDestination' with exit code $LASTEXITCODE"
                    }
                } else {
                    Copy-Item -LiteralPath $packPath -Destination $packDestination -Force
                }
            }
            Write-Host "Deployed to $targetFolder`: $(Convert-ToFileUri -Path $destination)"
        }
    }

    Write-Host "Pack version: $version"
    Write-Host "Build folder: $(Convert-ToFileUri -Path $resolvedPackRoot.Path)"
}

# Build and deploy packs
$projectRoot = Join-Path $scriptRoot ".."

$bpPackRoot = Join-Path $projectRoot "behavior-pack"
$rpPackRoot = Join-Path $projectRoot "resource-pack"

$behaviorPacks = Get-ChildItem -Directory -LiteralPath $projectRoot -ErrorAction SilentlyContinue | Where-Object { 
    $lowerName = $_.Name.ToLower()
    $lowerName -like "*-bp" -or $lowerName -like "*_bp"
}
if (Test-Path -LiteralPath $bpPackRoot -PathType Container) {
    $behaviorPacks = @($behaviorPacks | ForEach-Object { $_ }; Get-Item -LiteralPath $bpPackRoot)
}

$resourcePacks = Get-ChildItem -Directory -LiteralPath $projectRoot -ErrorAction SilentlyContinue | Where-Object { 
    $lowerName = $_.Name.ToLower()
    $lowerName -like "*.rp" -or $lowerName -like "*_rp"
}
if (Test-Path -LiteralPath $rpPackRoot -PathType Container) {
    $resourcePacks = @($resourcePacks | ForEach-Object { $_ }; Get-Item -LiteralPath $rpPackRoot)
}

if ($PackType -eq "all" -or $PackType -eq "behavior-pack") {
    $sourceScriptsPath = Join-Path $projectRoot "scripts"
    $hasJsFiles = (Get-ChildItem -LiteralPath $sourceScriptsPath -Filter "*.js" -File -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
    if ($hasJsFiles -and $behaviorPacks.Count -gt 0) {
        Sync-BehaviorScripts -ProjectRoot $projectRoot -SourceScripts "scripts" -TargetScripts "behavior-pack\scripts"
    }
}

if ($PackType -eq "all" -or $PackType -eq "behavior-pack") {
    if (Test-Path -LiteralPath $bpPackRoot -PathType Container) {
        Write-Host "`n=== Processing behavior-pack ===" -ForegroundColor Cyan
        Invoke-PackBuild -PackRoot $bpPackRoot -PackType "behavior-pack" -MinecraftRoot $MinecraftRoot -ShouldSkipDeploy $SkipDeploy.IsPresent -ShouldSkipZip $NoZip.IsPresent
    }
    foreach ($bp in $behaviorPacks) {
        if ($bp.Name -ne "behavior-pack") {
            Write-Host "`n=== Processing $($bp.Name) ===" -ForegroundColor Cyan
            Invoke-PackBuild -PackRoot $bp.FullName -PackType "behavior-pack" -MinecraftRoot $MinecraftRoot -ShouldSkipDeploy $SkipDeploy.IsPresent -ShouldSkipZip $NoZip.IsPresent
        }
    }
}
if ($PackType -eq "all" -or $PackType -eq "resource-pack") {
    if (Test-Path -LiteralPath $rpPackRoot -PathType Container) {
        Write-Host "`n=== Processing resource-pack ===" -ForegroundColor Cyan
        Invoke-PackBuild -PackRoot $rpPackRoot -PackType "resource-pack" -MinecraftRoot $MinecraftRoot -ShouldSkipDeploy $SkipDeploy.IsPresent -ShouldSkipZip $NoZip.IsPresent
    }
    foreach ($rp in $resourcePacks) {
        if ($rp.Name -ne "resource-pack") {
            Write-Host "`n=== Processing $($rp.Name) ===" -ForegroundColor Cyan
            Invoke-PackBuild -PackRoot $rp.FullName -PackType "resource-pack" -MinecraftRoot $MinecraftRoot -ShouldSkipDeploy $SkipDeploy.IsPresent -ShouldSkipZip $NoZip.IsPresent
        }
    }
}