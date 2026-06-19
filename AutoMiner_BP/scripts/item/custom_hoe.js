import { reduceDurability } from "./reduce_durability";
export function onHoeUse(player, item, block) {
  if (item?.typeId === "minere:enderon_hoe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: block?.location ?? player.location,
    });
  }
}
