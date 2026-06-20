import { world } from "@minecraft/server";
import { replaceMinecart } from "item/replace_minecart";
import { startAutoMiner, minerDie, stopAutoMiner, getConfig } from "machine/autoMiner";
import { AutoMinerItem, StoneAutoMinerItem } from "item/auto_miner_item";
export const DEFAULT_TICK = 20;
world.beforeEvents.worldInitialize.subscribe(function (data) {
    data.itemComponentRegistry.registerCustomComponent("minere:auto_miner_item", AutoMinerItem);
    data.itemComponentRegistry.registerCustomComponent("minere:stone_auto_miner_item", StoneAutoMinerItem);
});
world.beforeEvents.entityRemove.subscribe(function (data) {
    replaceMinecart(data);
});
world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    const config = getConfig(data.entity.typeId);
    startAutoMiner(data.entity, config);
});
world.afterEvents.entityLoad.subscribe((data) => {
    const config = getConfig(data.entity.typeId);
    stopAutoMiner(data.entity, config);
});
world.afterEvents.entityDie.subscribe(function (data) {
    const config = getConfig(data.deadEntity.typeId);
    minerDie(data.deadEntity, config);
});
