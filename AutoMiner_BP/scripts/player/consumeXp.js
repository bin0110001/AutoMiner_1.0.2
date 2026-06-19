import { GameMode } from "@minecraft/server";
export const consumeXp = (player, amount) => {
  if (!player || !amount) {
    return false;
  }
  if (player.getGameMode() === GameMode.creative) {
    return true;
  }
  if (player.getTotalXp() < amount) {
    return false;
  }
  if (player.xpEarnedAtCurrentLevel == 0) {
    player.addLevels(-1);
    player.addExperience(player.totalXpNeededForNextLevel - amount);
  } else {
    player.addExperience(-1 * amount);
  }
  return true;
};
