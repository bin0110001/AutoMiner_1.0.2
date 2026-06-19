import {
  world,
  EntityComponentTypes,
  EquipmentSlot,
  system,
  BlockVolume,
  ItemComponentTypes,
} from "@minecraft/server";
import { Queue } from "util/queue";
import { isValid, vector3ToString } from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
import { customToolHandleDurability } from "./custom_tools";
const LEAF_HORIZONTAL_DISTANCE = 5;
const LOG_HORIZONTAL_DISTANCE = 4;
const MAX_VERTICAL_DISTANCE = 64;
const HORIZONTAL_CHECK_DISTANCE = 8;
const VERTICAL_CHECK_DISTANCE = 0;
const ALTITUDE_BONUS_START = 12;
const ALTITUDE_BONUS = 3;
const REMAINING_DURABILITY_MULTIPLIER = 1.5;
const MINIMUM_BREAK_AMOUNT = 5;
const TREE_BREAK_DELAY = 2;
export const logSet = new Set();
// logs
logSet.add("minecraft:log");
logSet.add("minecraft:stripped_log");
logSet.add("minecraft:oak_log");
logSet.add("minecraft:stripped_oak_log");
logSet.add("minecraft:dark_oak_log");
logSet.add("minecraft:stripped_dark_oak_log");
logSet.add("minecraft:pale_oak_log");
logSet.add("minecraft:stripped_pale_oak_log");
logSet.add("minecraft:birch_log");
logSet.add("minecraft:stripped_birch_log");
logSet.add("minecraft:spruce_log");
logSet.add("minecraft:stripped_spruce_log");
logSet.add("minecraft:jungle_log");
logSet.add("minecraft:stripped_jungle_log");
logSet.add("minecraft:acacia_log");
logSet.add("minecraft:stripped_acacia_log");
logSet.add("minecraft:cherry_log");
logSet.add("minecraft:stripped_cherry_log");
logSet.add("minecraft:mangrove_log");
logSet.add("minecraft:stripped_mangrove_log");
// stems
logSet.add("minecraft:brown_mushroom_stem");
logSet.add("minecraft:red_mushroom_stem");
logSet.add("minecraft:crimson_stem");
logSet.add("minecraft:stripped_crimson_stem");
logSet.add("minecraft:warped_stem");
logSet.add("minecraft:stripped_warped_stem");
// leaves
const leavesSet = new Set();
leavesSet.add("minecraft:leaves");
leavesSet.add("minecraft:oak_leaves");
leavesSet.add("minecraft:dark_oak_leaves");
leavesSet.add("minecraft:pale_oak_leaves");
leavesSet.add("minecraft:birch_leaves");
leavesSet.add("minecraft:spruce_leaves");
leavesSet.add("minecraft:jungle_leaves");
leavesSet.add("minecraft:acacia_leaves");
leavesSet.add("minecraft:azalea_leaves");
leavesSet.add("minecraft:azalea_leaves_flowered");
leavesSet.add("minecraft:cherry_leaves");
leavesSet.add("minecraft:mangrove_leaves");
// mushroom_blocks
const mushroomSet = new Set();
mushroomSet.add("minecraft:red_mushroom_block");
mushroomSet.add("minecraft:brown_mushroom_block");
mushroomSet.add("minecraft:nether_wart_block");
mushroomSet.add("minecraft:crimson_wart_block");
mushroomSet.add("minecraft:warped_wart_block");
mushroomSet.add("shroomlight");
mushroomSet.add("minecraft:shroomlight");
mushroomSet.add("minecraft:shroom_light");
const leavesAndMushrooms = new Set(...leavesSet, ...mushroomSet);
function checkWidthWithOffset(dimension, origin, yOffset) {
  let max_distance = 0;
  // check X+
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x + i,
        y: origin.y + yOffset,
        z: origin.z,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log) {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check X-
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x - i,
        y: origin.y + yOffset,
        z: origin.z,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log) {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check Z+
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x,
        y: origin.y + yOffset,
        z: origin.z + i,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log) {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check Z-
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x,
        y: origin.y + yOffset,
        z: origin.z - i,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log) {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  return max_distance + 1;
}
function checkWidth(dimension, origin) {
  let max = 0;
  for (
    let i = -1 * VERTICAL_CHECK_DISTANCE;
    i <= VERTICAL_CHECK_DISTANCE;
    i++
  ) {
    const size = checkWidthWithOffset(dimension, origin, i);
    if (size > max) {
      max = size;
    }
  }
  return max;
}
export function checkIsType(dimension, location, typeSet, typeNames) {
  if (!isValid(dimension, location)) {
    return;
  }
  const block = dimension.getBlock(location);
  if (!block?.typeId) {
    return;
  }
  if (typeSet.has(block.typeId)) {
    return block;
  }
  for (let i = 0; i < typeNames.length; i++) {
    if (block.typeId.includes(typeNames[i])) {
      return block;
    }
  }
  return;
}
function getNeighbors(dimension, location, from, to) {
  const neighbors = [];
  const blockVolume = new BlockVolume(
    {
      x: location.x + from.x,
      y: Math.max(dimension.heightRange.min, location.y + from.y),
      z: location.z + from.z,
    },
    {
      x: location.x + to.x,
      y: Math.min(dimension.heightRange.max, location.y + to.y),
      z: location.z + to.z,
    },
  );
  const listBlockVolume = dimension.getBlocks(blockVolume, {
    excludeTypes: ["minecraft:air"],
  });
  const iterator = listBlockVolume.getBlockLocationIterator();
  let next = iterator.next();
  while (!next.done) {
    if (next.value !== location) {
      neighbors.push(next.value);
    }
    next = iterator.next();
  }
  return neighbors;
}
function checkRange(origin, location, horizontalDistance, verticalDistance) {
  if (Math.abs(origin.x - location.x) > horizontalDistance) {
    return false;
  }
  if (Math.abs(origin.y - location.y) > verticalDistance) {
    return false;
  }
  if (Math.abs(origin.z - location.z) > horizontalDistance) {
    return false;
  }
  return true;
}
function treecapitate(dimension, origin, durability) {
  let highest = 0;
  const visited = new Set();
  const queue = new Queue();
  const logs = new Set();
  const leaves = new Set();
  queue.enqueue(origin);
  while (!queue.isEmpty()) {
    const next = queue.dequeue();
    if (next.y - origin.y > highest) {
      highest = next.y - origin.y;
    }
    visited.add(vector3ToString(next));
    const neighbors = getNeighbors(
      dimension,
      next,
      {
        x: -1,
        y: 0,
        z: -1,
      },
      {
        x: 1,
        y: 1,
        z: 1,
      },
    );
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const neighborString = vector3ToString(neighbors[i]);
      if (visited.has(neighborString)) {
        continue;
      }
      visited.add(neighborString);
      const altitude = neighbor.y - origin.y;
      if (
        checkRange(
          origin,
          neighbor,
          LOG_HORIZONTAL_DISTANCE +
            (altitude > ALTITUDE_BONUS_START ? ALTITUDE_BONUS : 0),
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, logSet, ["log", "stem"])
      ) {
        logs.add(neighbor);
        queue.enqueue(neighbor);
      } else if (
        checkRange(
          origin,
          neighbor,
          LEAF_HORIZONTAL_DISTANCE +
            (altitude > ALTITUDE_BONUS_START ? ALTITUDE_BONUS : 0),
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, leavesAndMushrooms, [
          "leaves",
          "shroom_block",
          "wart_block",
          "shroomlight",
        ])
      ) {
        leaves.add(neighbor);
      }
    }
  }
  if (
    logs.size >
    REMAINING_DURABILITY_MULTIPLIER * durability + MINIMUM_BREAK_AMOUNT
  ) {
    world.playSound("item.amethyst_staff.error", origin);
    return 0;
  }
  const logLevelToBreak = new Array(highest + 1);
  logs.forEach((logLocation) => {
    let i = logLocation.y - origin.y;
    if (!logLevelToBreak[i]) {
      logLevelToBreak[i] = new Array(0);
    }
    logLevelToBreak[i].push(logLocation);
  });
  for (let i = 0; i < logLevelToBreak.length; i++) {
    system.runTimeout(() => {
      for (let j = 0; j < logLevelToBreak[i]?.length; j++) {
        const logPos = logLevelToBreak[i][j];
        if (isValid(dimension, logPos)) {
          dimension.runCommand(
            `setBlock ${logPos.x} ${logPos.y} ${logPos.z} air destroy`,
          );
        }
      }
    }, i * TREE_BREAK_DELAY);
  }
  // break leaves
  leaves.forEach((leaf) => {
    queue.enqueue(leaf);
  });
  let i = 0;
  while (!queue.isEmpty()) {
    const next = queue.dequeue();
    visited.add(vector3ToString(next));
    const neighbors = getNeighbors(
      dimension,
      next,
      {
        x: -1,
        y: -1,
        z: -1,
      },
      {
        x: 1,
        y: 1,
        z: 1,
      },
    );
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const neighborString = vector3ToString(neighbors[i]);
      if (visited.has(neighborString)) {
        continue;
      }
      visited.add(neighborString);
      if (
        checkRange(
          origin,
          neighbor,
          LEAF_HORIZONTAL_DISTANCE,
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, leavesAndMushrooms, [
          "leaves",
          "shroom_block",
          "wart_block",
        ])
      ) {
        const block = dimension.getBlock(neighbor);
        if (!block.permutation.getState("persistent_bit")) {
          leaves.add(neighbor);
          queue.enqueue(neighbor);
        }
      }
    }
    i++;
  }
  system.runTimeout(
    () => {
      leaves.forEach((leaf) => {
        dimension.runCommand(
          `setBlock ${leaf.x} ${leaf.y} ${leaf.z} air destroy`,
        );
      });
    },
    highest * TREE_BREAK_DELAY + 3,
  );
  return logs.size;
}
export function runTreecapitate(
  player,
  location,
  blockPermutation,
  treeCapitator,
) {
  if (!player) {
    return 0;
  }
  const dimension = player.dimension;
  const durability = treeCapitator.getComponent(ItemComponentTypes.Durability);
  // must start on a log
  const logTypeId = blockPermutation?.getItemStack()?.typeId;
  if (
    !(
      (logSet.has(logTypeId) ||
        logTypeId.includes("log") ||
        logTypeId.includes("stem")) &&
      blockPermutation.getState("pillar_axis") === "y"
    )
  ) {
    return 0;
  }
  // the log must be isolated
  const neighbors = getNeighbors(
    dimension,
    location,
    {
      x: -1,
      y: 0,
      z: -1,
    },
    {
      x: 1,
      y: 0,
      z: 1,
    },
  );
  for (let i = 0; i < neighbors.length; i++) {
    if (!!checkIsType(dimension, neighbors[i], logSet, ["log", "stem"])) {
      return 0;
    }
  }
  const logsBroken = treecapitate(
    player.dimension,
    location,
    durability?.maxDurability - durability?.damage,
  );
  return logsBroken;
}
export function offHandTreecapitate(data) {
  const equippable = data.player.getComponent(EntityComponentTypes.Equippable);
  const mainHand = equippable.getEquipment(EquipmentSlot.Mainhand);
  const offHand = equippable.getEquipment(EquipmentSlot.Offhand);
  const treeCapitatorSlot = mainHand?.typeId.includes("treecapitator")
    ? EquipmentSlot.Mainhand
    : offHand?.typeId.includes("treecapitator")
      ? EquipmentSlot.Offhand
      : undefined;
  const treeCapitator = mainHand?.typeId.includes("treecapitator")
    ? mainHand
    : offHand?.typeId.includes("treecapitator")
      ? offHand
      : undefined;
  if (!treeCapitator) {
    return false;
  }
  if (treeCapitatorSlot !== EquipmentSlot.Offhand) {
    return false;
  }
  const logsBroken = runTreecapitate(
    data.player,
    data.block.location,
    data.brokenBlockPermutation,
    treeCapitator,
  );
  reduceDurability(data.player, treeCapitator, logsBroken, treeCapitatorSlot);
}
export const Treecapitator = {
  onMineBlock(event) {
    system.runTimeout(() => {
      const logsBroken = runTreecapitate(
        event.source,
        event.block.location,
        event.minedBlockPermutation,
        event.itemStack,
      );
      if (logsBroken > 0) {
        reduceDurability(
          event.source,
          event.itemStack,
          logsBroken + 1,
          EquipmentSlot.Mainhand,
        );
      } else {
        customToolHandleDurability(event);
      }
    });
  },
};
