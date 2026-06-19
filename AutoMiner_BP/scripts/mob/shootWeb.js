import { world, system } from "@minecraft/server";
import {
  addVector3,
  multiplyVector3Number,
  directionVector3,
  distVector3,
  randomVector3,
} from "util/vector3Functions";
import { DEFAULT_TICK } from "main";
export function rollWebAttack(spider, target, chance) {
  if (!spider || !target) {
    return;
  }
  const WEB_COOLDOWN = "webCooldown";
  const activationRange = 5; // min range to activate
  const maxRange = 6; // range webs will generate
  const cooldownTime = 8;
  if (Math.random() > chance) {
    return;
  }
  if (distVector3(spider.location, target.location) > activationRange) {
    return;
  }
  const cooldown = spider.getDynamicProperty(WEB_COOLDOWN);
  if (
    !!cooldown &&
    typeof cooldown == "number" &&
    system.currentTick - cooldown < cooldownTime * DEFAULT_TICK
  ) {
    return;
  }
  // actually shoot
  spider.setDynamicProperty(WEB_COOLDOWN, system.currentTick);
  world.playSound("mob.web_spider.shoot", spider.location);
  const dir = directionVector3(target.location, spider.location);
  const dimension = world.getDimension(spider.dimension.id);
  if (!dimension) {
    return;
  }
  for (let i = 1; i <= maxRange; i++) {
    const pos = addVector3(
      addVector3(
        addVector3(spider.location, multiplyVector3Number(dir, i)),
        randomVector3(1.0),
      ),
      { x: 0, y: 0.25, z: 0 },
    );
    system.runTimeout(() => {
      if (!spider) {
        return;
      }
      if (
        pos.y < dimension.heightRange.min ||
        pos.y > dimension.heightRange.max
      ) {
        return;
      }
      const block = dimension.getBlock(pos);
      if (block.isAir) {
        target.dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} web`);
      }
    }, i * 3);
  }
}
