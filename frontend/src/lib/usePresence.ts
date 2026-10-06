import { useEffect, useState } from 'react';

/**
 * Keeps something mounted just long enough to play its exit animation.
 * Returns `mounted` (render it or not) and `state` (put on `data-state`; pairs with the
 * `.dock`, `.fade` and `.lift` classes in index.css).
 */
export function usePresence(show: boolean, exitMs = 250) {
  const [mounted, setMounted] = useState(show);

  // Opening: mount right away (adjusting state during render is the sanctioned pattern here)
  if (show && !mounted) setMounted(true);

  useEffect(() => {
    if (show || !mounted) return;
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [show, mounted, exitMs]);

  return { mounted, state: show ? ('open' as const) : ('closed' as const) };
}
