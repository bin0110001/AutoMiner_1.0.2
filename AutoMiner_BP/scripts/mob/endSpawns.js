import { world, system } from "@minecraft/server";
import { distVector3 } from "util/vector3Functions";
export const handleEndSpawn = (entity) => {
  if (!entity) {
    return;
  }
  if (!entity?.typeId) {
    return;
  }
  if (
    !(
      entity.typeId == "minere:walker" ||
      entity.typeId == "minere:cosmic_jelly" ||
      entity.typeId == "minere:ender_phantom" ||
      entity.typeId == "minere:gremlin"
    )
  ) {
    return;
  }
  const dimension = world.getDimension(entity?.dimension?.id);
  if (!dimension) {
    return;
  }
  system.run(() => {
    if (!entity?.typeId) {
      return;
    }
    const location = entity.location;
    // replace walkers, comsic_jellies, and sometimes ender_phantoms on the main island
    if (
      dimension.id == "minecraft:the_end" &&
      distVector3(entity.location, { x: 0, y: 0, z: 0 }) < 1000
    ) {
      if (
        entity.typeId == "minere:walker" ||
        entity.typeId == "minere:cosmic_jelly" ||
        entity.typeId == "minere:ender_phantom"
      ) {
        // ender_phantoms can spawn on the main island while the dragon is alive
        const dragons = dimension.getEntities({
          type: "ender_dragon",
          maxDistance: 512,
          location: { x: 0, y: 0, z: 0 },
        });
        if (dragons && dragons.length > 0) {
          if (entity.typeId == "minere:ender_phantom") {
            return;
          }
          entity.remove();
          if (Math.random() <= 0.9) {
            dimension.spawnEntity("minecraft:enderman", location);
          } else {
            dimension.spawnEntity("minere:ender_phantom", location);
          }
        } else {
          entity.remove();
          dimension.spawnEntity("minecraft:enderman", location);
        }
      }
      // replace gremlins with endermen on the main island
      if (entity.typeId == "minere:gremlin") {
        entity.remove();
        if (Math.random() <= 0.5) {
          dimension.spawnEntity("minecraft:enderman", location);
        }
      }
    }
  });
};
