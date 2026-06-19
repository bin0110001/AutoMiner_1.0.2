import { EntityComponentTypes, } from "@minecraft/server";
export function findAnyPlanks(container) {
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId.includes("planks")) {
            return i;
        }
    }
    return -1;
}
export function findItemInContainer(container, typeId) {
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId == typeId) {
            return i;
        }
    }
    return -1;
}
export function getItem(dimension, location, typeId) {
    const allItems = dimension.getEntities({
        type: "minecraft:item",
        closest: 1,
        location: location,
        maxDistance: 2,
    });
    const items = allItems.filter((entity) => {
        const item = entity.getComponent(EntityComponentTypes.Item);
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
