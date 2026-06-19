import { system, world } from "@minecraft/server";
const RAIL_SPEEDS = {
    "minere:iron_rail": 0.14,
    "minere:golden_rail": 0.25,
    "minere:diamond_rail": 0.35,
    "minere:copper_rail": 0.08,
    "minere:emerald_rail": 0.06,
};
function getRailSpeed(block) {
    const blockInfo = block.typeId;
    if (blockInfo && blockInfo in RAIL_SPEEDS) {
        return RAIL_SPEEDS[blockInfo];
    }
    return null;
}
function updateMinecartSpeed() {
    const dimension = world.getDimension("overworld");
    for (const entity of dimension.getEntities({ type: "minecraft:minecart" })) {
        const location = entity.location;
        const dimension = entity.dimension;
        const belowLocation = {
            x: Math.round(location.x),
            y: location.y - 0.5,
            z: Math.round(location.z)
        };
        const block = dimension.getBlock(belowLocation);
        if (!block)
            continue;
        const speed = getRailSpeed(block);
        if (speed !== null) {
            entity.setProperty("minecraft:rail_movement.max_speed", speed);
        }
    }
}
system.runInterval(updateMinecartSpeed, 10);
