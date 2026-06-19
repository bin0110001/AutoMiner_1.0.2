import { EntityComponentTypes } from "@minecraft/server";
const healingItems = {
  "minecraft:honey_bottle": 2.0,
  "minecraft:potion": 2.0,
  "minecraft:milk_bucket": 4.0,
  "minecraft:mushroom_stew": 4.0,
  "minecraft:beetroot_soup": 4.0,
  "minecraft:suspicious_stew": 4.0,
  "minecraft:rabbit_stew": 7.0,
};
export const healFromItem = (data) => {
  if (data.source.typeId !== "minecraft:player") {
    return;
  }
  const player = data.source;
  const health = player.getComponent(EntityComponentTypes.Health);
  const itemId = data.itemStack.typeId;
  if (!!health && !!healingItems[itemId]) {
    const healingAmount = healingItems[itemId];
    health.setCurrentValue(health.currentValue + healingAmount);
  }
};
