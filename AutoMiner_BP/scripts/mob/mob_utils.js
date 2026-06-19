import { EntityComponentTypes } from "@minecraft/server";
export function isAlive(entity) {
  if (!entity) {
    return false;
  }
  const health = entity?.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return false;
  }
  return health.currentValue > 0;
}
