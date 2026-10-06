import { useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap, SplitText, useGSAP, EASE_OUT_EXPO, prefersReducedMotion } from '../lib/gsap';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. "Trends" or "Spel" */
  eyebrow?: string;
  /** Optional slot rendered to the right of the title on wide screens */
  aside?: ReactNode;
  /** Float the aside in the top-right corner instead of stacking it (used for the 3D hero piece) */
  floatAside?: boolean;
  children: ReactNode;
  /** Max width of content: 'default' (max-w-6xl) | 'narrow' (max-w-3xl) | 'compact' (max-w-xl) */
  contentWidth?: 'default' | 'narrow' | 'compact';
}

const widthClass = {
  default: 'max-w-6xl',
  narrow: 'max-w-3xl',
  compact: 'max-w-xl',
};

/**
 * Editorial page header: eyebrow, oversized italic serif title (SplitText word reveal), subtitle.
 */
export default function PageLayout({ title, subtitle, eyebrow, aside, floatAside = false, children, contentWidth = 'default' }: PageLayoutProps) {
  const root = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // First visit: wait for the intro curtain (see Intro.tsx)
      const introDelay = document.documentElement.dataset.intro === 'playing' ? 1.85 : 0;
      const tl = gsap.timeline({ defaults: { ease: EASE_OUT_EXPO }, delay: introDelay });
      // Hide only after JS is running, so the title is readable without it
      gsap.set('[data-reveal]', { autoAlpha: 0 });

      tl.fromTo('[data-reveal="eyebrow"]', { x: -10 }, { x: 0, autoAlpha: 1, duration: 0.5 }, 0);

      SplitText.create(titleRef.current!, {
        type: 'words',
        mask: 'words',
        wordsClass: 'split-word',
        maskClass: 'split-mask',
        autoSplit: true,
        onSplit: (self) => {
          gsap.set(titleRef.current, { autoAlpha: 1 });
          return tl.from(self.words, { yPercent: 110, duration: 0.9, stagger: 0.07 }, 0.05);
        },
      });

      tl.fromTo('[data-reveal="subtitle"]', { y: 10 }, { y: 0, autoAlpha: 1, duration: 0.6 }, 0.3)
        .fromTo('[data-reveal="aside"]', { scale: 0.92 }, { scale: 1, autoAlpha: 1, duration: 1, ease: 'power3.out' }, 0.2)
        .fromTo('[data-reveal="content"]', { y: 14 }, { y: 0, autoAlpha: 1, duration: 0.6 }, 0.25);
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`mx-auto w-full px-4 sm:px-6 pt-6 md:pt-12 pb-10 ${widthClass[contentWidth]}`}>
      <header className="relative mb-8 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="relative z-10 min-w-0">
          {eyebrow && (
            <p data-reveal="eyebrow" className="eyebrow mb-3 flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-gold" aria-hidden />
              {eyebrow}
            </p>
          )}
          <h1
            ref={titleRef}
            data-reveal="title"
            className="font-display italic font-extrabold text-[2.75rem] leading-[0.95] sm:text-6xl md:text-7xl tracking-tight text-balance"
          >
            {title}
          </h1>
          {subtitle && (
            <p data-reveal="subtitle" className="mt-4 text-base md:text-lg text-muted max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
        {aside && (
          <div data-reveal="aside" className={floatAside ? 'absolute right-0 -top-3 md:-top-12 z-0' : 'shrink-0'}>
            {aside}
          </div>
        )}
      </header>

      <div data-reveal="content">{children}</div>
    </div>
  );
}
