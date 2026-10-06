import { useId } from 'react';
import type { ReactNode } from 'react';

// Crimped crown-cap outline: 21 teeth, alternating outer/inner radius (viewBox 0 0 100 100).
const TEETH = 21;
export const CAP_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i < TEETH * 2; i++) {
    const a = (Math.PI * i) / TEETH - Math.PI / 2;
    const r = i % 2 === 0 ? 50 : 45;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')}Z`;
})();

interface BottleCapProps {
  className?: string;
  children?: ReactNode;
  /** Render the teeth ring spinning slowly */
  spinning?: boolean;
}

/**
 * Gold crown cap — the brand mark. Children are centred on top of the cap.
 */
export default function BottleCap({ className = '', children, spinning = false }: BottleCapProps) {
  const id = useId();
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 w-full h-full ${spinning ? 'animate-spin-slow' : ''}`}
        aria-hidden
      >
        <defs>
          <radialGradient id={`cap-${id}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#FFD98A" />
            <stop offset="55%" stopColor="#F2B33D" />
            <stop offset="100%" stopColor="#A86A0B" />
          </radialGradient>
        </defs>
        <path d={CAP_PATH} fill={`url(#cap-${id})`} stroke="#A86A0B" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#0E0B09" strokeOpacity="0.18" strokeWidth="1.2" />
      </svg>
      <span className="relative text-stout">{children}</span>
    </span>
  );
}
