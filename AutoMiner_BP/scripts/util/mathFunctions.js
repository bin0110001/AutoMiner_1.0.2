import { directionVector2, directionNumFromVector2, } from "util/vector2Functions";
export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function getFlatDirection(from, to) {
    return directionNumFromVector2(directionVector2({
        x: from.x,
        y: from.z,
    }, {
        x: to.x,
        y: to.z,
    }));
}
