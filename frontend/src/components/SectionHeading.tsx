import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { gsap, SplitText, useGSAP, EASE_OUT_EXPO, prefersReducedMotion } from '../lib/gsap';

interface SectionHeadingProps {
  title: string;
  /** Optional short description under the title */
  description?: string;
  icon?: LucideIcon;
  /** Optional right-aligned slot (e.g. a link or count) */
  action?: ReactNode;
  /** Extra margin bottom (default: mb-5) */
  className?: string;
}

/**
 * Section heading (H2) with a thin rule, for clear content hierarchy.
 * Scrolling it into view draws the rule and lifts the title in word by word (ScrollTrigger + SplitText).
 */
export default function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
  className = 'mb-5',
}: SectionHeadingProps) {
  const root = useRef<HTMLDivElement>(null);
  const title2 = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !title2.current) return;
      const tl = gsap.timeline({
        defaults: { ease: EASE_OUT_EXPO },
        scrollTrigger: { trigger: root.current, start: 'top 90%', once: true },
      });
      tl.from('[data-rule]', { scaleX: 0, duration: 1.1, ease: 'power3.inOut' }, 0);
      SplitText.create(title2.current, {
        type: 'words',
        mask: 'words',
        maskClass: 'split-mask',
        autoSplit: true,
        onSplit: (self) => tl.from(self.words, { yPercent: 110, duration: 0.8, stagger: 0.06 }, 0.1),
      });
      tl.from('[data-sub]', { autoAlpha: 0, y: 8, duration: 0.6 }, 0.35);
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`relative flex items-end justify-between gap-4 pb-3 ${className}`}>
      <span data-rule className="absolute inset-x-0 bottom-0 h-px origin-left bg-line/10" aria-hidden />
      <div className="min-w-0 flex items-center gap-3">
        {Icon && (
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-gold/15 text-gold" aria-hidden>
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 ref={title2} className="font-display italic font-extrabold text-2xl md:text-3xl leading-none">
            {title}
          </h2>
          {description && (
            <p data-sub className="mt-1.5 text-sm text-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
