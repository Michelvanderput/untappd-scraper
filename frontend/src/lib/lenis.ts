import type Lenis from 'lenis';

let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

/** Jump to the top without animation (used on route changes). Falls back to native scroll. */
export function scrollToTop() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0 });
}
