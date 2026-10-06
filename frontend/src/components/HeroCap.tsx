import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import BottleCap from './BottleCap';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';

// three.js (+ R3F) is ~600 kB: only fetched once the hero is on screen and WebGL works
const HeroCap3D = lazy(() => import('./HeroCap3D'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function dataSaver() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!conn?.saveData;
}

/**
 * Hero centrepiece: the brand's crown cap as a real 3D object. It spins, leans toward the pointer
 * and rolls with the scroll. Falls back to the flat SVG cap when WebGL is unavailable.
 */
export default function HeroCap() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [use3D] = useState(() => hasWebGL() && !dataSaver());
  const [seen, setSeen] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = prefersReducedMotion();

  // Mount the heavy chunk when the hero is first visible; pause rendering when it scrolls away
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo('[data-ring="draw"]', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.8, ease: 'power2.inOut', delay: 0.4 });
      gsap.to('[data-ring="ticks"]', { rotation: 360, transformOrigin: '50% 50%', duration: 60, ease: 'none', repeat: -1 });

      // The whole piece drifts up and fades as the page scrolls
      gsap.to(root.current, {
        y: -60,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { start: 0, end: 520, scrub: true },
      });
      ScrollTrigger.create({
        start: 0,
        end: 700,
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      className="relative isolate w-28 h-28 sm:w-40 sm:h-40 md:w-60 md:h-60 select-none"
     
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        <circle data-ring="draw" cx="50" cy="50" r="47" fill="none" stroke="rgb(var(--gold))" strokeOpacity="0.55" strokeWidth="0.35" />
        <circle
          data-ring="ticks"
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="rgb(var(--gold))"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeDasharray="0.4 3.2"
        />
      </svg>

      <div
        className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, rgb(var(--gold) / 0.35), transparent 65%)' }}
        aria-hidden
      />

      <div className="absolute inset-[6%]">
        {use3D && seen ? (
          <Suspense fallback={<FlatCap />}>
            <HeroCap3D progress={progress} active={inView} animate={!reduced} />
          </Suspense>
        ) : (
          <FlatCap />
        )}
      </div>
    </div>
  );
}

function FlatCap() {
  return (
    <div className="w-full h-full grid place-items-center" aria-hidden>
      <BottleCap className="w-3/4 h-3/4 drop-shadow-[0_18px_40px_rgba(242,179,61,0.35)]">
        <span className="font-display italic font-extrabold text-5xl">B</span>
      </BottleCap>
    </div>
  );
}

