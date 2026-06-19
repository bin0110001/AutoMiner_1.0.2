export const runBuildPyramid = (data) => {
  if (data.source.typeId !== "minecraft:player") {
    return;
  }
  const player = data.source;
  if (data.itemStack.typeId !== "minecraft:golden_carrot") {
    return;
  }
  const dimension = player.dimension;
  const location = {
    x: player.location.x + 4,
    y: player.location.y + 4,
    z: player.location.z + 4,
  };
  let startingWidth = 1;
  for (let height = 0; height < 24; height++) {
    dimension.runCommand(
      `fill ${location.x - height} ${location.y + height} ${location.z - height} ${location.x + startingWidth + height} ${location.y + height} ${location.z + startingWidth + height} nether_brick`,
    );
    dimension.runCommand(
      `fill ${location.x - 23} ${location.y + height} ${location.z - 23} ${location.x + 24} ${location.y + height} ${location.z + 24} structure_void replace air`,
    );
  }
  // const chamberWidth = 16;
  // const chamberStartHeight = 20;
  // const chamberHeight = 7;
  // dimension.runCommand(`fill ${location.x - chamberWidth} ${location.y + chamberStartHeight} ${location.z - chamberWidth} ${location.x + chamberWidth + 1} ${location.y + chamberStartHeight + chamberHeight} ${location.z + chamberWidth + 1} air`);
  // const portalChamberWidth = 6;
  // const portalChamberStartHeight = 10;
  // const portalChamberHeight = 5;
  // dimension.runCommand(`fill ${location.x - portalChamberWidth} ${location.y + portalChamberStartHeight} ${location.z - portalChamberWidth} ${location.x + portalChamberWidth + 1} ${location.y + portalChamberStartHeight + portalChamberHeight} ${location.z + portalChamberWidth + 1} air`);
};
