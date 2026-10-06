import { secureRandomIndex } from './random';

/**
 * How one spin of the randomizer reel plays out. The reel strip ends with three rows around
 * the landing zone (`before`, `main`, `after`), and the plan decides where the strip stops,
 * whether it hesitates, and which of the three rows ends up as the winner. That way a spin
 * can land straight on a beer, creep up to it, overshoot and bounce back, or even fake you
 * out and settle on the neighbour instead.
 */
export type SpinStyle = 'straight' | 'creep' | 'overshoot' | 'fakeNext' | 'fakePrev' | 'doubleNudge';

export interface SpinLeg {
  /** Row index to centre (may be fractional for a little overshoot) */
  row: number;
  duration: number;
  ease: string;
  /** Seconds to wait before this leg starts */
  pause: number;
}

export interface SpinPlan {
  style: SpinStyle;
  legs: SpinLeg[];
  /** Row that is the winner once every leg is done */
  finalRow: number;
  /** Length of the first (big) leg: the cap spins for this long */
  firstLegSeconds: number;
}

const STYLE_WEIGHTS: [SpinStyle, number][] = [
  ['straight', 3],
  ['creep', 2],
  ['overshoot', 2],
  ['fakeNext', 2],
  ['fakePrev', 1],
  ['doubleNudge', 1],
];

const BIG_EASES = ['power4.out', 'power3.out', 'expo.out', 'power4.out', 'circ.out'];

const rand = () => secureRandomIndex(10000) / 10000;
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(list: T[]) => list[secureRandomIndex(list.length)];

function pickStyle(): SpinStyle {
  const bag = STYLE_WEIGHTS.flatMap(([style, weight]) => Array<SpinStyle>(weight).fill(style));
  return pick(bag);
}

/** `reelLength` = index of the `before` row; main is +1, after is +2 */
export function makeSpinPlan(reelLength: number): SpinPlan {
  const before = reelLength;
  const main = reelLength + 1;
  const after = reelLength + 2;
  const style = pickStyle();
  const big = between(3.0, 4.6);
  const bigEase = pick(BIG_EASES);
  const nudge = (row: number, pause: number, ease = 'power2.inOut'): SpinLeg => ({
    row,
    duration: between(0.4, 0.7),
    ease,
    pause,
  });

  switch (style) {
    case 'creep':
      return {
        style,
        finalRow: main,
        firstLegSeconds: big,
        legs: [{ row: before + 0.12, duration: big, ease: bigEase, pause: 0 }, nudge(main, between(0.45, 0.95))],
      };
    case 'overshoot':
      return {
        style,
        finalRow: main,
        firstLegSeconds: big * 0.85,
        legs: [
          { row: after - 0.1, duration: big * 0.85, ease: 'power3.out', pause: 0 },
          { row: main, duration: between(0.55, 0.8), ease: 'back.out(1.6)', pause: between(0.1, 0.3) },
        ],
      };
    case 'fakeNext':
      return {
        style,
        finalRow: after,
        firstLegSeconds: big,
        legs: [
          { row: main, duration: big, ease: bigEase, pause: 0 },
          nudge(after, between(0.6, 1.2), 'power3.inOut'),
        ],
      };
    case 'fakePrev':
      return {
        style,
        finalRow: before,
        firstLegSeconds: big,
        legs: [
          { row: main, duration: big, ease: bigEase, pause: 0 },
          nudge(before, between(0.6, 1.2), 'power3.inOut'),
        ],
      };
    case 'doubleNudge':
      return {
        style,
        finalRow: after,
        firstLegSeconds: big,
        legs: [
          { row: before + 0.1, duration: big, ease: bigEase, pause: 0 },
          nudge(main, between(0.35, 0.6)),
          nudge(after, between(0.3, 0.5)),
        ],
      };
    default:
      return {
        style: 'straight',
        finalRow: main,
        firstLegSeconds: big,
        legs: [
          { row: main + 0.35, duration: big, ease: bigEase, pause: 0 },
          { row: main, duration: 0.45, ease: 'back.out(2.2)', pause: 0 },
        ],
      };
  }
}
