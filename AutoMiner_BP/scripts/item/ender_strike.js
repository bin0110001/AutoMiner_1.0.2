import {
  system,
  world,
  EntityComponentTypes,
  EntityDamageCause,
} from "@minecraft/server";
import { addVector3, randomVector3 } from "util/vector3Functions";
import { checkCooldown } from "./item_utils";
export const EnderStrike = {
  onHitEntity(arg) {
    applyEnderStrike(arg);
  },
};
const strikeDamage = new Map();
const defaultStrike = {
  targetDamage: 2,
  multiDamage: 5,
  count: 3,
  range: 9,
};
strikeDamage.set("minere:enderon_sword", {
  targetDamage: 4,
  multiDamage: 6,
  count: 4,
  range: 10,
});
strikeDamage.set("minere:enderon_axe", {
  targetDamage: 7,
  multiDamage: 5,
  count: 2,
  range: 8,
});
export const applyEnderStrike = (data) => {
  if (data.attackingEntity.typeId !== "minecraft:player") {
    return;
  }
  const health = data.hitEntity.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return;
  }
  const player = data.attackingEntity;
  // check cooldown
  if (!checkCooldown(data?.itemStack, player)) {
    return;
  }
  const stats = strikeDamage.get(data.itemStack?.typeId) || defaultStrike;
  //apply to hit entity
  if (health.currentValue < stats.targetDamage) {
    data?.hitEntity.applyDamage(health.currentValue * 20, {
      cause: EntityDamageCause.magic,
      damagingEntity: data.attackingEntity,
    });
  } else {
    health.setCurrentValue(health.currentValue - stats.targetDamage);
  }
  enderEffects(data.hitEntity);
  //apply multi hits
  const entities = getNearbyEntities(
    data.attackingEntity,
    data.hitEntity,
    stats,
  );
  for (let i = 0; i < entities.length; i++) {
    system.runTimeout(() => {
      const entity = entities[i];
      entity.applyDamage(stats.multiDamage, {
        cause: EntityDamageCause.magic,
        damagingEntity: data.attackingEntity,
      });
      enderEffects(entity);
    }, i * 4);
  }
};
function getNearbyEntities(attacker, targetEntity, stats) {
  const typeFamily = targetEntity?.getComponent(
    EntityComponentTypes.TypeFamily,
  );
  let entities = targetEntity?.dimension
    .getEntities({
      closest: stats.count,
      location: targetEntity?.location,
      maxDistance: stats.range,
      families: typeFamily.getTypeFamilies(),
    })
    .filter((e) => e !== targetEntity && e !== attacker);
  return entities;
}
function enderEffects(entity) {
  world.playSound("mob.endermen.portal", entity.location, {
    volume: 2.0,
    pitch: 1.25,
  });
  for (let k = 0; k < 30; k++) {
    entity?.dimension.spawnParticle(
      "minecraft:end_chest",
      addVector3(entity.location, randomVector3(1)),
    );
  }
}
