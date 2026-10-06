import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap, prefersReducedMotion } from './gsap';

/**
 * One pill that glides to whichever item is active (GSAP; replaces Framer's `layoutId` trick).
 *
 * `container` must be `position: relative` and hold both the pill and the items.
 * `activeSelector` finds the active item inside it; when nothing matches the pill hides.
 * `key` is anything that changes when the active item changes (a route, a tab id, ...).
 */
export function useSlidingPill(
  container: RefObject<HTMLElement | null>,
  pill: RefObject<HTMLElement | null>,
  activeSelector: string,
  key: string
) {
  const placed = useRef(false);

  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const c = container.current;
      const p = pill.current;
      if (!c || !p) return;
      const active = c.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        gsap.to(p, { autoAlpha: 0, duration: 0.12, overwrite: true });
        placed.current = false;
        return;
      }
      const cr = c.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      const vars = { x: ar.left - cr.left, y: ar.top - cr.top, width: ar.width, height: ar.height, autoAlpha: 1 };
      if (!animate || !placed.current || prefersReducedMotion()) gsap.set(p, vars);
      else gsap.to(p, { ...vars, duration: 0.6, ease: 'expo.out', overwrite: true });
      placed.current = true;
    };
    place(true);
    const onResize = () => place(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [container, pill, activeSelector, key]);
}
