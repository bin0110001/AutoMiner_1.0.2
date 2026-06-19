import { EntityComponentTypes, EquipmentSlot, system } from "@minecraft/server";
import {
  addVector3,
  multiplyVector3Number,
  getRandomAir,
} from "util/vector3Functions";
import { DEFAULT_TICK } from "main";
const VAMPIRE_HEAL_AMOUNT = 3;
const GOLD_DAMAGE_BOUNUS = 6;
export function vampireHeal(vampire, target) {
  if (vampire === null || target === null) {
    return;
  }
  const targetFamily = target.getComponent(EntityComponentTypes.TypeFamily);
  if (!targetFamily || targetFamily.getTypeFamilies().includes("undead")) {
    return;
  }
  const vampireHealth = vampire.getComponent(EntityComponentTypes.Health);
  if (!vampireHealth) {
    return;
  }
  vampireHealth.setCurrentValue(
    Math.min(
      vampireHealth.effectiveMax,
      vampireHealth.currentValue + VAMPIRE_HEAL_AMOUNT,
    ),
  );
}
export function vampireHurt(vampire, attacker) {
  if (!vampire || !attacker) {
    return;
  }
  const vampireHealth = vampire.getComponent(EntityComponentTypes.Health);
  if (!vampireHealth) {
    return;
  }
  const attackerEquippable = attacker.getComponent(
    EntityComponentTypes.Equippable,
  );
  if (!attackerEquippable) {
    return;
  }
  const weapon = attackerEquippable.getEquipmentSlot(EquipmentSlot.Mainhand);
  if (!weapon.getItem()) {
    return;
  }
  if (weapon.typeId.toLowerCase().includes("gold")) {
    vampireHealth.setCurrentValue(
      vampireHealth.currentValue - GOLD_DAMAGE_BOUNUS,
    );
  }
}
export function rollBecomeBat(entity, chance, minHealth) {
  if (!entity) {
    return;
  }
  const health = entity.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return;
  }
  if (
    health.currentValue > minHealth * health.effectiveMax ||
    health.currentValue <= health.effectiveMin
  ) {
    return;
  }
  const dimension = entity.dimension;
  const BAT_COOLDOWN = "batCooldown";
  const cooldownTime = 8;
  if (Math.random() > chance) {
    return;
  }
  const cooldown = entity.getDynamicProperty(BAT_COOLDOWN);
  if (
    !!cooldown &&
    typeof cooldown == "number" &&
    system.currentTick - cooldown < cooldownTime * DEFAULT_TICK
  ) {
    return;
  }
  entity.setDynamicProperty(BAT_COOLDOWN, system.currentTick);
  const pos = getRandomAir(entity.location, entity.dimension, 2.0, 3);
  if (pos) {
    dimension.spawnParticle("minere:big_smoke", entity.location);
    dimension.spawnParticle(
      "minere:big_smoke",
      multiplyVector3Number(addVector3(entity.location, pos), 0.5),
    );
    dimension.spawnParticle("minere:big_smoke", pos);
    entity.teleport(pos);
    dimension.playSound("mob.bat.takeoff", pos);
    entity.triggerEvent("become_bat");
  }
}
