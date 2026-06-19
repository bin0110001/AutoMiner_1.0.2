import {
  EntityComponentTypes,
  ItemComponentTypes,
  EquipmentSlot,
} from "@minecraft/server";
import { getItem } from "item/item_utils";
export const fireflyLamp = {
  onPlayerDestroy(arg) {
    const player = arg.player;
    if (!player) {
      return;
    }
    const dimension = player.dimension;
    const equipment = player.getComponent(EntityComponentTypes.Equippable);
    if (!equipment) {
      return;
    }
    const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
    if (!item) {
      return;
    }
    const durability = item.getComponent(ItemComponentTypes.Durability);
    if (!durability) {
      return;
    }
    const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
    if (!enchantable || !enchantable.hasEnchantment("silk_touch")) {
      const fireflyLamp = getItem(
        dimension,
        arg.block.location,
        "minere:firefly_lamp",
      );
      if (fireflyLamp) {
        fireflyLamp.remove();
        dimension.spawnEntity("minere:firefly", arg.block.location);
      }
    }
  },
};
