import {
  system,
  Entity,
  EntityInventoryComponent,
  EntityComponentTypes,
  Vector3,
  EntityHealthComponent,
  EntityItemComponent,
  ItemStack,
  ItemComponentTypes,
  ItemDurabilityComponent,
  EntityDamageCause,
} from "@minecraft/server";
import { findItemInContainer, findAnyPlanks } from "item/item_utils";
import { addVector3, multiplyVector3Number } from "util/vector3Functions";

const BASE_FUEL_COST = 2;
const PICKUP_RANGE = 2;
const DAMAGE_RANGE = 0.75;
const DAMAGE = 2;
const GOLDEN_RAIL_MAX_INDEX = 16;

const RAIL_SPEEDS: Record<string, number> = {
  "minecraft:rail": 1.0,
  "minecraft:golden_rail": 2.0,
  "minere:copper_rail": 0.5,
  "minere:iron_rail": 1.0,
  "minere:diamond_rail": 3.0,
};

const threadMap = new Map<string, number>();
const disallowedBlocks = new Set<string>();
const replaceableBlocks = new Set<string>();
const durableBlocks = new Map<string, number>();

// unbreakable blocks
disallowedBlocks.add("minecraft:bedrock");
disallowedBlocks.add("minecraft:end_portal_frame");
disallowedBlocks.add("minecraft:reinforced_deepslate");
disallowedBlocks.add("minecraft:air");
disallowedBlocks.add("minecraft:fire");
disallowedBlocks.add("minecraft:soul_fire");
disallowedBlocks.add("minecraft:portal");
disallowedBlocks.add("minecraft:nether_portal");
disallowedBlocks.add("minecraft:end_portal");
disallowedBlocks.add("minecraft:structure_void");
disallowedBlocks.add("minecraft:structure_block");
disallowedBlocks.add("minecraft:jigsaw_block");
disallowedBlocks.add("minecraft:barrier");
disallowedBlocks.add("minecraft:command_block");
disallowedBlocks.add("minecraft:chain_command_block");
disallowedBlocks.add("minecraft:repeating_command_block");

// liquid
disallowedBlocks.add("minecraft:water");
disallowedBlocks.add("minecraft:flowing_water");
disallowedBlocks.add("minecraft:lava");
disallowedBlocks.add("minecraft:flowing_lava");

// no collision
disallowedBlocks.add("minecraft:torch");
disallowedBlocks.add("minecraft:redstone_torch");
disallowedBlocks.add("minecraft:soul_torch");
disallowedBlocks.add("minecraft:rail");
disallowedBlocks.add("minecraft:golden_rail");
disallowedBlocks.add("minecraft:activator_rail");

// replace blocks
replaceableBlocks.add("minecraft:air");
replaceableBlocks.add("minecraft:water");
replaceableBlocks.add("minecraft:flowing_water");
replaceableBlocks.add("minecraft:lava");
replaceableBlocks.add("minecraft:flowing_lava");
replaceableBlocks.add("minecraft:fire");
replaceableBlocks.add("minecraft:tall_grass");
replaceableBlocks.add("minecraft:short_grass");
replaceableBlocks.add("minecraft:fern");
replaceableBlocks.add("minecraft:glow_lichen");
replaceableBlocks.add("minecraft:vine");
replaceableBlocks.add("minecraft:warped_roots");
replaceableBlocks.add("minecraft:crimson_roots");
replaceableBlocks.add("minecraft:snow_layer");

// durable blocks
durableBlocks.set("minecraft:obsidian", 0.2);
durableBlocks.set("minecraft:crying_obsidian", 0.2);
durableBlocks.set("minecraft:ancient_debris", 0.25);
durableBlocks.set("minecraft:deepslate", 0.6);
durableBlocks.set("minecraft:cobbled_deepslate", 0.67);
durableBlocks.set("minecraft:deepslate_coal_ore", 0.67);
durableBlocks.set("minecraft:deepslate_iron_ore", 0.67);
durableBlocks.set("minecraft:deepslate_gold_ore", 0.67);
durableBlocks.set("minecraft:deepslate_redstone_ore", 0.67);
durableBlocks.set("minecraft:deepslate_diamond_ore", 0.67);
durableBlocks.set("minecraft:deepslate_emerald_ore", 0.67);
durableBlocks.set("minecraft:stone", 0.8);
durableBlocks.set("minecraft:andesite", 0.8);
durableBlocks.set("minecraft:diorite", 0.8);
durableBlocks.set("minecraft:granite", 0.8);
durableBlocks.set("minecraft:tuff", 0.8);
durableBlocks.set("minere:deepslate_amethyst_ore", 0.67);
durableBlocks.set("minere:deepslate_sulfur_ore", 0.67);
durableBlocks.set("minecraft:end_stone", 0.67);
durableBlocks.set("minecraft:end_bricks", 0.67);
durableBlocks.set("minere:enderon_ore", 0.67);
durableBlocks.set("minere:ender_plasma_ore", 0.67);

export function startAutoMiner(entity: Entity) {
  if (
    !entity ||
    !entity.isValid() ||
    entity == undefined ||
    entity.typeId != "minere:auto_miner"
  ) {
    return;
  }
  if (threadMap.has(entity.id)) {
    system.clearRun(threadMap.get(entity.id));
    threadMap.delete(entity.id);
  }
  const inventory = entity.getComponent(
    EntityComponentTypes.Inventory,
  ) as EntityInventoryComponent;
  const container = inventory.container;
  const rotation = entity.getRotation();
  const dimension = entity.dimension;
  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  const runId = system.runInterval(() => {
    if (
      !entity ||
      !entity.isValid() ||
      !container ||
      !inventory ||
      !dimension ||
      !health ||
      health?.currentValue <= 0 ||
      entity.isInWater ||
      entity.location.y < dimension.heightRange.min ||
      entity.location.y > dimension.heightRange.max
    ) {
      stopAutoMiner(entity);
      return system.clearRun(runId);
    }
    const currentBlock = dimension.getBlock(entity.location);
    if (currentBlock?.isValid() && currentBlock.isLiquid) {
      stopAutoMiner(entity);
      return system.clearRun(runId);
    }
    const fuel = entity.getProperty("minere:fuel") as number;
    const durability = entity.getProperty("minere:durability") as number;
    const is_on = entity.getProperty("minere:is_on") as boolean;
    const rail_placement_index = entity.getProperty(
      "minere:rail_index",
    ) as number;
    if (!fuel || !is_on) {
      stopAutoMiner(entity);
      return system.clearRun(runId);
    }

    // movement
    entity.setRotation(rotation);
    
    let speedMultiplier = 1.0;
    const blockUnderneath = dimension.getBlock(entity.location);
    if (blockUnderneath && RAIL_SPEEDS[blockUnderneath.typeId]) {
      speedMultiplier = RAIL_SPEEDS[blockUnderneath.typeId];
    }

    entity.applyImpulse(multiplyVector3Number(entity.getViewDirection(), 0.15 * speedMultiplier));

    let blocksBroken = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          // validate
          const pos: Vector3 = {
            x: entity.location.x + i,
            y: entity.location.y + j,
            z: entity.location.z + k,
          };
          if (
            pos.y < dimension.heightRange.min ||
            pos.y > dimension.heightRange.max
          ) {
            continue;
          }
          const block = dimension.getBlock(pos);
          if (!block || !block.isValid() || !entity.isOnGround) {
            continue;
          }
          // build bridge
          if (j == -1) {
            if (block.isAir || replaceableBlocks.has(block.typeId)) {
              const planksIndex = findAnyPlanks(container);
              if (planksIndex >= 0) {
                const planks = container.getItem(planksIndex);
                if (planks && planks.amount > 0) {
                  block.setType(planks.typeId);
                  if (planks.amount == 1) {
                    container.setItem(planksIndex);
                  } else {
                    planks.amount -= 1;
                    container.setItem(planksIndex, planks);
                  }
                }
              }
            }
          }
          // destroy
          if (j >= 0) {
            if (
              disallowedBlocks.has(block.typeId) ||
              replaceableBlocks.has(block.typeId) ||
              blocksBroken >= durability
            ) {
              continue;
            }
            if (durableBlocks.has(block.typeId)) {
              if (Math.random() > durableBlocks.get(block.typeId)) {
                continue;
              }
            }
            dimension.runCommand(
              `setBlock ${pos.x} ${pos.y} ${pos.z} air destroy`,
            );
            blocksBroken += 1;
          }
        }
      }
}
    let hasPlacedRail = false;
    let goldenRails = false;
    let railToPlace: string | null = null;
    if (
      entity.location.y > dimension.heightRange.min &&
      entity.location.y < dimension.heightRange.max &&
      entity.isOnGround
    ) {
      const block = dimension.getBlock(entity.location);
      if (
        block &&
        block.isValid() &&
        entity.isOnGround &&
        (block.isAir || replaceableBlocks.has(block.typeId))
      ) {
        for (const typeId of Object.keys(RAIL_SPEEDS)) {
          const railsIndex = findItemInContainer(container, typeId);
          if (railsIndex >= 0) {
            railToPlace = typeId;
            break;
          }
        }
        if (railToPlace) {
          dimension.runCommand(
            `setBlock ${entity.location.x} ${entity.location.y - 1} ${entity.location.z} ${railToPlace.replace("minere:", "minecraft:")}`,
          );
          hasPlacedRail = true;
          if (railToPlace === "minere:golden_rail") {
            goldenRails = true;
          }
        }
      }
    }

    const redstoneTorchIndex = findItemInContainer(
      container,
      "minecraft:redstone_torch",
    );
    const redstoneTorches =
      redstoneTorchIndex >= 0
        ? container.getItem(redstoneTorchIndex)
        : undefined;

    if (
      hasPlacedRail &&
      redstoneTorches &&
      redstoneTorches.amount > 0 &&
      rail_placement_index == 0
    ) {
      const yRot = rotation.y >= 0 ? rotation.y : rotation.y + 360;
      let torchPos = addVector3(entity.location, { x: 0, y: 0, z: 0 });
      if (yRot > 315 || yRot <= 45) {
        torchPos = addVector3(entity.location, { x: -1, y: 0, z: 0 });
      }
      if (yRot > 45 && yRot <= 135) {
        torchPos = addVector3(entity.location, { x: 0, y: 0, z: -1 });
      }
      if (yRot > 135 && yRot <= 225) {
        torchPos = addVector3(entity.location, { x: 1, y: 0, z: 0 });
      }
      if (yRot > 225 && yRot <= 315) {
        torchPos = addVector3(entity.location, { x: 0, y: 0, z: 1 });
      }
      const torchBlock = dimension.getBlock(torchPos);
      if (
        torchBlock &&
        torchBlock.isValid() &&
        (torchBlock.isAir || replaceableBlocks.has(torchBlock.typeId))
      ) {
        torchBlock.setType(redstoneTorches.typeId);
        if (redstoneTorches.amount == 1) {
          container.setItem(redstoneTorchIndex);
        } else {
          redstoneTorches.amount -= 1;
          container.setItem(redstoneTorchIndex, redstoneTorches);
        }
      }
    }

    const itemEntities = dimension.getEntities({
      type: "minecraft:item",
      location: entity.location,
      maxDistance: PICKUP_RANGE,
    }) as Entity[];
    for (let i = 0; i < itemEntities.length; i++) {
      const itemEntity = itemEntities[i];
      const item = itemEntity.getComponent(
        EntityComponentTypes.Item,
      ) as EntityItemComponent;
      if (item && item.itemStack.maxAmount >= 64) {
        const leftOver = container.addItem(item.itemStack);
        if (leftOver) {
          item.itemStack.amount = leftOver.amount;
        } else {
          itemEntity.remove();
        }
      }
    }

    // damage entities
    const mobEntities = dimension.getEntities({
      excludeFamilies: ["inanimate", "item"],
      excludeTypes: ["minecraft:item"],
      location: addVector3(entity.location, entity.getViewDirection()),
      maxDistance: DAMAGE_RANGE,
    });
    for (let i = 0; i < mobEntities.length; i++) {
      mobEntities[i].applyDamage(DAMAGE, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: entity,
      });
    }

    // update properties
    entity.setProperty(
      "minere:fuel",
      Math.max(0, fuel - (BASE_FUEL_COST + blocksBroken)),
    );
    entity.setProperty(
      "minere:durability",
      Math.max(0, durability - blocksBroken),
    );
    if (blocksBroken >= durability && durability > 0) {
      dimension.playSound("random.break", entity.location, {
        volume: 2.0,
        pitch: 0.75,
      });
      stopAutoMiner(entity);
      return system.clearRun(runId);
    }
    if (hasPlacedRail) {
      if (rail_placement_index <= 0) {
        entity.setProperty("minere:rail_index", GOLDEN_RAIL_MAX_INDEX);
      } else {
        entity.setProperty(
          "minere:rail_index",
          Math.max(0, rail_placement_index - 1),
        );
      }
    }
  }, 3);
  threadMap.set(entity.id, runId);
}

export function stopAutoMiner(entity: Entity) {
  if (
    !entity ||
    !entity.isValid() ||
    entity == undefined ||
    entity.typeId != "minere:auto_miner"
  ) {
    return;
  }
  entity.setProperty("minere:is_on", false);
}

export function minerDie(entity: Entity) {
  if (
    !entity ||
    !entity.isValid() ||
    entity == undefined ||
    entity.typeId != "minere:auto_miner"
  ) {
    return;
  }
  const dimension = entity.dimension;
  const fuel = entity.getProperty("minere:fuel") as number;
  const durability = entity.getProperty("minere:durability") as number;

  const itemStack: ItemStack = new ItemStack("minere:auto_miner_item");
  const durabilityComponent = itemStack.getComponent(
    ItemComponentTypes.Durability,
  ) as ItemDurabilityComponent;
  durabilityComponent.damage = durabilityComponent.damage =
    durabilityComponent.maxDurability - durability;
  if (fuel > 0) {
    itemStack.setDynamicProperty("minere:fuel", fuel);
  }
  dimension.spawnItem(itemStack, entity.location);
  entity.teleport({
    x: entity.location.x,
    y: entity.location.y - 20,
    z: entity.location.z,
  });
}
