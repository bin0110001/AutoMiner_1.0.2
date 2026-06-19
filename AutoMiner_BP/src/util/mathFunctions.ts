import { Vector3 } from "@minecraft/server";
import {
  directionVector2,
  directionNumFromVector2,
} from "util/vector2Functions";

export function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getFlatDirection(from: Vector3, to: Vector3): number {
  return directionNumFromVector2(
    directionVector2(
      {
        x: from.x,
        y: from.z,
      },
      {
        x: to.x,
        y: to.z,
      },
    ),
  );
}
