import { world } from "@minecraft/server";
import { replaceMinecart } from "item/replace_minecart";
import { startAutoMiner, minerDie, stopAutoMiner } from "machine/autoMiner";
import { AutoMinerItem } from "item/auto_miner_item";
export const DEFAULT_TICK = 20;
world.beforeEvents.worldInitialize.subscribe(function (data) {
    data.itemComponentRegistry.registerCustomComponent("minere:auto_miner_item", AutoMinerItem);
});
world.beforeEvents.entityRemove.subscribe(function (data) {
    replaceMinecart(data);
});
world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    startAutoMiner(data.entity);
});
world.afterEvents.entityLoad.subscribe((data) => {
    stopAutoMiner(data.entity);
});
world.afterEvents.entityDie.subscribe(function (data) {
    minerDie(data.deadEntity);
});
