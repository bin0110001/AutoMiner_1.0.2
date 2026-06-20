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
import { startAutoMiner, getConfig, AutoMinerConfig } from "../machine/autoMiner";

const AUTO_MINER_HEALTH: Record<string, number> = {
  "minere:auto_miner": 6,
  "minere:stone_auto_miner": 4,
};

function placeMiner(event: ItemComponentUseOnEvent, entityId: string) {
  const player = event.source as Player;
  const inventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
  if (!getConfig(entityId)) {
    return;
  }

  const config = getConfig(entityId);
  const durability = event.itemStack.getComponent(ItemComponentTypes.Durability) as ItemDurabilityComponent;
  const fuel = (event.itemStack.getDynamicProperty("minere:fuel") as number) || 0;

  const dimension = event.block.dimension;
  const spawnedEntity = dimension.spawnEntity(entityId, {
    x: Math.floor(event.block.location.x) + 0.5,
    y: Math.round(event.block.location.y + 1),
    z: Math.floor(event.block.location.z) + 0.5,
  });
  spawnedEntity.setRotation({
    x: 0,
    y: Math.round(event.source.getRotation().y / 90) * 90,
  });

  spawnedEntity.setProperty("minere:fuel", fuel);
  spawnedEntity.setProperty("minere:durability", durability.maxDurability - durability.damage);
  const health = spawnedEntity.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
  health?.setCurrentValue(AUTO_MINER_HEALTH[entityId] || 6);

  startAutoMiner(spawnedEntity, config);

  if (event.source instanceof Player && event.source.getGameMode() == "creative") {
    return;
  }

  inventory.container.setItem(player.selectedSlotIndex, undefined);
}

export const AutoMinerItem: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    placeMiner(event, "minere:auto_miner");
  },
};

export const StoneAutoMinerItem: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    placeMiner(event, "minere:stone_auto_miner");
  },
};