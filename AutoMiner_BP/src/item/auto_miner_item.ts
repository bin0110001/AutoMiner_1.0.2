import {
  ItemComponentTypes,
  ItemCustomComponent,
  ItemComponentUseOnEvent,
  ItemDurabilityComponent,
  EntityInventoryComponent,
  EntityComponentTypes,
  Player,
  EntityHealthComponent,
} from "@minecraft/server";

const AUTO_MINER_ITEM_ID = "minere:auto_miner_item";
const AUTO_MINER_ENTITY_ID = "minere:auto_miner";
const DURABILITY_KEY = "minere:durability";
const FUEL_KEY = "minere:fuel";
const AUTO_MINER_HEALTH = 6;

export const AutoMinerItem: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    const player = event.source as Player;
    const inventory = player.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent;
    const item = inventory.container.getItem(player.selectedSlotIndex);
    if (!item || item.typeId != AUTO_MINER_ITEM_ID) {
      return;
    }

    const durability = event.itemStack.getComponent(
      ItemComponentTypes.Durability,
    ) as ItemDurabilityComponent;
    const fuel = (event.itemStack.getDynamicProperty(FUEL_KEY) as number) || 0;

    const itemDurability = item.getComponent(
      ItemComponentTypes.Durability,
    ) as ItemDurabilityComponent;
    if (itemDurability.damage != durability.damage) {
      return;
    }

    const dimension = event.block.dimension;
    const entity = dimension.spawnEntity(AUTO_MINER_ENTITY_ID, {
      x: Math.floor(event.block.location.x) + 0.5,
      y: Math.round(event.block.location.y + 1),
      z: Math.floor(event.block.location.z) + 0.5,
    });
    entity.setRotation({
      x: 0,
      y: Math.round(event.source.getRotation().y / 90) * 90,
    });

    entity.setProperty(
      DURABILITY_KEY,
      durability.maxDurability - durability.damage,
    );
    entity.setProperty(FUEL_KEY, fuel);
    const health = entity.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
    health?.setCurrentValue(AUTO_MINER_HEALTH);

    if (
      event.source instanceof Player &&
      event.source.getGameMode() == "creative"
    ) {
      return;
    }

    inventory.container.setItem(player.selectedSlotIndex, undefined);
  },
};
