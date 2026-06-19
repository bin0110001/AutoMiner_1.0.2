import { ItemComponentTypes } from "@minecraft/server";
import { consumeXp } from "player/consumeXp";
const XP_COST = 1;
export const fireInfintyBowAfter = (data) => {
  const dimension = data.source.dimension;
  if (data.itemStack.typeId !== "minecraft:bow" || dimension == null) {
    return;
  }
  const enchantments = data.itemStack.getComponent(
    ItemComponentTypes.Enchantable,
  );
  if (!enchantments || !enchantments.getEnchantment("infinity")) {
    return;
  }
  if (consumeXp(data.source, XP_COST)) {
    return;
  } else {
    const items = dimension.getEntities({
      type: "arrow",
      closest: 1,
      location: data.source.location,
      maxDistance: 5,
    });
    if (items.length) {
      dimension.spawnParticle("minecraft:dust_plume", items[0].location);
      items[0].remove();
    }
    data.source.playSound("item.amethyst_staff.error");
  }
};
