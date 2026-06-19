import { EntityComponentTypes, system } from "@minecraft/server";
const IS_STRAFING = "minere:is_strafing";
const STRAFE_FORCE = 0.06;
const ANGLE_CHANGE = 3;
const DURATION_MIN = 1;
const DURATION_MAX = 4;
const validFamilies = new Set();
validFamilies.add("skeleton");
validFamilies.add("stray");
validFamilies.add("bogged");
export function skeletonStrafe(entity, chance) {
  if (Math.random() > chance) {
    return;
  }
  if (entity.typeId !== "minecraft:arrow") {
    return;
  }
  const projectileComponent = entity.getComponent(
    EntityComponentTypes.Projectile,
  );
  const owner = projectileComponent?.owner;
  if (!owner) {
    return;
  }
  // validate shooter belongs to a valid family
  const family = owner.getComponent(EntityComponentTypes.TypeFamily);
  let isFamilyMatch = false;
  for (let i = 0; i < family.getTypeFamilies().length; i++) {
    if (validFamilies.has(family.getTypeFamilies()[i])) {
      isFamilyMatch = true;
      break;
    }
  }
  if (!isFamilyMatch) {
    return;
  }
  // check if shooter is already strafing
  const isStrafing = owner.getDynamicProperty(IS_STRAFING);
  if (isStrafing) {
    return;
  }
  owner.setDynamicProperty(IS_STRAFING, true);
  // start strafing
  let angle = Math.random() * 360;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const runner = system.runInterval(() => {
    const strafeDirRadians = angle * (Math.PI / 180);
    owner.applyImpulse({
      x: Math.cos(strafeDirRadians) * STRAFE_FORCE,
      y: 0,
      z: Math.sin(strafeDirRadians) * STRAFE_FORCE,
    });
    angle += ANGLE_CHANGE * dir;
  });
  // cleanup
  system.runTimeout(
    () => {
      system.clearRun(runner);
      owner.setDynamicProperty(IS_STRAFING, false);
    },
    20 * DURATION_MIN + 20 * DURATION_MAX * Math.random(),
  );
}
