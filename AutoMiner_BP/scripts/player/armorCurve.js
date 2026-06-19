import {
  EntityComponentTypes,
  EntityDamageCause,
  ItemComponentTypes,
  EquipmentSlot,
} from "@minecraft/server";
const defenseMap = new Map();
// helmets
defenseMap.set("minecraft:leather_helmet", 1);
defenseMap.set("minecraft:golden_helmet", 2);
defenseMap.set("minecraft:chainmail_helmet", 2);
defenseMap.set("minecraft:iron_helmet", 2);
defenseMap.set("minecraft:turtle_helmet", 2);
defenseMap.set("minecraft:diamond_helmet", 3);
// chestplates
defenseMap.set("minecraft:leather_chestplate", 3);
defenseMap.set("minecraft:golden_chestplate", 5);
defenseMap.set("minecraft:chainmail_chestplate", 5);
defenseMap.set("minecraft:iron_chestplate", 6);
defenseMap.set("minecraft:diamond_chestplate", 8);
// leggings
defenseMap.set("minecraft:leather_leggings", 2);
defenseMap.set("minecraft:golden_leggings", 3);
defenseMap.set("minecraft:chainmail_leggings", 4);
defenseMap.set("minecraft:iron_leggings", 5);
defenseMap.set("minecraft:diamond_leggings", 6);
// boots
defenseMap.set("minecraft:leather_boots", 1);
defenseMap.set("minecraft:golden_boots", 1);
defenseMap.set("minecraft:chainmail_boots", 1);
defenseMap.set("minecraft:iron_boots", 2);
defenseMap.set("minecraft:diamond_boots", 3);
const MAX_REDUCTION_CAP = 32;
export const armorCurve = (player, damage, damageSource) => {
  const cause = damageSource.cause;
  if (
    cause == EntityDamageCause.void ||
    cause == EntityDamageCause.starve ||
    cause == EntityDamageCause.suffocation ||
    cause == EntityDamageCause.temperature ||
    cause == EntityDamageCause.sonicBoom ||
    cause == EntityDamageCause.override ||
    cause == EntityDamageCause.suicide
  ) {
    return;
  }
  const health = player.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return;
  }
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (!equippable) {
    return;
  }
  const armorCurveDiff = getArmorCurveDiff(equippable, damage, cause);
  const protectionDiff = getProtectionDiff(equippable, damage, cause);
  health.setCurrentValue(
    Math.min(
      health.currentValue + armorCurveDiff + protectionDiff,
      health.effectiveMax,
    ),
  );
};
function getArmorCurveDiff(equippable, damage, cause) {
  if (
    cause != EntityDamageCause.entityAttack &&
    cause != EntityDamageCause.ramAttack &&
    cause != EntityDamageCause.projectile &&
    cause != EntityDamageCause.blockExplosion &&
    cause != EntityDamageCause.entityExplosion &&
    cause != EntityDamageCause.fireworks &&
    cause != EntityDamageCause.anvil &&
    cause != EntityDamageCause.fire &&
    cause != EntityDamageCause.contact &&
    cause != EntityDamageCause.charging &&
    cause != EntityDamageCause.lightning
  ) {
    return 0;
  }
  if (damage > MAX_REDUCTION_CAP) {
    return 0;
  }
  let reductionCap = MAX_REDUCTION_CAP - damage;
  let reductionPercent = 0;
  reductionPercent =
    reductionPercent +
    1.6 * getDefenseDifference(equippable, EquipmentSlot.Head);
  reductionPercent =
    reductionPercent +
    1.6 * getDefenseDifference(equippable, EquipmentSlot.Chest);
  reductionPercent =
    reductionPercent +
    1.6 * getDefenseDifference(equippable, EquipmentSlot.Legs);
  reductionPercent =
    reductionPercent +
    1.6 * getDefenseDifference(equippable, EquipmentSlot.Feet);
  reductionPercent = Math.min(reductionCap, reductionPercent) / 100.0;
  return reductionPercent * damage;
}
function getProtectionDiff(equippable, damage, cause) {
  if (hasEnchantment(equippable, "fire_protection")) {
    if (
      cause == EntityDamageCause.fire ||
      cause == EntityDamageCause.fireTick ||
      cause == EntityDamageCause.campfire ||
      cause == EntityDamageCause.soulCampfire ||
      cause == EntityDamageCause.lava ||
      cause == EntityDamageCause.magma
    ) {
      return 0;
    }
  }
  if (hasEnchantment(equippable, "projectile_protection")) {
    if (cause == EntityDamageCause.projectile) {
      return 0;
    }
  }
  if (hasEnchantment(equippable, "blast_protection")) {
    if (
      cause == EntityDamageCause.entityExplosion ||
      cause == EntityDamageCause.blockExplosion ||
      cause == EntityDamageCause.fireworks
    ) {
      return 0;
    }
  }
  if (hasEnchantment(equippable, "feather_falling")) {
    if (cause == EntityDamageCause.fall) {
      return 0;
    }
  }
  const totalProt =
    getProtectionValue(equippable, EquipmentSlot.Head) +
    getProtectionValue(equippable, EquipmentSlot.Chest) +
    getProtectionValue(equippable, EquipmentSlot.Legs) +
    getProtectionValue(equippable, EquipmentSlot.Feet);
  const damagePreProt = damage / ((100 - Math.min(80, totalProt * 4)) / 100);
  let newDamageReduction = 0;
  for (let i = 0; i < totalProt; i++) {
    if (i < 4) {
      newDamageReduction += 4;
      //1.19
    }
    if (i >= 4 && i < 8) {
      newDamageReduction += 3;
      //1.38
    }
    if (i >= 8 && i < 12) {
      newDamageReduction += 2;
      //1.5625
    }
    if (i >= 12) {
      newDamageReduction += 1;
      //1.6667
    }
  }
  const newDamage = damagePreProt * (1 - newDamageReduction / 100);
  const damageDiff = damage - newDamage;
  return damageDiff;
}
function hasEnchantment(equippable, enchantment) {
  // helmet
  const helmetSlot = equippable.getEquipmentSlot(EquipmentSlot.Head);
  if (helmetSlot && helmetSlot.getItem()) {
    const itemEnchantableComponent = helmetSlot
      .getItem()
      .getComponent(ItemComponentTypes.Enchantable);
    if (
      itemEnchantableComponent &&
      itemEnchantableComponent.getEnchantment(enchantment)
    ) {
      return true;
    }
  }
  // chest
  const chestSlot = equippable.getEquipmentSlot(EquipmentSlot.Chest);
  if (chestSlot && chestSlot.getItem()) {
    const itemEnchantableComponent = chestSlot
      .getItem()
      .getComponent(ItemComponentTypes.Enchantable);
    if (
      itemEnchantableComponent &&
      itemEnchantableComponent.getEnchantment(enchantment)
    ) {
      return true;
    }
  }
  // legs
  const legsSlot = equippable.getEquipmentSlot(EquipmentSlot.Legs);
  if (legsSlot && legsSlot.getItem()) {
    const itemEnchantableComponent = legsSlot
      .getItem()
      .getComponent(ItemComponentTypes.Enchantable);
    if (
      itemEnchantableComponent &&
      itemEnchantableComponent.getEnchantment(enchantment)
    ) {
      return true;
    }
  }
  // feet
  const feetSlot = equippable.getEquipmentSlot(EquipmentSlot.Feet);
  if (feetSlot && feetSlot.getItem()) {
    const itemEnchantableComponent = feetSlot
      .getItem()
      .getComponent(ItemComponentTypes.Enchantable);
    if (
      itemEnchantableComponent &&
      itemEnchantableComponent.getEnchantment(enchantment)
    ) {
      return true;
    }
  }
  return false;
}
function getProtectionValue(equippable, slot) {
  const containerSlot = equippable.getEquipmentSlot(slot);
  if (!containerSlot.hasItem()) {
    return 0;
  }
  const item = containerSlot.getItem();
  const itemEnchantableComponent = item.getComponent(
    ItemComponentTypes.Enchantable,
  );
  if (!itemEnchantableComponent) {
    return 0;
  }
  const prot = itemEnchantableComponent.getEnchantment("protection");
  if (!prot) {
    return 0;
  }
  return prot.level;
}
function getDefenseDifference(equippable, slot) {
  const containerSlot = equippable.getEquipmentSlot(slot);
  if (!containerSlot.hasItem()) {
    return 0;
  }
  const item = containerSlot.getItem();
  if (!defenseMap.has(item.typeId)) {
    return 0;
  }
  const materialBonus = item.typeId.includes("iron") ? 2 : 0;
  switch (slot) {
    case EquipmentSlot.Head:
      return (
        defenseMap.get("minecraft:diamond_helmet") -
        defenseMap.get(item.typeId) +
        materialBonus
      );
    case EquipmentSlot.Chest:
      return (
        defenseMap.get("minecraft:diamond_chestplate") -
        defenseMap.get(item.typeId) +
        materialBonus
      );
    case EquipmentSlot.Legs:
      return (
        defenseMap.get("minecraft:diamond_leggings") -
        defenseMap.get(item.typeId) +
        materialBonus
      );
    case EquipmentSlot.Feet:
      return (
        defenseMap.get("minecraft:diamond_boots") -
        defenseMap.get(item.typeId) +
        materialBonus
      );
  }
  return 0;
}
