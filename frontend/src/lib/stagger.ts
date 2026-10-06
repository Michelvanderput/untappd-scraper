import type { CSSProperties } from 'react';

/** Stagger index for the `.enter-*` / `.grow-x` classes: delay = index × 45 ms */
export const stagger = (i: number) => ({ '--i': i }) as CSSProperties;
