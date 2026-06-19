const IS_SUMMONER = "is_summoner";
export function rollBecomeSummoner(summoner, chance) {
  if (!summoner) {
    return;
  }
  const isSummoner = summoner.getDynamicProperty(IS_SUMMONER);
  if (Math.random() > chance) {
    return;
  }
  if (isSummoner?.valueOf() === 1) {
    return;
  }
  summoner.setDynamicProperty(IS_SUMMONER, 1);
  summoner.triggerEvent("become_summoner");
}
