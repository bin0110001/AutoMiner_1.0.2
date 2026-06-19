import { ItemStack } from "@minecraft/server";
import {
  hasSilkTouchOrShears,
  hasPickaxe,
  getEnchantmentLevel,
} from "item/item_utils";
import { addVector3 } from "util/vector3Functions";
import { getRandomIntInclusive } from "util/mathFunctions";
const oreMap = new Map();
oreMap.set("minere:sulfur_ore", {
  ore: "minecraft:gunpowder",
  count: {
    min: 1,
    max: 2,
  },
  fortune: {
    min: 0,
    max: 1,
  },
  experience: {
    min: 0,
    max: 2,
  },
});
oreMap.set("minere:nether_coal_ore", {
  ore: "minere:nether_coal",
  count: {
    min: 1,
    max: 1,
  },
  fortune: {
    min: 0,
    max: 1,
  },
  experience: {
    min: 0,
    max: 2,
  },
});
oreMap.set("minere:ender_plasma_ore", {
  ore: "minere:ender_plasma",
  count: {
    min: 1,
    max: 2,
  },
  fortune: {
    min: 0,
    max: 1,
  },
  experience: {
    min: 0,
    max: 3,
  },
});
oreMap.set("minere:enderon_ore", {
  ore: "minere:enderon_gemstone",
  count: {
    min: 1,
    max: 1,
  },
  fortune: {
    min: 0,
    max: 1,
  },
  experience: {
    min: 2,
    max: 6,
  },
});
export const customOre = {
  onPlayerDestroy(arg) {
    const player = arg.player;
    if (!player) {
      return;
    }
    const dimension = player.dimension;
    if (!hasPickaxe(player) || hasSilkTouchOrShears(player)) {
      return;
    }
    const location = addVector3(arg.block.location, {
      x: 0.5,
      y: 0.5,
      z: 0.5,
    });
    const oreDef = oreMap.get(arg.destroyedBlockPermutation.type.id);
    if (!oreDef) {
      return;
    }
    let bonus = 0;
    const fortuneLevel = getEnchantmentLevel(player, "fortune");
    for (let i = 0; i < fortuneLevel; i++) {
      bonus += getRandomIntInclusive(oreDef.fortune.min, oreDef.fortune.max);
    }
    if (bonus > 0) {
      const itemStack = new ItemStack(oreDef.ore, bonus);
      dimension.spawnItem(itemStack, location);
    }
    const xp = getRandomIntInclusive(
      oreDef.experience.min,
      oreDef.experience.max,
    );
    for (let i = 0; i < xp; i++) {
      const xpOrb = dimension.spawnEntity("minecraft:xp_orb", location);
    }
  },
};
