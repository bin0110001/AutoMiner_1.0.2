import {
  system,
  world,
  EntityComponentTypes,
  ItemComponentTypes,
} from "@minecraft/server";
import { multiplyVector3Number } from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
export const useBlasterStaff = (data) => {
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  if (itemStack.typeId == "minere:blaster_staff") {
    system.run(() => {
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
      dimension.playSound("mob.walker.warn", source.location, {
        pitch: 1.0,
      });
      system.runTimeout(() => {
        if (
          !source.runCommand("clear @s[m=!c] minere:ender_plasma 0 1")
            .successCount &&
          source.getGameMode() !== "creative"
        ) {
          source.playSound("item.amethyst_staff.error");
          return;
        }
        dimension.playSound("mob.walker.shoot", source.location);
        let loc = {
          x: source.location.x + source.getViewDirection().x * 1.5,
          y: source.location.y + 1.5 + source.getViewDirection().y * 1.5,
          z: source.location.z + source.getViewDirection().z * 1.5,
        };
        let plasmaBolt = source.dimension.spawnEntity(
          "minere:plasma_bolt",
          loc,
        );
        const proj = plasmaBolt.getComponent(EntityComponentTypes.Projectile);
        proj.owner = source;
        plasmaBolt.setRotation({
          x: -1 * source.getRotation().x,
          y: -1 * source.getRotation().y,
        });
        plasmaBolt.applyImpulse(
          multiplyVector3Number(source.getViewDirection(), 7.0),
        );
        if (source.getGameMode() === "creative") {
          return;
        }
        reduceDurability(source, itemStack, 4);
      }, 20);
    });
  }
};
