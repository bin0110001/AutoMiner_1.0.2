import {
  system,
  world,
  Entity,
  EntityRemoveBeforeEvent,
  EntityComponentTypes,
  ItemStack,
  Vector3,
  EntityItemComponent,
} from "@minecraft/server";
import { getItem } from "./item_utils";

const replaceMap = new Map<string, string>();
replaceMap.set("minere:advanced_minecart", "minere:advanced_minecart");

export const replaceMinecart = (data: EntityRemoveBeforeEvent) => {
  if (!replaceMap.has(data.removedEntity.typeId)) {
    return;
  }
  const toReplaceWith = replaceMap.get(data.removedEntity.typeId);

  const dimension = world.getDimension(data.removedEntity.dimension.id);
  if (!dimension) {
    return;
  }

  const location: Vector3 = {
    x: data.removedEntity.location.x,
    y: data.removedEntity.location.y,
    z: data.removedEntity.location.z,
  };
  system.run(() => {
    const minecart = getItem(dimension, location, "minecraft:minecart");
    if (minecart) {
      minecart.remove();
      const advancedMinecartItem = new ItemStack(toReplaceWith, 1);
      dimension.spawnItem(advancedMinecartItem, location);
    }
  });
};
