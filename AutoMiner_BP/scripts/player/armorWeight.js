import {
  EntityComponentTypes,
  EquipmentSlot,
  ItemComponentTypes,
} from "@minecraft/server";
const BASE_MOVEMENT = 0.1;
const HEAVY_ARMOR_MULT = 0.95;
const LIGHT_ARMOR_MULT = 1.05;
const SPRINT_MULT = 1.3;
const SNEAK_MULT = 0.3;
export function armorWeight(player) {
  if (!player) {
    return;
  }
  let diff = (LIGHT_ARMOR_MULT - HEAVY_ARMOR_MULT) / 4;
  const equippable = player?.getComponent(EntityComponentTypes.Equippable);
  const movementCopmonent = player?.getComponent("movement");
  if (!equippable || !movementCopmonent) {
    return;
  }
  const heavyCount =
    getItemWeight(equippable.getEquipment(EquipmentSlot.Head)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Chest)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Legs)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Feet));
  let baseMoveSpeed = LIGHT_ARMOR_MULT - heavyCount * diff;
  if (player.isSprinting) {
    baseMoveSpeed *= SPRINT_MULT;
  }
  const finalSpeedValue =
    BASE_MOVEMENT *
    baseMoveSpeed *
    getPotionModifier(player) *
    getSoulSpeedMultiplier(player);
  movementCopmonent.setCurrentValue(finalSpeedValue);
}
function getItemWeight(item) {
  if (!item) {
    return 0;
  }
  if (!item.getComponent(ItemComponentTypes.Durability)) {
    return 0;
  }
  if (!item.getComponent(ItemComponentTypes.Enchantable)) {
    return 0;
  }
  if (
    item.typeId.includes("leather") ||
    item.typeId.includes("chain") ||
    item.typeId.includes("elytra") ||
    item.typeId.includes("enderon")
  ) {
    return 0;
  }
  return 1;
}
function getSoulSpeedMultiplier(player) {
  if (!player) {
    return 1.0;
  }
  if (!player?.isOnGround) {
    return 1.0;
  }
  if (player.location.y - 0.75 < player.dimension.heightRange.min) {
    return 1.0;
  }
  const block = player.dimension.getBlock({
    x: player.location.x,
    y: player.location.y - 0.75,
    z: player.location.z,
  });
  if (!block) {
    return 1.0;
  }
  if (!block?.typeId.includes("soul")) {
    return 1.0;
  }
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (!equippable) {
    return 1.0;
  }
  const feet = equippable.getEquipment(EquipmentSlot.Feet);
  if (!feet) {
    return 1.0;
  }
  const enchantable = feet.getComponent(ItemComponentTypes.Enchantable);
  if (!enchantable) {
    return 1.0;
  }
  if (enchantable.hasEnchantment("soul_speed")) {
    const level = enchantable.getEnchantment("soul_speed").level;
    if (level === 1) {
      return 1.405;
    }
    if (level === 2) {
      return 1.51;
    }
    if (level === 3) {
      return 1.615;
    }
  }
  return 1.0;
}
function getSneakMultiplier(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (!equippable) {
    return SNEAK_MULT;
  }
  const leggings = equippable.getEquipment(EquipmentSlot.Legs);
  if (!leggings) {
    return SNEAK_MULT;
  }
  const enchantable = leggings.getComponent(ItemComponentTypes.Enchantable);
  if (!enchantable) {
    return SNEAK_MULT;
  }
  if (enchantable.hasEnchantment("swift_sneak")) {
    return Math.min(
      1.0,
      SNEAK_MULT + 0.15 * enchantable.getEnchantment("swift_sneak").level,
    );
  }
  return SNEAK_MULT;
}
function getPotionModifier(player) {
  let speedMod = 0;
  const speedEffect = player.getEffect("speed");
  if (speedEffect) {
    speedMod = 0.2 + 0.2 * speedEffect.amplifier;
  }
  let slownessMod = 0;
  const slownessEffect = player.getEffect("slowness");
  if (slownessEffect) {
    slownessMod = -1 * (0.2 + 0.2 * slownessEffect.amplifier);
  }
  return 1.0 + speedMod + slownessMod;
}
