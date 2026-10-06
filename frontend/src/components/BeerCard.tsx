import { memo, useEffect, useRef, useState } from 'react';
import { Beer, Star } from 'lucide-react';
import type { BeerData } from '../types/beer';
import { gsap, prefersReducedMotion } from '../lib/gsap';

interface BeerCardProps {
  beer: BeerData;
  onClick: () => void;
  /** Larger variant, used in the menu builder reveal */
  size?: 'default' | 'large';
}

function BeerCard({ beer, onClick, size = 'default' }: BeerCardProps) {
  const [broken, setBroken] = useState(false);
  const large = size === 'large';
  const card = useRef<HTMLButtonElement>(null);

  // Stop any running tween when the card unmounts
  useEffect(() => {
    const el = card.current;
    return () => {
      if (el) gsap.killTweensOf(el);
    };
  }, []);

  // 3D tilt + moving glare on hover (mouse/pen only; touch and reduced motion keep it flat)
  const canTilt = () => !prefersReducedMotion() && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!canTilt() || e.pointerType === 'touch') return;
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    gsap.to(el, {
      rotationY: (px - 0.5) * 10,
      rotationX: (0.5 - py) * 8,
      y: -4,
      transformPerspective: 900,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };

  const onLeave = () => {
    if (!card.current) return;
    gsap.to(card.current, { rotationY: 0, rotationX: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.6)', overwrite: 'auto' });
  };

  return (
    <button
      ref={card}
      type="button"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative w-full h-full text-left surface overflow-hidden flex flex-col transition-[border-color] duration-300 ease-out-expo hover:border-gold/30 active:brightness-95 will-change-transform"
    >
      {/* Glare follows the pointer */}
      <span
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:hidden"
        style={{ background: 'radial-gradient(240px circle at var(--gx,50%) var(--gy,0%), rgb(var(--gold) / 0.14), transparent 70%)' }}
        aria-hidden
      />
      <div className={`relative bg-surface-2/60 grid place-items-center ${large ? 'h-64' : 'h-32 sm:h-40'}`}>
        {beer.image_url && !broken ? (
          <img
            src={beer.image_url}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className={`object-contain rounded-xl drop-shadow-xl transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:-rotate-3 ${
              large ? 'h-48 w-48' : 'h-20 w-20 sm:h-28 sm:w-28'
            }`}
          />
        ) : (
          <Beer className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-muted/60`} aria-hidden />
        )}

        {beer.rating != null && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-bg/80 backdrop-blur text-xs font-medium tabular">
            <Star className="w-3 h-3 text-gold fill-gold" aria-hidden />
            {beer.rating.toFixed(1)}
            <span className="sr-only"> sterren</span>
          </span>
        )}
        {beer.abv != null && (
          <span className="absolute top-2.5 right-2.5 h-6 px-2 inline-flex items-center rounded-full bg-bg/80 backdrop-blur text-xs font-medium tabular text-ember">
            {beer.abv}%
          </span>
        )}
      </div>

      <div className={`flex-1 flex flex-col ${large ? 'p-5' : 'p-3 sm:p-4'}`}>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted truncate mb-1">{beer.style || beer.category}</p>
        <h3
          className={`leading-tight line-clamp-2 transition-colors group-hover:text-gold ${
            large ? 'font-display italic font-extrabold text-3xl' : 'font-medium text-[15px]'
          }`}
        >
          {beer.name}
        </h3>
        {beer.brewery && <p className={`text-muted truncate mt-1 ${large ? 'text-base' : 'text-xs'}`}>{beer.brewery}</p>}
      </div>
    </button>
  );
}

export default memo(BeerCard);
