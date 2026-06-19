export const VenomShank = {
  onHitEntity(arg) {
    arg.hitEntity.addEffect("poison", 200, {
      amplifier: 1,
    });
  },
};
