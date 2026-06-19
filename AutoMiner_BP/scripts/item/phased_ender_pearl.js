import {
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemComponentTypes,
} from "@minecraft/server";
import { enderTeleport } from "mob/enderTeleport";
import { addVector3, multiplyVector3Number } from "util/vector3Functions";
const ENDERON = "enderon";
const MULTIPLIER = 1.5;
const GROUND_LOOK_DISTANCE = 16;
export const usePhasedEnderPearl = (data) => {
  const player = data?.source;
  if (!player) {
    return;
  }
  if (data?.itemStack?.typeId !== "minere:phased_ender_pearl") {
    return;
  }
  const cooldown = data?.itemStack.getComponent(ItemComponentTypes.Cooldown);
  if (cooldown) {
    if (cooldown.getCooldownTicksRemaining(player)) {
      return;
    }
    cooldown.startCooldown(player);
  }
  const dimension = player.dimension;
  if (player.getGameMode() != GameMode.creative) {
    player.runCommand("clear @s[m=!c] minere:phased_ender_pearl 0 1");
  }
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  let min = 12;
  let max = 20;
  if (
    equippable
      ?.getEquipmentSlot(EquipmentSlot.Head)
      ?.getItem()
      ?.typeId.includes(ENDERON)
  ) {
    min += 2;
    max += 1;
  }
  if (
    equippable
      ?.getEquipmentSlot(EquipmentSlot.Chest)
      ?.getItem()
      ?.typeId.includes(ENDERON)
  ) {
    min += 2;
    max += 1;
  }
  if (
    equippable
      ?.getEquipmentSlot(EquipmentSlot.Legs)
      ?.getItem()
      ?.typeId.includes(ENDERON)
  ) {
    min += 2;
    max += 1;
  }
  if (
    equippable
      ?.getEquipmentSlot(EquipmentSlot.Feet)
      ?.getItem()
      ?.typeId.includes(ENDERON)
  ) {
    min += 2;
    max += 1;
  }
  const offset = multiplyVector3Number(
    player.getViewDirection(),
    MULTIPLIER * (min + Math.random() * (max - min)),
  );
  offset.y += 1;
  const targetPos = addVector3(player.location, offset);
  targetPos.y = Math.max(dimension.heightRange.min + 2, targetPos.y);
  targetPos.y = Math.min(dimension.heightRange.max - 2, targetPos.y);
  let targetEntity = player;
  const ridingComponent = player?.getComponent(EntityComponentTypes.Riding);
  if (ridingComponent && ridingComponent.entityRidingOn) {
    targetEntity = ridingComponent.entityRidingOn;
  }
  for (let i = 0; i <= GROUND_LOOK_DISTANCE; i++) {
    const targetY = targetPos.y + i;
    if (targetY >= dimension.heightRange.max) {
      break;
    }
    const block = dimension.getBlock({
      x: targetPos.x,
      y: targetY,
      z: targetPos.z,
    });
    if (block.isValid && block.isAir) {
      targetPos.y = targetY;
      break;
    }
  }
  for (let i = 1; i <= GROUND_LOOK_DISTANCE; i++) {
    const targetY = targetPos.y - i;
    if (targetY <= dimension.heightRange.min) {
      break;
    }
    const block = dimension.getBlock({
      x: targetPos.x,
      y: targetY,
      z: targetPos.z,
    });
    if (block.isValid && !block.isAir) {
      targetPos.y = targetY + 1;
      break;
    }
  }
  enderTeleport(targetEntity, targetPos);
};
