import gsap, { Power3 } from "gsap";

export const stagger = (
  target: gsap.TweenTarget,
  fromvVars: Record<string, any>,
  toVars: Record<string, any>
): gsap.core.Tween => {
  return gsap.fromTo(
    target,
    { opacity: 0, ...fromvVars },
    { opacity: 1, ...toVars, stagger: 0.2, ease: Power3.easeOut }
  );
};
