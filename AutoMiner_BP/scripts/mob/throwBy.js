import {
  addVector3,
  directionVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
export const throwBy = (thrower, target, scale, vAddition) => {
  if (!throwBy || !target || !scale) {
    return;
  }
  const throwForce = addVector3(
    multiplyVector3Number(
      directionVector3(target.location, thrower.location),
      scale,
    ),
    { x: 0, y: vAddition, z: 0 },
  );
  target.applyKnockback(throwForce.x, throwForce.z, 1, 1);
};
