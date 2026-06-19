export const magnitudeVector3 = (vector) => {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
};
export const normalizeVector3 = (vector) => {
    const magnitude = magnitudeVector3(vector);
    return {
        x: vector.x / magnitude,
        y: vector.y / magnitude,
        z: vector.z / magnitude,
    };
};
export const addVector3 = (a, b) => {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
    };
};
export const subtractVector3 = (a, b) => {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
    };
};
export const multiplyVector3 = (a, b) => {
    return {
        x: a.x * b.x,
        y: a.y * b.y,
        z: a.z * b.z,
    };
};
export const multiplyVector3Number = (a, b) => {
    return {
        x: a.x * b,
        y: a.y * b,
        z: a.z * b,
    };
};
export const divideVector3 = (a, b) => {
    return {
        x: a.x / b.x,
        y: a.y / b.y,
        z: a.z / b.z,
    };
};
export const directionVector3 = (to, from) => {
    return normalizeVector3(subtractVector3(to, from));
};
export const distVector3 = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
};
export const randomVector3 = (offset) => {
    return {
        x: getRandom(offset),
        y: getRandom(offset),
        z: getRandom(offset),
    };
};
const getRandom = (offset) => {
    return -1 * offset + Math.random() * offset * 2;
};
export function isValid(dimension, vector3) {
    if (vector3.y > dimension.heightRange.max) {
        return false;
    }
    if (vector3.y < dimension.heightRange.min) {
        return false;
    }
    try {
        const block = dimension.getBlock(vector3);
        return block?.isValid();
    }
    catch (ignored) {
        return false;
    }
}
export const getRandomAir = (start, dimension, offset, tries) => {
    for (let i = 0; i < tries; i++) {
        const randomPos = addVector3(start, randomVector3(offset));
        if (!isValid(dimension, randomPos)) {
            continue;
        }
        if (dimension.getBlock(randomPos).isAir) {
            return randomPos;
        }
    }
};
export const vector3ToString = (vector3) => {
    return `${vector3.x},${vector3.y},${vector3.z}`;
};
export const vector3FromString = (string) => {
    const args = string.split(",");
    return {
        x: Number(args[0]),
        y: Number(args[1]),
        z: Number(args[2]),
    };
};
