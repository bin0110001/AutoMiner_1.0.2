import { system, EntityComponentTypes, ItemStack, ItemComponentTypes, EntityDamageCause, } from "@minecraft/server";
import { findItemInContainer, findAnyPlanks } from "item/item_utils";
import { addVector3, multiplyVector3Number } from "util/vector3Functions";
export const defaultConfig = {
    entityId: "minere:auto_miner",
    baseFuelCost: 2,
    pickupRange: 2,
    damageRange: 0.75,
    damage: 2,
    durability: 6000,
    maxRailIndex: 16,
};
export const stoneMinerConfig = {
    entityId: "minere:stone_auto_miner",
    baseFuelCost: 4,
    pickupRange: 2,
    damageRange: 0.75,
    damage: 2,
    durability: 2000,
    maxRailIndex: 0,
};
const configMap = {
    "minere:auto_miner": defaultConfig,
    "minere:stone_auto_miner": stoneMinerConfig,
};
export function getConfig(entityId) {
    return configMap[entityId] || defaultConfig;
}
const threadMap = new Map();
const disallowedBlocks = new Set();
const replaceableBlocks = new Set();
const durableBlocks = new Map();
disallowedBlocks.add("minecraft:bedrock");
disallowedBlocks.add("minecraft:end_portal_frame");
disallowedBlocks.add("minecraft:reinforced_deepslate");
disallowedBlocks.add("minecraft:air");
disallowedBlocks.add("minecraft:fire");
disallowedBlocks.add("minecraft:soul_fire");
disallowedBlocks.add("minecraft:portal");
disallowedBlocks.add("minecraft:nether_portal");
disallowedBlocks.add("minecraft:end_portal");
disallowedBlocks.add("minecraft:structure_void");
disallowedBlocks.add("minecraft:structure_block");
disallowedBlocks.add("minecraft:jigsaw_block");
disallowedBlocks.add("minecraft:barrier");
disallowedBlocks.add("minecraft:command_block");
disallowedBlocks.add("minecraft:chain_command_block");
disallowedBlocks.add("minecraft:repeating_command_block");
disallowedBlocks.add("minecraft:water");
disallowedBlocks.add("minecraft:flowing_water");
disallowedBlocks.add("minecraft:lava");
disallowedBlocks.add("minecraft:flowing_lava");
disallowedBlocks.add("minecraft:torch");
disallowedBlocks.add("minecraft:redstone_torch");
disallowedBlocks.add("minecraft:soul_torch");
disallowedBlocks.add("minecraft:rail");
disallowedBlocks.add("minecraft:golden_rail");
disallowedBlocks.add("minecraft:activator_rail");
replaceableBlocks.add("minecraft:air");
replaceableBlocks.add("minecraft:water");
replaceableBlocks.add("minecraft:flowing_water");
replaceableBlocks.add("minecraft:lava");
replaceableBlocks.add("minecraft:flowing_lava");
replaceableBlocks.add("minecraft:fire");
replaceableBlocks.add("minecraft:tall_grass");
replaceableBlocks.add("minecraft:short_grass");
replaceableBlocks.add("minecraft:fern");
replaceableBlocks.add("minecraft:glow_lichen");
replaceableBlocks.add("minecraft:vine");
replaceableBlocks.add("minecraft:warped_roots");
replaceableBlocks.add("minecraft:crimson_roots");
replaceableBlocks.add("minecraft:snow_layer");
durableBlocks.set("minecraft:obsidian", 0.2);
durableBlocks.set("minecraft:crying_obsidian", 0.2);
durableBlocks.set("minecraft:ancient_debris", 0.25);
durableBlocks.set("minecraft:deepslate", 0.6);
durableBlocks.set("minecraft:cobbled_deepslate", 0.67);
durableBlocks.set("minecraft:deepslate_coal_ore", 0.67);
durableBlocks.set("minecraft:deepslate_iron_ore", 0.67);
durableBlocks.set("minecraft:deepslate_gold_ore", 0.67);
durableBlocks.set("minecraft:deepslate_redstone_ore", 0.67);
durableBlocks.set("minecraft:deepslate_diamond_ore", 0.67);
durableBlocks.set("minecraft:deepslate_emerald_ore", 0.67);
durableBlocks.set("minecraft:stone", 0.8);
durableBlocks.set("minecraft:andesite", 0.8);
durableBlocks.set("minecraft:diorite", 0.8);
durableBlocks.set("minecraft:granite", 0.8);
durableBlocks.set("minecraft:tuff", 0.8);
durableBlocks.set("minere:deepslate_amethyst_ore", 0.67);
durableBlocks.set("minere:deepslate_sulfur_ore", 0.67);
durableBlocks.set("minecraft:end_stone", 0.67);
durableBlocks.set("minecraft:end_bricks", 0.67);
durableBlocks.set("minere:enderon_ore", 0.67);
durableBlocks.set("minere:ender_plasma_ore", 0.67);
export function startAutoMiner(entity, config = defaultConfig) {
    if (!entity || !entity.isValid() || entity.typeId != config.entityId) {
        return;
    }
    if (threadMap.has(entity.id)) {
        system.clearRun(threadMap.get(entity.id));
        threadMap.delete(entity.id);
    }
    const inventory = entity.getComponent(EntityComponentTypes.Inventory);
    const container = inventory.container;
    const rotation = entity.getRotation();
    const dimension = entity.dimension;
    const health = entity.getComponent(EntityComponentTypes.Health);
    const runId = system.runInterval(() => {
        if (!entity || !entity.isValid() || !container || !inventory || !dimension || !health || health?.currentValue <= 0 || entity.isInWater || entity.location.y < dimension.heightRange.min || entity.location.y > dimension.heightRange.max) {
            stopAutoMiner(entity, config);
            return system.clearRun(runId);
        }
        const currentBlock = dimension.getBlock(entity.location);
        if (currentBlock?.isValid() && currentBlock.isLiquid) {
            stopAutoMiner(entity, config);
            return system.clearRun(runId);
        }
        const fuel = entity.getProperty("minere:fuel");
        const durability = entity.getProperty("minere:durability");
        const is_on = entity.getProperty("minere:is_on");
        const rail_placement_index = entity.getProperty("minere:rail_index");
        if (!fuel || !is_on) {
            stopAutoMiner(entity, config);
            return system.clearRun(runId);
        }
        entity.setRotation(rotation);
        entity.applyImpulse(multiplyVector3Number(entity.getViewDirection(), 0.15));
        let blocksBroken = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    const pos = { x: entity.location.x + i, y: entity.location.y + j, z: entity.location.z + k };
                    if (pos.y < dimension.heightRange.min || pos.y > dimension.heightRange.max) {
                        continue;
                    }
                    const block = dimension.getBlock(pos);
                    if (!block || !block.isValid() || !entity.isOnGround) {
                        continue;
                    }
                    if (j == -1) {
                        if (block.isAir || replaceableBlocks.has(block.typeId)) {
                            const planksIndex = findAnyPlanks(container);
                            if (planksIndex >= 0) {
                                const planks = container.getItem(planksIndex);
                                if (planks && planks.amount > 0) {
                                    block.setType(planks.typeId);
                                    if (planks.amount == 1) {
                                        container.setItem(planksIndex);
                                    }
                                    else {
                                        planks.amount -= 1;
                                        container.setItem(planksIndex, planks);
                                    }
                                }
                            }
                        }
                    }
                    if (j >= 0) {
                        if (disallowedBlocks.has(block.typeId) || replaceableBlocks.has(block.typeId) || blocksBroken >= durability) {
                            continue;
                        }
                        if (durableBlocks.has(block.typeId)) {
                            if (Math.random() > durableBlocks.get(block.typeId)) {
                                continue;
                            }
                        }
                        dimension.runCommand(`setBlock ${pos.x} ${pos.y} ${pos.z} air destroy`);
                        blocksBroken += 1;
                    }
                }
            }
        }
        let hasPlacedRail = false;
        if (entity.location.y > dimension.heightRange.min && entity.location.y < dimension.heightRange.max && entity.isOnGround) {
            const block = dimension.getBlock(entity.location);
            if (block && block.isValid() && entity.isOnGround && (block.isAir || replaceableBlocks.has(block.typeId))) {
                const railsIndex = findItemInContainer(container, "minecraft:rail");
                const goldenRailsIndex = findItemInContainer(container, "minecraft:golden_rail");
                const redstoneTorchIndex = findItemInContainer(container, "minecraft:redstone_torch");
                const rails = railsIndex >= 0 ? container.getItem(railsIndex) : undefined;
                const goldenRails = goldenRailsIndex >= 0 ? container.getItem(goldenRailsIndex) : undefined;
                const redstoneTorches = redstoneTorchIndex >= 0 ? container.getItem(redstoneTorchIndex) : undefined;
                if (rails && rails.amount > 0 && (!goldenRails || rail_placement_index != 0)) {
                    block.setType(rails.typeId);
                    hasPlacedRail = true;
                    if (rails.amount == 1) {
                        container.setItem(railsIndex);
                    }
                    else {
                        rails.amount -= 1;
                        container.setItem(railsIndex, rails);
                    }
                }
                if (goldenRails && goldenRails.amount > 0 && (!rails || rail_placement_index == 0)) {
                    block.setType(goldenRails.typeId);
                    hasPlacedRail = true;
                    if (goldenRails.amount == 1) {
                        container.setItem(goldenRailsIndex);
                    }
                    else {
                        goldenRails.amount -= 1;
                        container.setItem(goldenRailsIndex, goldenRails);
                    }
                }
                if (goldenRails && redstoneTorches && redstoneTorches.amount > 0 && rail_placement_index == 0) {
                    const yRot = rotation.y >= 0 ? rotation.y : rotation.y + 360;
                    let torchPos = addVector3(entity.location, { x: 0, y: 0, z: 0 });
                    if (yRot > 315 || yRot <= 45) {
                        torchPos = addVector3(entity.location, { x: -1, y: 0, z: 0 });
                    }
                    if (yRot > 45 && yRot <= 135) {
                        torchPos = addVector3(entity.location, { x: 0, y: 0, z: -1 });
                    }
                    if (yRot > 135 && yRot <= 225) {
                        torchPos = addVector3(entity.location, { x: 1, y: 0, z: 0 });
                    }
                    if (yRot > 225 && yRot <= 315) {
                        torchPos = addVector3(entity.location, { x: 0, y: 0, z: 1 });
                    }
                    const torchBlock = dimension.getBlock(torchPos);
                    if (torchBlock && torchBlock.isValid() && (torchBlock.isAir || replaceableBlocks.has(torchBlock.typeId))) {
                        torchBlock.setType(redstoneTorches.typeId);
                        if (redstoneTorches.amount == 1) {
                            container.setItem(redstoneTorchIndex);
                        }
                        else {
                            redstoneTorches.amount -= 1;
                            container.setItem(redstoneTorchIndex, redstoneTorches);
                        }
                    }
                }
            }
        }
        const itemEntities = dimension.getEntities({ type: "minecraft:item", location: entity.location, maxDistance: config.pickupRange });
        for (let i = 0; i < itemEntities.length; i++) {
            const itemEntity = itemEntities[i];
            const item = itemEntity.getComponent(EntityComponentTypes.Item);
            if (item && item.itemStack.maxAmount >= 64) {
                const leftOver = container.addItem(item.itemStack);
                if (leftOver) {
                    item.itemStack.amount = leftOver.amount;
                }
                else {
                    itemEntity.remove();
                }
            }
        }
        const mobEntities = dimension.getEntities({ excludeFamilies: ["inanimate", "item"], excludeTypes: ["minecraft:item"], location: addVector3(entity.location, entity.getViewDirection()), maxDistance: config.damageRange });
        for (let i = 0; i < mobEntities.length; i++) {
            mobEntities[i].applyDamage(config.damage, { cause: EntityDamageCause.entityAttack, damagingEntity: entity });
        }
        entity.setProperty("minere:fuel", Math.max(0, fuel - (config.baseFuelCost + blocksBroken)));
        entity.setProperty("minere:durability", Math.max(0, durability - blocksBroken));
        if (blocksBroken >= durability && durability > 0) {
            dimension.playSound("random.break", entity.location, { volume: 2.0, pitch: 0.75 });
            stopAutoMiner(entity, config);
            return system.clearRun(runId);
        }
        if (hasPlacedRail) {
            if (rail_placement_index <= 0) {
                entity.setProperty("minere:rail_index", config.maxRailIndex);
            }
            else {
                entity.setProperty("minere:rail_index", Math.max(0, rail_placement_index - 1));
            }
        }
    }, 3);
    threadMap.set(entity.id, runId);
}
export function stopAutoMiner(entity, config = defaultConfig) {
    if (!entity || !entity.isValid() || entity.typeId != config.entityId) {
        return;
    }
    entity.setProperty("minere:is_on", false);
}
export function minerDie(entity, config = defaultConfig) {
    if (!entity || !entity.isValid() || entity.typeId != config.entityId) {
        return;
    }
    const dimension = entity.dimension;
    const fuel = entity.getProperty("minere:fuel");
    const durability = entity.getProperty("minere:durability");
    const itemStack = new ItemStack(config.entityId);
    const durabilityComponent = itemStack.getComponent(ItemComponentTypes.Durability);
    durabilityComponent.damage = durabilityComponent.damage = durabilityComponent.maxDurability - durability;
    if (fuel > 0) {
        itemStack.setDynamicProperty("minere:fuel", fuel);
    }
    dimension.spawnItem(itemStack, entity.location);
    entity.teleport({ x: entity.location.x, y: entity.location.y - 20, z: entity.location.z });
}
