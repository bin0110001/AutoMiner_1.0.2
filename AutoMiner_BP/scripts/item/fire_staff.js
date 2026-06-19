import {
  system,
  world,
  EntityComponentTypes,
  ItemComponentTypes,
} from "@minecraft/server";
import {
  multiplyVector3Number,
  addVector3,
  randomVector3,
} from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
const fireReplaceList = [
  "air",
  "tall_grass",
  "short_grass",
  "snow_layer",
  "fern",
  "crimson_roots",
  "warped_roots",
];
export const useFireStaff = (data) => {
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  if (itemStack.typeId == "minere:fire_staff") {
    system.run(() => {
      if (source.isSneaking) {
        const cooldownComponent = data?.itemStack.getComponent(
          ItemComponentTypes.Cooldown,
        );
        if (cooldownComponent) {
          if (cooldownComponent.getCooldownTicksRemaining(source)) {
            source.playSound("item.amethyst_staff.error");
            return;
          }
          cooldownComponent.startCooldown(source);
        }
        if (
          !source.runCommand("clear @s[m=!c] fire_charge 0 4").successCount &&
          source.getGameMode() !== "creative"
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        source.addEffect("fire_resistance", 120, {
          showParticles: false,
        });
        fireWall(source.location, dimension, source.level >= 50 ? 3 : 2, 3, 5);
        reduceDurability(source, itemStack, 6);
      } else {
        if (
          !source.runCommand("clear @s[m=!c] fire_charge 0 1").successCount &&
          source.getGameMode() !== "creative"
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        dimension.playSound("mob.ghast.fireball", source.location, {
          volume: 0.5,
        });
        let loc = {
          x: source.getHeadLocation().x + source.getViewDirection().x * 1.5,
          y:
            source.getHeadLocation().y -
            0.5 +
            source.getViewDirection().y * 1.5,
          z: source.getHeadLocation().z + source.getViewDirection().z * 1.5,
        };
        let fireball = source.dimension.spawnEntity(
          "minere:staff_fireball",
          loc,
        );
        const proj = fireball.getComponent(EntityComponentTypes.Projectile);
        proj.owner = source;
        fireball.setRotation({
          x: -1 * source.getRotation().x,
          y: -1 * source.getRotation().y,
        });
        fireball.applyImpulse(
          addVector3(
            multiplyVector3Number(source.getViewDirection(), 2.25),
            randomVector3(0.05),
          ),
        );
        if (source.getGameMode() === "creative") {
          return;
        }
        reduceDurability(source, itemStack, 1);
      }
    });
  }
};
function fireWall(position, dimension, rings, spacing, height) {
  const minY = Math.max(
    dimension.heightRange.min + 1,
    position.y + 1 - height / 2,
  );
  const maxY = Math.min(
    dimension.heightRange.max - 1,
    position.y + 1 + height / 2,
  );
  let timeout = 3;
  dimension.playSound("item.fire_staff.cast", position);
  for (let i = 1; i <= rings; i++) {
    system.runTimeout(() => {
      dimension.playSound("mob.ghast.fireball", position, {
        volume: 0.5,
      });
      // z axis
      fireReplaceList.forEach((replaceMe) => {
        dimension.runCommand(
          `fill ${spacing * i + position.x} ${minY} ${spacing * i + position.z} ${-spacing * i + position.x} ${maxY} ${spacing * i + position.z} fire replace ${replaceMe}`,
        );
        dimension.runCommand(
          `fill ${spacing * i + position.x} ${minY} ${-spacing * i + position.z} ${-spacing * i + position.x} ${maxY} ${-spacing * i + position.z} fire replace ${replaceMe}`,
        );
        // x axis
        dimension.runCommand(
          `fill ${spacing * i + position.x} ${minY} ${spacing * i + position.z} ${spacing * i + position.x} ${maxY} ${-spacing * i + position.z} fire replace ${replaceMe}`,
        );
        dimension.runCommand(
          `fill ${-spacing * i + position.x} ${minY} ${spacing * i + position.z} ${-spacing * i + position.x} ${maxY} ${-spacing * i + position.z} fire replace ${replaceMe}`,
        );
      });
    }, timeout);
    timeout += 3;
  }
}
