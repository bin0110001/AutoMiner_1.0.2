import {
  system,
  world,
  EntityDamageCause,
  ItemComponentTypes,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { DEFAULT_TICK } from "main";
import { consumeXp } from "player/consumeXp";
import {
  addVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
const SHADOW_COOLDOWN = "echo_shadow_cooldown";
const SHADOW_TIME = 8 * 20;
const SHADOW_XP_COST = 10;
const SHADOW_DURABILITY_COST = 5;
const SHADOW_RANGE = 8;
const SONIC_RANGE = 24;
const SONIC_DAMAGE = 26;
const SONIC_SPLASH_RANGE = 5;
const SONIC_SPLASH_DAMAGE = 16;
const SONIC_XP_COST = 8;
const SONIC_DURABILITY_COST = 5;
const cooldownTime = 10;
export const useEchoStaff = (data) => {
  if (!data.source) {
    return;
  }
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  const cooldownComponent = data?.itemStack.getComponent(
    ItemComponentTypes.Cooldown,
  );
  if (itemStack.typeId == "minere:echo_staff") {
    system.run(() => {
      if (source.isSneaking) {
        // check cooldown property
        const cooldownProperty = source.getDynamicProperty(SHADOW_COOLDOWN);
        if (
          !!cooldownProperty &&
          typeof cooldownProperty == "number" &&
          system.currentTick - cooldownProperty < cooldownTime * DEFAULT_TICK
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        // check cooldown component
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
        }
        if (consumeXp(source, SHADOW_XP_COST)) {
          cooldownComponent.startCooldown(source);
          source.setDynamicProperty(SHADOW_COOLDOWN, system.currentTick);
          source.playSound("item.echo_staff.whoosh");
          source.addEffect("blindness", SHADOW_TIME, { showParticles: false });
          source.addEffect("invisibility", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("speed", SHADOW_TIME, {
            showParticles: false,
            amplifier: 2,
          });
          source.addEffect("jump_boost", SHADOW_TIME, {
            showParticles: false,
            amplifier: 3,
          });
          source.addEffect("slow_falling", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("regeneration", SHADOW_TIME, {
            showParticles: false,
          });
          source.addEffect("weakness", SHADOW_TIME, {
            showParticles: false,
          });
          // apply negative effects to nearby entities
          const nearbyEntities = dimension.getEntities({
            location: source.location,
            maxDistance: SHADOW_RANGE,
          });
          nearbyEntities.forEach((entity) => {
            entity.addEffect("blindness", SHADOW_TIME / 2, {
              showParticles: false,
            });
          });
          for (let i = 0; i < SHADOW_TIME / 4; i++) {
            system.runTimeout(() => {
              nearbyEntities.forEach((entity) => {
                if (entity?.location) {
                  dimension.spawnParticle("minere:big_smoke", {
                    x: entity.location.x,
                    y: entity.location.y + 1,
                    z: entity.location.z,
                  });
                }
              });
            }, i * 4);
          }
          reduceDurability(source, itemStack, SHADOW_DURABILITY_COST);
        } else {
          source.playSound("item.amethyst_staff.error");
        }
        return;
      } else {
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
        }
        if (!consumeXp(source, SONIC_XP_COST)) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        cooldownComponent.startCooldown(source);
        source.playSound("mob.warden.sonic_charge");
        system.runTimeout(() => {
          // get direct hits
          const raycastHits = source.getEntitiesFromViewDirection({
            maxDistance: SONIC_RANGE,
          });
          raycastHits.forEach((raycastHit) => {
            const entity = raycastHit.entity;
            if (entity?.location) {
              dimension.spawnParticle(
                "minecraft:sonic_explosion",
                entity.location,
              );
            }
          });
          // get splash hits
          let targetLocation = source.getBlockFromViewDirection({
            maxDistance: SONIC_RANGE,
          })?.block?.location;
          if (!targetLocation) {
            targetLocation = addVector3(
              source.getHeadLocation(),
              multiplyVector3Number(source.getViewDirection(), SONIC_RANGE),
            );
          }
          const splashEntities = dimension
            .getEntities({
              location: targetLocation,
              maxDistance: SONIC_SPLASH_RANGE,
            })
            .filter((entity) => entity !== source);
          splashEntities.forEach((entity) => {
            if (entity?.location) {
              dimension.spawnParticle(
                "minecraft:sonic_explosion",
                entity.location,
              );
            }
          });
          // generate line of particles
          const dist = distVector3(source.location, targetLocation);
          for (let i = 1; i < dist; i++) {
            dimension.spawnParticle(
              "minecraft:sonic_explosion",
              addVector3(
                source.getHeadLocation(),
                multiplyVector3Number(source.getViewDirection(), i),
              ),
            );
          }
          system.runTimeout(() => {
            reduceDurability(source, itemStack, SONIC_DURABILITY_COST);
            source.playSound("mob.warden.sonic_boom");
            raycastHits.forEach((raycastHit) => {
              const entity = raycastHit.entity;
              if (entity?.location) {
                entity.applyDamage(SONIC_DAMAGE, {
                  damagingEntity: source,
                  damagingProjectile: source,
                  cause:
                    entity.typeId === "minecraft:player"
                      ? EntityDamageCause.entityAttack
                      : EntityDamageCause.sonicBoom,
                });
              }
            });
            splashEntities.forEach((entity) => {
              if (entity?.location) {
                entity.applyDamage(SONIC_SPLASH_DAMAGE, {
                  damagingEntity: source,
                  damagingProjectile: source,
                  cause:
                    entity.typeId === "minecraft:player"
                      ? EntityDamageCause.entityAttack
                      : EntityDamageCause.sonicBoom,
                });
              }
            });
          }, 10);
        }, 30);
      }
    });
  }
};
