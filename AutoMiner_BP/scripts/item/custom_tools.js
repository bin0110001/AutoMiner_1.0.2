import { reduceDurability } from "./reduce_durability";
const instantMineSet = new Set();
// grasses
instantMineSet.add("minecraft:short_grass");
instantMineSet.add("minecraft:tall_grass");
instantMineSet.add("minecraft:dry_grass");
instantMineSet.add("minecraft:fern");
instantMineSet.add("minecraft:bush");
instantMineSet.add("minecraft:dead_bush");
instantMineSet.add("minecraft:firefly_bush");
instantMineSet.add("minecraft:leaf_litter");
instantMineSet.add("minecraft:pink_petals");
instantMineSet.add("minecraft:sugar_cane");
instantMineSet.add("minecraft:crimson_roots");
instantMineSet.add("minecraft:warped_roots");
// short flowers
instantMineSet.add("minecraft:wildflowers");
instantMineSet.add("minecraft:dandelion");
instantMineSet.add("minecraft:poppy");
instantMineSet.add("minecraft:poppy");
instantMineSet.add("minecraft:allium");
instantMineSet.add("minecraft:azure_bluet");
instantMineSet.add("minecraft:blue_orchid");
instantMineSet.add("minecraft:cornflower");
instantMineSet.add("minecraft:oxeye_daisy");
instantMineSet.add("minecraft:open_eyeblossom");
instantMineSet.add("minecraft:closed_eyeblossom");
instantMineSet.add("minecraft:lily_of_the_valley");
instantMineSet.add("minecraft:torchflower");
instantMineSet.add("minecraft:orange_tulip");
instantMineSet.add("minecraft:red_tulip");
instantMineSet.add("minecraft:white_tulip");
instantMineSet.add("minecraft:wither_rose");
// tall flowers
instantMineSet.add("minecraft:lilac");
instantMineSet.add("minecraft:peony");
instantMineSet.add("minecraft:pitcher_plant");
instantMineSet.add("minecraft:rose_bush");
instantMineSet.add("minecraft:sunflower");
// torches
instantMineSet.add("minecraft:torch");
instantMineSet.add("minecraft:redstone_torch");
instantMineSet.add("minecraft:soul_torch");
export function customToolHandleDurability(event) {
  const player = event.source;
  const blockId =
    event?.minedBlockPermutation?.getItemStack()?.typeId || "minecraft:air";
  if (!player || !event?.block || instantMineSet.has(blockId)) {
    return;
  }
  reduceDurability(player, event.itemStack, 1);
}
export const CustomAxe = {
  onMineBlock(event) {
    customToolHandleDurability(event);
  },
};
export const CustomHoe = {
  onMineBlock(event) {
    customToolHandleDurability(event);
  },
};
export const CustomShovel = {
  onMineBlock(event) {
    customToolHandleDurability(event);
  },
};
export const CustomPickaxe = {
  onMineBlock(event) {
    customToolHandleDurability(event);
  },
};
export const CustomSword = {
  onMineBlock(event) {
    customToolHandleDurability(event);
  },
};
export function onHoeUse(player, item, block) {
  if (item.typeId === "minere:enderon_hoe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}
export function onShovelUse(player, item, block) {
  if (item.typeId === "minere:enderon_shovel") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}
export function onAxeUse(player, item, block) {
  if (item.typeId === "minere:enderon_axe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.wood", {
      location: player.location ?? player.location,
    });
  }
}
