import {
  Container,
  Dimension,
  Vector3,
  Entity,
  EntityComponentTypes,
  EntityItemComponent,
} from "@minecraft/server";

export function findAnyPlanks(container: Container): number {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId.includes("planks")) {
      return i;
    }
  }
  return -1;
}

export function findItemInContainer(
  container: Container,
  typeId: string,
): number {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId == typeId) {
      return i;
    }
  }
  return -1;
}

export function getItem(
  dimension: Dimension,
  location: Vector3,
  typeId: string,
): Entity | undefined {
  const allItems = dimension.getEntities({
    type: "minecraft:item",
    closest: 1,
    location: location,
    maxDistance: 2,
  }) as Entity[];
  const items = allItems.filter((entity: Entity) => {
    const item = entity.getComponent(
      EntityComponentTypes.Item,
    ) as EntityItemComponent;
    if (!item) {
      return false;
    }
    if (item.itemStack.typeId === typeId) {
      return true;
    }
  });
  if (items.length < 1) {
    return;
  }
  return items[0];
}
