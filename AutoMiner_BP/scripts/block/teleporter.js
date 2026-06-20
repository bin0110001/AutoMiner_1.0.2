import {
  EntityComponentTypes,
  BlockPermutation,
  EquipmentSlot,
} from "@minecraft/server";
import { enderTeleport } from "mob/enderTeleport";
import { randomVector3, addVector3 } from "util/vector3Functions";
const TELEPORT_RANGE = 2.75;
const PARTICLE_DISTANCE = 2;
const PARTICLE_COUNT = 50;
const TELEPORT_PER_POWER = 8;
const BLOCK_COUNT_MAX = 4;
export const teleporter = {
  onTick(arg) {
    let redstonePower = arg.block?.getRedstonePower();
    const location = arg.block.location;
    const dimension = arg.dimension;
    const direction = arg.block.permutation.getState(
      "minecraft:facing_direction",
    );
    let blockMultiplier = 1;
    const blocks = [];
    blocks.push(arg.block.below(1));
    blocks.push(arg.block.above(1));
    blocks.push(arg.block.east(1));
    blocks.push(arg.block.west(1));
    blocks.push(arg.block.north(1));
    blocks.push(arg.block.south(1));
    blocks.forEach((block) => {
      if (block.isValid()) {
        if (
          block.typeId === "minecraft:redstone_block" ||
          block.typeId === "minecraft:redstone_torch"
        ) {
          redstonePower = 15;
        }
        if (block.typeId === "minere:enderon_block") {
          blockMultiplier += 1;
        }
      }
    });
    blockMultiplier = Math.min(blockMultiplier, BLOCK_COUNT_MAX);
    arg.block.setPermutation(
      BlockPermutation.resolve(arg.block.typeId, {
        ...arg.block.permutation.getAllStates(),
        "minere:powered": redstonePower > 0 ? true : false,
      }),
    );
    if (redstonePower) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        try {
          dimension.spawnParticle(
            "minecraft:end_chest",
            addVector3(location, randomVector3(PARTICLE_DISTANCE)),
          );
        } catch {}
      }
      dimension.playSound("machine.teleporter.teleport", location);
      let targetOffset = {
        x: 0,
        y: 0,
        z: 0,
      };
      if (direction === "up") {
        targetOffset = {
          x: 0,
          y: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          z: 0,
        };
      }
      if (direction === "down") {
        targetOffset = {
          x: 0,
          y: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          z: 0,
        };
      }
      if (direction === "east") {
        targetOffset = {
          x: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          y: 0,
          z: 0,
        };
      }
      if (direction === "west") {
        targetOffset = {
          x: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          y: 0,
          z: 0,
        };
      }
      if (direction === "south") {
        (targetOffset = location),
          {
            x: 0,
            y: 0,
            z: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          };
      }
      if (direction === "north") {
        targetOffset = {
          x: 0,
          y: 0,
          z: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
        };
      }
      const entities = dimension.getEntities({
        location: location,
        maxDistance: TELEPORT_RANGE,
      });
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        // don't teleport entities that are riding others
        const ridingComponent = entity?.getComponent(
          EntityComponentTypes.Riding,
        );
        if (ridingComponent && ridingComponent.entityRidingOn) {
          continue;
        }
        // don't teleport entities wearing pumpkins
        const equippable = entity?.getComponent(
          EntityComponentTypes.Equippable,
        );
        if (
          equippable &&
          equippable.getEquipment(EquipmentSlot.Head)?.typeId ===
            "minecraft:carved_pumpkin"
        ) {
          continue;
        }
        const targetPos = addVector3(entity.location, targetOffset);
        targetPos.y = Math.max(dimension.heightRange.min + 1, targetPos.y);
        targetPos.y = Math.min(dimension.heightRange.max - 1, targetPos.y);
        enderTeleport(entity, targetPos);
      }
    }
  },
};
