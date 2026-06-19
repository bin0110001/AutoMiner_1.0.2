import { Vector2 } from "@minecraft/server";

export const magnitudeVector2 = (vector: Vector2): number => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

export const normalizeVector2 = (vector: Vector2): Vector2 => {
  const magnitude = magnitudeVector2(vector);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
};

export const subtractVector2 = (a: Vector2, b: Vector2): Vector2 => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
};

export const directionVector2 = (to: Vector2, from: Vector2): Vector2 => {
  return normalizeVector2(subtractVector2(to, from));
};

export const directionNumFromVector2 = (vector: Vector2): number => {
  const radians = Math.atan2(vector.y, vector.x);
  const degrees = radians * (180 / Math.PI);
  const num = degrees / 180;
  if (num > 1.0) {
    return num - 2.0;
  }
  return num;
};
