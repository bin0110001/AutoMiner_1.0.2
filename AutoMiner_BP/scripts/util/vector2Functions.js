export const magnitudeVector2 = (vector) => {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};
export const normalizeVector2 = (vector) => {
    const magnitude = magnitudeVector2(vector);
    return {
        x: vector.x / magnitude,
        y: vector.y / magnitude,
    };
};
export const subtractVector2 = (a, b) => {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
};
export const directionVector2 = (to, from) => {
    return normalizeVector2(subtractVector2(to, from));
};
export const directionNumFromVector2 = (vector) => {
    const radians = Math.atan2(vector.y, vector.x);
    const degrees = radians * (180 / Math.PI);
    const num = degrees / 180;
    if (num > 1.0) {
        return num - 2.0;
    }
    return num;
};
