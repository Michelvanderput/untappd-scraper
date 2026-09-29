import { useState } from 'react';

interface BubblesProps {
  count?: number;
  /** Base rise duration in seconds; each bubble adds up to 4s of jitter */
  duration?: number;
}

const makeBubbles = (count: number, duration: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 3 + Math.random() * 94,
    size: 4 + Math.random() * 16,
    duration: duration + Math.random() * 4,
    delay: Math.random() * 3,
  }));

/**
 * Foam bubbles rising from the bottom of the nearest positioned ancestor.
 * Decorative; hidden from assistive tech and disabled by the global reduced-motion rule.
 */
export default function Bubbles({ count = 18, duration = 3.5 }: BubblesProps) {
  const [bubbles] = useState(() => makeBubbles(count, duration));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute -bottom-6 rounded-full border border-gold/40 bg-gold/10 animate-rise"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  );
}
