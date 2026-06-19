import { ItemComponentTypes, EntityComponentTypes, Player, } from "@minecraft/server";
const AUTO_MINER_ID = "minere:auto_miner";
const DURABILITY_KEY = "minere:durability";
const FUEL_KEY = "minere:fuel";
const AUTO_MINER_HEALTH = 6;
export const AutoMinerItem = {
    onUseOn(event) {
        const player = event.source;
        const inventory = player.getComponent(EntityComponentTypes.Inventory);
        const item = inventory.container.getItem(player.selectedSlotIndex);
        if (!item || item.typeId != AUTO_MINER_ID) {
            return;
        }
        const durability = event.itemStack.getComponent(ItemComponentTypes.Durability);
        const fuel = event.itemStack.getDynamicProperty(FUEL_KEY) || 0;
        const itemDurability = item.getComponent(ItemComponentTypes.Durability);
        if (itemDurability.damage != durability.damage) {
            return;
        }
        // place miner
        const dimension = event.block.dimension;
        const entity = dimension.spawnEntity(AUTO_MINER_ID, {
            x: Math.floor(event.block.location.x) + 0.5,
            y: Math.round(event.block.location.y + 1),
            z: Math.floor(event.block.location.z) + 0.5,
        });
        entity.setRotation({
            x: 0,
            y: Math.round(event.source.getRotation().y / 90) * 90,
        });
        entity.setProperty(DURABILITY_KEY, durability.maxDurability - durability.damage);
        entity.setProperty(FUEL_KEY, fuel);
        const health = entity.getComponent(EntityComponentTypes.Health);
        health?.setCurrentValue(AUTO_MINER_HEALTH);
        // delete item
        if (event.source instanceof Player &&
            event.source.getGameMode() == "creative") {
            return;
        }
        inventory.container.setItem(player.selectedSlotIndex, undefined);
    },
};
