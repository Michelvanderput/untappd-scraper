import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { CAP_PATH } from './BottleCap';

const SEEN_KEY = 'beermenu:intro:v1';
const CIRCLE_PATH = 'M50 5 A45 45 0 1 1 49.99 5 Z';

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

// Marked when the intro has finished, not when it starts: the service worker's first-install
// reload would otherwise swallow the intro.
function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode: the intro may play again, that is fine */
  }
}

/**
 * First-visit brand moment (once per session): a ring draws itself (DrawSVG), morphs into the
 * crown cap (MorphSVG), then the curtain lifts. Skipped for reduced motion.
 */
export default function Intro() {
  const [done, setDone] = useState(() => prefersReducedMotion() || alreadySeen());
  const root = useRef<HTMLDivElement>(null);

  // Tell pages to hold their own entrance until the curtain is about to lift (see PageLayout)
  useLayoutEffect(() => {
    if (done) return;
    document.documentElement.dataset.intro = 'playing';
    return () => {
      delete document.documentElement.dataset.intro;
    };
  }, [done]);

  useGSAP(
    () => {
      if (done) return;
      const tl = gsap.timeline({ onComplete: () => {
          markSeen();
          setDone(true);
        } });
      tl.set('[data-intro="cap"]', { drawSVG: '0%', fillOpacity: 0 })
        .to('[data-intro="cap"]', { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' })
        .to('[data-intro="cap"]', { morphSVG: CAP_PATH, duration: 0.55, ease: 'power3.inOut' }, '>-0.05')
        .to('[data-intro="cap"]', { fillOpacity: 1, duration: 0.3 }, '<0.2')
        .fromTo('[data-intro="mark"]', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' }, '<0.1')
        .fromTo('[data-intro="word"]', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' }, '<0.1')
        .to(root.current, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '+=0.25');
    },
    { scope: root, dependencies: [done] }
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] grid place-items-center bg-bg pointer-events-none"
      role="presentation"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
            <path
              data-intro="cap"
              d={CIRCLE_PATH}
              fill="rgb(var(--gold))"
              stroke="rgb(var(--gold))"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            data-intro="mark"
            className="absolute inset-0 grid place-items-center font-display italic font-extrabold text-4xl text-on-gold"
          >
            B
          </span>
        </div>
        <p data-intro="word" className="font-display italic font-extrabold text-3xl tracking-tight">
          Beer<span className="text-gold">Menu</span>
        </p>
      </div>
    </div>
  );
}
