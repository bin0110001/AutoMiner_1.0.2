import { world, system } from "@minecraft/server";
import {
  addVector3,
  multiplyVector3Number,
  directionVector3,
  distVector3,
  randomVector3,
} from "util/vector3Functions";
import { DEFAULT_TICK } from "main";
export function rollCastFire(caster, target, chance, delay = 0) {
  if (!caster || !target) {
    return;
  }
  const FIRE_COOLDOWN = "fireCooldown";
  const activationRange = 7; // min range to activate
  const maxRange = 14; // range fire will generate
  const cooldownTime = 8;
  if (Math.random() > chance) {
    return;
  }
  const dimension = world.getDimension(caster.dimension.id);
  if (!dimension) {
    return;
  }
  const cooldown = caster.getDynamicProperty(FIRE_COOLDOWN);
  if (
    !!cooldown &&
    typeof cooldown == "number" &&
    system.currentTick - cooldown < cooldownTime * DEFAULT_TICK
  ) {
    return;
  }
  caster.setDynamicProperty(FIRE_COOLDOWN, system.currentTick);
  system.runTimeout(() => {
    if (!caster || !caster.isValid) {
      return;
    }
    // actually shoot
    caster.triggerEvent("minere:demon_start_roar");
    system.runTimeout(() => {
      const dir = directionVector3(target.location, caster.location);
      for (let i = 1; i <= maxRange; i++) {
        system.runTimeout(() => {
          if (!caster) {
            return;
          }
          let isSuccessful = false;
          for (let k = 0; k < 3; k++) {
            if (isSuccessful) {
              break;
            }
            const pos = addVector3(
              addVector3(
                addVector3(caster.location, multiplyVector3Number(dir, i)),
                randomVector3(1.5),
              ),
              { x: 0, y: 1.0, z: 0 },
            );
            if (
              pos.y < dimension.heightRange.min ||
              pos.y > dimension.heightRange.max
            ) {
              return;
            }
            for (let j = -4; j < 8; j++) {
              if (pos.y - j - 1 <= dimension.heightRange.min) {
                break;
              }
              if (pos.y - j >= dimension.heightRange.max) {
                continue;
              }
              const block = dimension.getBlock({
                x: pos.x,
                y: pos.y - j,
                z: pos.z,
              });
              const below = dimension.getBlock({
                x: pos.x,
                y: pos.y - j - 1,
                z: pos.z,
              });
              if (
                block.isValid &&
                below.isValid &&
                block.isAir &&
                !below.isAir &&
                !below.isLiquid &&
                below.typeId !== "minecraft:fire"
              ) {
                world.playSound("mob.ghast.fireball", pos, {
                  volume: 0.25,
                  pitch: 1.25,
                });
                target.dimension.runCommand(
                  `setblock ${block.location.x} ${block.location.y} ${block.location.z} fire`,
                );
                isSuccessful = true;
                break;
              }
            }
          }
        }, i * 3);
      }
    }, 15);
  }, Math.random() * delay);
  if (distVector3(caster.location, target.location) > activationRange) {
    return;
  }
}
