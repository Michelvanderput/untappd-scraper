import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Shuffle, Star, Flame, Feather, Zap, ExternalLink, Beer as BeerIcon, RotateCcw, SlidersHorizontal, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence, animate, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import type { BeerData, RandomizerMode } from '../types/beer';
import { secureRandomIndex, shuffled } from '../utils/random';
import { haptics } from '../utils/haptic';
import BottleCap from './BottleCap';
import Sheet from './Sheet';
import Bubbles from './Bubbles';

interface BeerRandomizerProps {
  beers: BeerData[];
  onBeerSelect?: (beer: BeerData) => void;
}

const MODES: { id: RandomizerMode; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'Alles', icon: Shuffle },
  { id: 'top-rated', label: 'Top rated', icon: Star },
  { id: 'high-abv', label: 'Sterk', icon: Flame },
  { id: 'low-abv', label: 'Licht', icon: Feather },
  { id: 'high-ibu', label: 'Bitter', icon: Zap },
];

const LIVE_REGISTER_URL = '/api/last-randomized';
const ITEM_H = 88; // px, one row in the reel
const REEL_LENGTH = 32; // rows before the winner
const SPIN_SECONDS = 3.8;

type Phase = 'idle' | 'spinning' | 'result';

// Bierfamilie: eerste deel van stijl ("Stout - Imperial" → "Stout"), anders categorie
const getBeerFamily = (beer: BeerData): string => {
  if (beer.style) return beer.style.split(' - ')[0].trim() || beer.category || '';
  return beer.category || '';
};

function applyMode(list: BeerData[], mode: RandomizerMode): BeerData[] {
  switch (mode) {
    case 'high-abv':
      return list.filter((b) => b.abv && b.abv >= 7);
    case 'low-abv':
      return list.filter((b) => b.abv && b.abv <= 5);
    case 'top-rated':
      return list.filter((b) => b.rating && b.rating >= 3.75);
    case 'high-ibu':
      return list.filter((b) => b.ibu && b.ibu >= 60);
    default:
      return list;
  }
}

function Label({ beer, className = '' }: { beer: BeerData; className?: string }) {
  const [broken, setBroken] = useState(false);
  return beer.image_url && !broken ? (
    <img
      src={beer.image_url}
      alt=""
      className={`object-contain rounded-2xl ${className}`}
      draggable={false}
      onError={() => setBroken(true)}
    />
  ) : (
    <span className={`grid place-items-center bg-surface-2 rounded-2xl ${className}`}>
      <BeerIcon className="w-1/2 h-1/2 text-muted" aria-hidden />
    </span>
  );
}

/** Number that counts up from 0 once mounted */
function CountUp({ value, decimals = 0, suffix = '' }: { value: number | null; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (value == null || !ref.current) return;
    const el = ref.current;
    if (reduce) {
      el.textContent = value.toFixed(decimals) + suffix;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      delay: 0.45,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals) + suffix;
      },
    });
    return () => controls.stop();
  }, [value, decimals, suffix, reduce]);

  if (value == null) return <span className="text-muted">–</span>;
  return <span ref={ref} className="tabular">{(0).toFixed(decimals) + suffix}</span>;
}


/** Slot-machine reel. Animates on mount and calls onDone when the winner sits in the centre slot. */
function Reel({ items, onDone }: { items: BeerData[]; onDone: () => void }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const start = ITEM_H; // row 0 in the centre slot
    const end = ITEM_H - REEL_LENGTH * ITEM_H; // winner in the centre slot
    let lastRow = 0;

    const tl = gsap.timeline({ onComplete: () => doneRef.current() });
    tl.fromTo(
      strip,
      { y: start },
      {
        y: end - ITEM_H * 0.35,
        duration: SPIN_SECONDS - 0.45,
        ease: 'power4.out',
        onUpdate: () => {
          const row = Math.round((start - (gsap.getProperty(strip, 'y') as number)) / ITEM_H);
          if (row !== lastRow) {
            lastRow = row;
            navigator.vibrate?.(4);
          }
        },
      }
    ).to(strip, { y: end, duration: 0.45, ease: 'back.out(2.2)' });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm overflow-hidden mask-fade-y" style={{ height: ITEM_H * 3 }} aria-hidden>
      <div
        className="absolute inset-x-0 z-10 rounded-2xl border-2 border-gold/70 shadow-[0_0_40px_-8px_rgb(var(--gold)/0.6)] pointer-events-none"
        style={{ top: ITEM_H, height: ITEM_H }}
      />
      <div ref={stripRef} className="will-change-transform" style={{ transform: `translateY(${ITEM_H}px)` }}>
        {items.map((beer, i) => (
          <div key={i} className="flex items-center gap-4 px-4" style={{ height: ITEM_H }}>
            <Label beer={beer} className="w-14 h-14 shrink-0" />
            <div className="min-w-0 text-left">
              <p className="font-medium truncate">{beer.name}</p>
              <p className="text-sm text-muted truncate">{beer.brewery}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BeerRandomizer({ beers, onBeerSelect }: BeerRandomizerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<BeerData | null>(null);
  const [reel, setReel] = useState<BeerData[]>([]);
  const [history, setHistory] = useState<BeerData[]>([]);
  const [liveList, setLiveList] = useState<BeerData[]>([]);
  const [mode, setMode] = useState<RandomizerMode>('all');
  const [excludedStyles, setExcludedStyles] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);

  const [capTurns, setCapTurns] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Live register: last 10 draws by everyone, refreshed every 30s
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(LIVE_REGISTER_URL, { cache: 'no-store' })
        .then((res) => (res.ok && res.headers.get('content-type')?.includes('json') ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setLiveList(Array.isArray(data.list) ? data.list : []);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const availableFamilies = useMemo(() => {
    const counts = new Map<string, number>();
    beers.forEach((beer) => {
      const family = getBeerFamily(beer);
      if (family) counts.set(family, (counts.get(family) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [beers]);

  const pool = useMemo(() => {
    const base = excludedStyles.size ? beers.filter((b) => !excludedStyles.has(getBeerFamily(b))) : beers;
    const filtered = applyMode(base, mode);
    return filtered.length > 0 ? filtered : beers;
  }, [beers, mode, excludedStyles]);

  // Three labels fanned out on the idle stage
  const teaser = useMemo(() => shuffled(pool.filter((b) => b.image_url)).slice(0, 3), [pool]);

  const finish = useCallback(
    (beer: BeerData) => {
      setPhase('result');
      haptics.success();
      setHistory((prev) => (prev.some((b) => b.beer_url === beer.beer_url) ? prev : [beer, ...prev.slice(0, 9)]));
      onBeerSelect?.(beer);
      fetch(LIVE_REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beer: {
            name: beer.name,
            beer_url: beer.beer_url,
            brewery: beer.brewery,
            image_url: beer.image_url,
            rating: beer.rating,
            style: beer.style,
            category: beer.category,
            abv: beer.abv,
          },
        }),
      })
        .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
        .then((data) => {
          if (data?.list) setLiveList(data.list);
        })
        .catch(() => {});
    },
    [onBeerSelect]
  );

  const spin = () => {
    if (phase === 'spinning' || pool.length === 0) return;

    // Skip the last 10 winners so you don't get the same beer twice in a row
    const recent = new Set(history.map((b) => b.beer_url));
    const fresh = pool.filter((b) => !recent.has(b.beer_url));
    const candidates = fresh.length > 0 ? fresh : pool;
    const picked = shuffled(candidates)[secureRandomIndex(candidates.length)];

    if (picked.image_url) new Image().src = picked.image_url;

    const fillers = Array.from({ length: REEL_LENGTH }, () => pool[secureRandomIndex(pool.length)]);
    setReel([...fillers, picked, pool[secureRandomIndex(pool.length)]]);
    setWinner(picked);
    haptics.select();
    stageRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (reduce) {
      finish(picked);
      return;
    }
    setCapTurns((n) => n + 1);
    setPhase('spinning');
  };

  const toggleFamily = (family: string) => {
    haptics.tap();
    setExcludedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  };

  const isSpinning = phase === 'spinning';

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className={`space-y-3 transition-opacity ${isSpinning ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar snap-x" role="radiogroup" aria-label="Modus">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  haptics.tap();
                  setMode(id);
                }}
                className={`chip snap-start ${active ? 'chip-active' : ''}`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="text-fg tabular font-medium">{pool.length}</span> bieren in de pot
          </p>
          <button type="button" onClick={() => setSheetOpen(true)} className="chip">
            <SlidersHorizontal className="w-4 h-4" aria-hidden />
            Stijlen
            {excludedStyles.size > 0 && (
              <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-ember text-white text-[11px] tabular">
                −{excludedStyles.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stage */}
      <div ref={stageRef} className="relative scroll-mt-20">
        <div className="relative surface overflow-hidden min-h-[360px] sm:min-h-[460px] pb-14 flex flex-col">
          {/* Rotating light rays behind the result */}
          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                key="rays"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] pointer-events-none"
                aria-hidden
              >
                <div
                  className="w-full h-full rounded-full animate-spin-slow opacity-60"
                  style={{
                    background:
                      'repeating-conic-gradient(from 0deg, rgb(var(--gold) / 0.16) 0deg 8deg, transparent 8deg 24deg)',
                    maskImage: 'radial-gradient(circle, black 10%, transparent 62%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 62%)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <div className="relative w-56 h-36 mb-6" aria-hidden>
                  {teaser.map((beer, i) => (
                    <motion.div
                      key={beer.beer_url}
                      className="absolute left-1/2 top-0 w-24 h-32 -ml-12 rounded-2xl bg-surface-2 border border-line/10 p-3 shadow-xl"
                      initial={{ rotate: 0, x: 0, opacity: 0 }}
                      animate={{ rotate: (i - 1) * 12, x: (i - 1) * 52, y: i === 1 ? -8 : 6, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 + i * 0.08 }}
                    >
                      <Label beer={beer} className="w-full h-full" />
                    </motion.div>
                  ))}
                </div>
                <p className="font-display italic font-extrabold text-3xl sm:text-4xl leading-tight text-balance mb-2">
                  Geen idee wat je wilt?
                </p>
                <p className="text-muted max-w-xs">Tik op de dop en laat het lot een bier van de kaart kiezen.</p>
              </motion.div>
            )}

            {phase === 'spinning' && (
              <motion.div
                key="reel"
                className="flex-1 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Reel items={reel} onDone={() => winner && finish(winner)} />
                <p className="sr-only" role="status">Aan het draaien…</p>
              </motion.div>
            )}

            {phase === 'result' && winner && (
              <motion.div
                key={`result-${winner.beer_url}`}
                className="relative flex-1 flex flex-col items-center p-6 pt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!reduce && <Bubbles />}
                <motion.div
                  initial={{ scale: 0.3, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6"
                >
                  <div className="absolute inset-4 rounded-full bg-gold/30 blur-2xl" aria-hidden />
                  <Label beer={winner} className="relative w-full h-full drop-shadow-2xl" />
                </motion.div>

                <motion.p
                  className="eyebrow mb-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {winner.style || winner.category}
                </motion.p>
                <h2 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] text-balance mb-2" role="status">
                  {winner.name.split(' ').map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                      <motion.span
                        className="inline-block"
                        initial={{ y: '110%' }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {word}&nbsp;
                      </motion.span>
                    </span>
                  ))}
                </h2>
                <motion.p className="text-muted mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                  {winner.brewery}
                </motion.p>

                <motion.dl
                  className="grid grid-cols-3 w-full max-w-sm rounded-2xl border border-line/10 divide-x divide-line/10 bg-bg/40 mb-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="py-3">
                    <dt className="stat-label">ABV</dt>
                    <dd className="mt-1 text-xl font-medium text-ember">
                      <CountUp value={winner.abv} decimals={1} suffix="%" />
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="stat-label">IBU</dt>
                    <dd className="mt-1 text-xl font-medium text-hop">
                      <CountUp value={winner.ibu} />
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="stat-label">Rating</dt>
                    <dd className="mt-1 text-xl font-medium text-gold">
                      <CountUp value={winner.rating} decimals={2} />
                    </dd>
                  </div>
                </motion.dl>

                <motion.div
                  className="w-full max-w-sm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <a href={winner.beer_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                    Bekijk op Untappd
                    <ExternalLink className="w-4 h-4" aria-hidden />
                  </a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The cap: primary action, overlapping the stage edge */}
        <div className="relative -mt-12 flex flex-col items-center">
          <motion.button
            type="button"
            onClick={spin}
            disabled={isSpinning}
            whileHover={isSpinning ? undefined : { scale: 1.05 }}
            whileTap={isSpinning ? undefined : { scale: 0.88 }}
            animate={{ rotate: capTurns * 1080 }}
            transition={{ duration: SPIN_SECONDS, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-full disabled:cursor-wait"
            aria-label={phase === 'result' ? 'Draai nog een keer' : 'Draai: kies een willekeurig bier'}
          >
            <BottleCap className="w-24 h-24 drop-shadow-[0_16px_28px_rgba(242,179,61,0.35)]">
              {phase === 'result' ? <RotateCcw className="w-8 h-8" /> : <Shuffle className="w-8 h-8" />}
            </BottleCap>
          </motion.button>
          <p className="mt-2 text-sm font-medium text-muted">
            {isSpinning ? 'Draaien…' : phase === 'result' ? 'Nog een keer' : 'Draai'}
          </p>
        </div>
      </div>

      {/* Live register */}
      <section aria-labelledby="live-title">
        <div className="flex items-center justify-between mb-4">
          <h3 id="live-title" className="font-display italic font-extrabold text-2xl">Net gedraaid</h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-hop">
            <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden />
            Live
          </span>
        </div>
        {liveList.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center surface">Nog niks gedraaid. Wees de eerste.</p>
        ) : (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1">
            {liveList.map((beer, index) => (
              <a
                key={`${beer.beer_url}-${index}`}
                href={beer.beer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="snap-start shrink-0 w-32 surface rounded-2xl p-3 hover:border-gold/40 transition-colors"
              >
                <Label beer={beer} className="w-full h-20 mb-3" />
                <p className="text-sm font-medium truncate">{beer.name}</p>
                <p className="text-xs text-muted truncate">{beer.brewery ?? ''}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Stijlen uitsluiten"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setExcludedStyles(new Set())}
              disabled={excludedStyles.size === 0}
            >
              Wis alles
            </button>
            <button type="button" className="btn-primary flex-1" onClick={() => setSheetOpen(false)}>
              {pool.length} bieren in de pot
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted mb-4">Tik op een stijl om die over te slaan.</p>
        <div className="flex flex-wrap gap-2">
          {availableFamilies.map(([family, count]) => {
            const excluded = excludedStyles.has(family);
            return (
              <button
                key={family}
                type="button"
                aria-pressed={excluded}
                onClick={() => toggleFamily(family)}
                className={`chip ${excluded ? 'line-through bg-ember/10 border-ember/40 text-ember hover:text-ember' : ''}`}
              >
                {family}
                <span className="text-xs opacity-60 tabular no-underline">{count}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
