import { system, world } from "@minecraft/server";
export const angerEndermen = (data) => {
  const target = data.removedEntity;
  if (!target || target.typeId !== "minecraft:ender_crystal") {
    return;
  }
  const typeId = target.typeId;
  const dimension = world.getDimension(data.removedEntity.dimension.id);
  if (!dimension) {
    return;
  }
  const location = target.location;
  system.run(() => {
    if (
      typeId === "minecraft:ender_crystal" &&
      dimension.id == "minecraft:the_end"
    ) {
      const endermen = dimension.getEntities({
        type: "enderman",
        closest: 4,
        location: location,
        maxDistance: 100,
      });
      endermen.forEach((enderman) => {
        enderman.triggerEvent("minere:start_search");
        world.playSound("mob.endermen.scream", enderman.location, {
          volume: 10.0,
        });
      });
    }
  });
};
