import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Pencil, Undo2, RotateCcw, UserPlus, X, Play, Crown, Skull, Users } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import BottleCap from '../components/BottleCap';
import SEO from '../components/SEO';
import Bubbles from '../components/Bubbles';
import { haptics } from '../utils/haptic';

/*
 * Toepen scoreboard.
 * Everyone starts at 0. Points are written down as tally marks on a beer coaster.
 * 14 points → "P" next to your name. 15 points → out. Last one standing wins.
 */

const MAX_POINTS = 15;
const P_POINTS = 14;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const STORAGE_KEY = 'toepen:game:v1';
const NAMES_KEY = 'toepen:names:v1';
const UNDO_LIMIT = 60;

interface Player {
  id: string;
  name: string;
  score: number;
}

interface Snapshot {
  players: Player[];
  stake: number;
  round: number;
}

interface GameState extends Snapshot {
  phase: 'setup' | 'playing';
  history: Snapshot[];
}

const EMPTY: GameState = { phase: 'setup', players: [], stake: 1, round: 1, history: [] };

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — the game still works for this session
  }
}

const newId = () => Math.random().toString(36).slice(2, 10);
const isOut = (p: Player) => p.score >= MAX_POINTS;
const hasP = (p: Player) => p.score === P_POINTS;

/* ------------------------------------------------------------------ */

function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-sm surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <h2 id="confirm-title" className="font-display italic font-extrabold text-2xl mb-2">{title}</h2>
            <p className="text-muted mb-6">{body}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn-secondary" onClick={onCancel} autoFocus>
                Annuleer
              </button>
              <button type="button" className="btn bg-ember text-white" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */

const INK = '#1b2a63'; // ballpoint blue
const INK_RED = '#b22222';

const svgUri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* Cardboard fibres + blotchy mottling for the coaster */
const CARDBOARD_FIBRE = svgUri(
  "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .32 0 0 0 0 .22 0 0 0 0 .1 0 0 0 .7 -.12'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>"
);
const CARDBOARD_MOTTLE = svgUri(
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.014' numOctaves='3' seed='5' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .34 0 0 0 0 .15 0 0 0 .9 -.28'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>"
);
/* Horizontal wood grain for the bar top */
const WOOD_GRAIN = svgUri(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.006 .2' numOctaves='4' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .1 0 0 0 0 .045 0 0 0 0 .01 0 0 0 2.2 -.7'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>"
);

const PEN = { filter: 'url(#pen-ink)' } as const;

/** Ballpoint look: wobbly line edges plus tiny gaps where the ink skips */
function PenFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        <filter id="pen-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.75" result="skips" />
          <feComposite in="wobbly" in2="skips" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/** Hand-drawn divider line between players */
function PenLine() {
  return (
    <svg viewBox="0 0 300 8" preserveAspectRatio="none" className="absolute left-0 right-0 bottom-0 w-full h-2" aria-hidden fill="none">
      <path
        d="M2 4 C40 2 70 6.5 110 4 S190 1.8 230 4.6 S282 4 298 3"
        stroke={INK}
        strokeOpacity=".32"
        strokeWidth="1.3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** One group of up to five strokes: four uprights and a diagonal strike-through */
function TallyGroup({ count, seed, red }: { count: number; seed: number; red: boolean }) {
  const reduce = useReducedMotion();
  const color = red ? INK_RED : INK;
  // Slightly wobbly, hand-drawn looking strokes (deterministic so they don't jump on re-render)
  const wob = (i: number) => (((seed * 7 + i * 13) % 5) - 2) * 0.9;
  const strokes = [
    ...Array.from({ length: Math.min(count, 4) }, (_, i) => {
      const x = 7 + i * 10;
      return {
        d: `M${x + wob(i)} ${5 + wob(i + 3) / 2} Q${x + 1 + wob(i + 5) * 1.2} 24 ${x + 1 + wob(i + 1)} ${42 + wob(i + 2) / 2}`,
        w: 2.1 + (i % 2) * 0.4,
      };
    }),
    ...(count === 5 ? [{ d: `M1 ${38 + wob(9)} Q22 ${24 + wob(4)} 45 ${9 + wob(8)}`, w: 2.3 }] : []),
  ];

  return (
    <svg viewBox="0 0 46 48" className="w-[38px] h-10 shrink-0" fill="none" aria-hidden>
      {strokes.map((st, i) => (
        <motion.path
          key={i}
          d={st.d}
          stroke={color}
          strokeWidth={st.w}
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}

function Tally({ score, red }: { score: number; red: boolean }) {
  const groups = Array.from({ length: Math.ceil(score / 5) }, (_, g) => Math.min(5, score - g * 5));
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 min-h-10 items-center" aria-hidden>
      {groups.length === 0 ? (
        <span className="text-lg opacity-40" style={HAND}>
          nog niks…
        </span>
      ) : (
        groups.map((count, g) => <TallyGroup key={g} count={count} seed={g + 1} red={red} />)
      )}
    </div>
  );
}

const HAND = { fontFamily: "'Caveat','Segoe Print','Bradley Hand','Comic Sans MS',cursive" } as const;

function PlayerRow({
  player,
  last,
  onAdd,
  onSubtract,
}: {
  player: Player;
  last: boolean;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  const out = isOut(player);
  const p = hasP(player);
  const reduce = useReducedMotion();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={out && !reduce ? { opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative pt-3 pb-4"
    >
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[2rem] leading-[1.35] py-0.5 pr-3 break-words [overflow-wrap:anywhere] ${out ? 'line-through decoration-2 opacity-60' : ''}`}
              style={{ ...HAND, fontWeight: 600 }}
            >
              {player.name}
            </span>
            <AnimatePresence>
              {p && (
                <motion.span
                  key="p"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: -8 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                  className="shrink-0 grid place-items-center w-7 h-7 rounded-full border-2 text-lg leading-none"
                  style={{ ...HAND, fontWeight: 600, color: INK_RED, borderColor: INK_RED }}
                  aria-label="P: nog één punt"
                  title="P — nog één punt en je ligt eruit"
                >
                  P
                </motion.span>
              )}
              {out && (
                <motion.span
                  key="out"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: -6 }}
                  className="shrink-0 inline-flex items-center gap-1 text-xl leading-none"
                  style={{ ...HAND, fontWeight: 600, color: INK_RED }}
                >
                  <Skull className="w-4 h-4" aria-hidden />
                  eruit!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <span className="text-4xl leading-none tabular pr-1" style={{ ...HAND, fontWeight: 600, color: p || out ? INK_RED : INK }} aria-label={`${player.score} punten`}>
          {player.score}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onAdd}
          disabled={out}
          className="flex-1 text-left rounded-lg px-1 -mx-1 active:bg-black/5 disabled:pointer-events-none"
          aria-label={`Punt bijschrijven voor ${player.name}`}
        >
          <Tally score={player.score} red={out || p} />
        </button>
        <button
          type="button"
          onClick={onSubtract}
          disabled={player.score === 0}
          className="grid place-items-center w-11 h-11 rounded-full border-2 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-transform"
          style={{ borderColor: `${INK}55`, color: INK }}
          aria-label={`Eén punt eraf bij ${player.name}`}
        >
          <Minus className="w-5 h-5" />
        </button>
        <motion.button
          type="button"
          onClick={onAdd}
          disabled={out}
          whileTap={{ scale: 0.92, rotate: -8 }}
          className="grid place-items-center w-11 h-11 rounded-full disabled:opacity-25"
          style={{ background: INK, color: '#f7f1e6' }}
          aria-label={`Punt bijschrijven voor ${player.name}`}
        >
          <Pencil className="w-5 h-5" />
        </motion.button>
      </div>
      {!last && <PenLine />}
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */

function Setup({ onStart }: { onStart: (names: string[]) => void }) {
  const [names, setNames] = useState<string[]>(() => readStorage<string[]>(NAMES_KEY, []));
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = draft.trim();
  const duplicate = names.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  const full = names.length >= MAX_PLAYERS;

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed || duplicate || full) return;
    setNames((prev) => [...prev, trimmed]);
    setDraft('');
    haptics.tap();
    inputRef.current?.focus();
  };

  const remove = (name: string) => setNames((prev) => prev.filter((n) => n !== name));

  const move = (index: number) => {
    // Move player one seat up (wraps to end) — seat order matters for dealing
    setNames((prev) => {
      const next = [...prev];
      const target = index === 0 ? next.length - 1 : index - 1;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="surface p-4 sm:p-5">
        <label htmlFor="player-name" className="stat-label block mb-3">
          Wie doen er mee?
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="player-name"
            className="field text-lg"
            placeholder="Naam van speler"
            value={draft}
            maxLength={20}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(e) => setDraft(e.target.value)}
            disabled={full}
            aria-describedby="player-hint"
          />
          <button type="submit" className="btn-primary px-4 shrink-0" disabled={!trimmed || duplicate || full} aria-label="Speler toevoegen">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
        <p id="player-hint" className={`mt-2 text-sm ${duplicate && trimmed ? 'text-ember' : 'text-muted'}`}>
          {duplicate && trimmed
            ? 'Die naam staat er al tussen.'
            : full
              ? `Maximaal ${MAX_PLAYERS} spelers.`
              : 'Voeg spelers toe in zitvolgorde. Tik op een naam om een plek op te schuiven.'}
        </p>
      </form>

      <ul className="space-y-2" aria-label="Spelers">
        <AnimatePresence initial={false}>
          {names.map((name, i) => (
            <motion.li
              key={name}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="surface flex items-center gap-3 pl-2 pr-2 py-2 rounded-2xl"
            >
              <button
                type="button"
                onClick={() => move(i)}
                className="flex-1 flex items-center gap-3 min-h-[44px] text-left rounded-xl px-2 hover:bg-line/5"
                aria-label={`${name}, plek ${i + 1}. Tik om een plek op te schuiven`}
              >
                <span className="grid place-items-center w-8 h-8 rounded-full bg-line/10 text-sm tabular text-muted">{i + 1}</span>
                <span className="font-medium text-lg truncate">{name}</span>
              </button>
              <button type="button" onClick={() => remove(name)} className="icon-btn text-muted" aria-label={`Verwijder ${name}`}>
                <X className="w-5 h-5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {names.length === 0 && (
        <div className="text-center py-8 text-muted">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-60" aria-hidden />
          Nog geen spelers.
        </div>
      )}

      <div className="surface p-5">
        <p className="stat-label mb-3">Spelregels in dit spel</p>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex gap-3"><span className="text-fg tabular w-8 shrink-0">+1</span>Wie een ronde verliest krijgt er een streepje bij.</li>
          <li className="flex gap-3"><span className="w-8 shrink-0"><span className="grid place-items-center w-6 h-6 rounded-full bg-ember text-white font-display italic font-extrabold text-xs">P</span></span>Op 14 punten krijg je een P naast je naam.</li>
          <li className="flex gap-3"><span className="text-ember tabular w-8 shrink-0">15</span>Op 15 punten lig je eruit. De laatste die overblijft wint.</li>
        </ul>
      </div>

      <div className="sticky md:static bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10 rounded-full bg-bg">
        <button
          type="button"
          className="btn-primary w-full h-14 text-lg"
          disabled={names.length < MIN_PLAYERS}
          onClick={() => {
            writeStorage(NAMES_KEY, names);
            onStart(names);
          }}
        >
          <Play className="w-5 h-5" />
          {names.length < MIN_PLAYERS ? `Nog ${MIN_PLAYERS - names.length} speler${MIN_PLAYERS - names.length === 1 ? '' : 's'} nodig` : 'Start potje'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function WinnerOverlay({
  winner,
  onRematch,
  onNewPlayers,
  onUndo,
}: {
  winner: Player;
  onRematch: () => void;
  onNewPlayers: () => void;
  onUndo: () => void;
}) {

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center p-6 bg-bg/95 backdrop-blur-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
    >
      <Bubbles count={24} duration={4} />
      <div className="relative text-center max-w-sm">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          className="mx-auto mb-6 w-28 h-28"
        >
          <BottleCap className="w-28 h-28">
            <Crown className="w-10 h-10" />
          </BottleCap>
        </motion.div>
        <p className="eyebrow mb-2">Winnaar van het potje</p>
        <motion.h2
          id="winner-title"
          className="font-display italic font-extrabold text-6xl leading-none mb-3 break-words"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
        >
          {winner.name}
        </motion.h2>
        <p className="text-muted mb-8">
          Overleefd met <span className="text-fg tabular">{winner.score}</span> {winner.score === 1 ? 'punt' : 'punten'}. Proost!
        </p>
        <div className="grid gap-3">
          <button type="button" className="btn-primary h-14 text-lg" onClick={onRematch} autoFocus>
            <RotateCcw className="w-5 h-5" />
            Revanche
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-ghost px-3 text-sm" onClick={onUndo}>
              <Undo2 className="w-4 h-4" />
              Ongedaan
            </button>
            <button type="button" className="btn-ghost px-3 text-sm" onClick={onNewPlayers}>
              <Users className="w-4 h-4" />
              Andere spelers
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function ToepenPage() {
  const [game, setGame] = useState<GameState>(() => readStorage<GameState>(STORAGE_KEY, EMPTY));
  const [confirm, setConfirm] = useState<null | 'reset'>(null);

  useEffect(() => writeStorage(STORAGE_KEY, game), [game]);

  const alive = game.players.filter((p) => !isOut(p));
  const winner = game.phase === 'playing' && game.players.length >= MIN_PLAYERS && alive.length === 1 ? alive[0] : null;

  /** Apply a change and push the previous state on the undo stack */
  const commit = (next: Partial<Snapshot>) =>
    setGame((g) => ({
      ...g,
      ...next,
      history: [...g.history, { players: g.players, stake: g.stake, round: g.round }].slice(-UNDO_LIMIT),
    }));

  const start = (names: string[]) => {
    haptics.success();
    setGame({
      phase: 'playing',
      players: names.map((name) => ({ id: newId(), name, score: 0 })),
      stake: 1,
      round: 1,
      history: [],
    });
  };

  const addPoints = (id: string) => {
    const player = game.players.find((p) => p.id === id);
    if (!player || isOut(player)) return;
    const score = Math.min(MAX_POINTS, player.score + 1);
    if (score >= MAX_POINTS) haptics.error();
    else if (score === P_POINTS) haptics.warning();
    else haptics.select();
    commit({ players: game.players.map((p) => (p.id === id ? { ...p, score } : p)) });
  };

  const subtractPoint = (id: string) => {
    haptics.tap();
    commit({ players: game.players.map((p) => (p.id === id ? { ...p, score: Math.max(0, p.score - 1) } : p)) });
  };

  const undo = () => {
    setGame((g) => {
      const prev = g.history[g.history.length - 1];
      if (!prev) return g;
      haptics.tap();
      return { ...g, ...prev, history: g.history.slice(0, -1) };
    });
  };

  const rematch = () => start(game.players.map((p) => p.name));
  const backToSetup = () => {
    setConfirm(null);
    setGame(EMPTY);
  };

  const leader = [...alive].sort((a, b) => a.score - b.score)[0];

  return (
    <>
      <SEO title="Toepen – BeerMenu" description="Houd de punten van een potje Toepen bij. Op 14 een P, op 15 eruit." />
      <PageLayout
        eyebrow="Kaartspel"
        title="Toepen"
        subtitle={game.phase === 'setup' ? 'Houd de stand bij van je potje. Op 14 krijg je een P, op 15 lig je eruit.' : undefined}
        contentWidth="compact"
      >
        {game.phase === 'setup' ? (
          <Setup onStart={start} />
        ) : (
          <div className="space-y-5">
            {leader && alive.length > 1 && (
              <p className="text-sm text-muted px-1">
                <span className="text-fg">{leader.name}</span> staat er het best voor · {alive.length} van {game.players.length} nog in het spel
              </p>
            )}

            {/* Bar top with a beer coaster on it */}
            <div
              className="relative overflow-hidden rounded-[1.75rem] px-6 py-8 sm:px-10 sm:py-10 shadow-[inset_0_2px_0_rgba(255,255,255,0.08),inset_0_0_70px_rgba(0,0,0,0.55),0_20px_50px_-24px_rgba(0,0,0,0.7)]"
              style={{
                backgroundColor: '#5a3519',
                backgroundImage: [
                  'radial-gradient(ellipse at 50% 0%, rgba(255,184,96,0.34), transparent 62%)',
                  'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)',
                  'repeating-linear-gradient(180deg, transparent 0 168px, rgba(0,0,0,0.6) 168px 170px, rgba(255,210,150,0.08) 170px 172px)',
                  WOOD_GRAIN,
                  'linear-gradient(180deg, #7a4a24, #55321a)',
                ].join(', '),
                backgroundSize: 'auto, auto, auto, 600px 400px, auto',
              }}
            >
              {/* Old glass rings on the wood */}
              <div
                className="absolute -left-10 top-1/3 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, transparent 55%, rgba(20,8,0,0.35) 58%, rgba(20,8,0,0.14) 66%, transparent 72%)' }}
                aria-hidden
              />
              <div
                className="absolute -right-12 bottom-10 w-44 h-44 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, transparent 55%, rgba(255,200,130,0.16) 58%, rgba(255,200,130,0.06) 66%, transparent 72%)' }}
                aria-hidden
              />

              <section className="relative mx-auto max-w-md" style={{ transform: 'rotate(-0.8deg)' }} aria-label="Bierviltje met stand">
                {/* Second coaster peeking out underneath */}
                <div
                  className="absolute inset-0 rounded-[2rem]"
                  style={{ background: '#bfa677', transform: 'rotate(3deg) translate(6px, 4px)', boxShadow: '0 8px 14px -6px rgba(0,0,0,0.6)' }}
                  aria-hidden
                />
                <div
                  className="relative overflow-hidden rounded-[2rem] px-7 pt-7 pb-4 sm:px-9"
                  style={{
                    color: INK,
                    backgroundColor: '#dcc59a',
                    backgroundImage: [
                      'radial-gradient(circle at 22% 10%, rgba(255,255,255,0.5), transparent 55%)',
                      'radial-gradient(circle at 90% 105%, rgba(110,75,30,0.3), transparent 60%)',
                      CARDBOARD_FIBRE,
                      CARDBOARD_MOTTLE,
                    ].join(', '),
                    backgroundSize: 'auto, auto, 260px 260px, 400px 400px',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 0 22px rgba(90,60,25,0.25), 0 0 0 1px rgba(70,45,15,0.4), 0 2px 3px rgba(0,0,0,0.5), 0 16px 24px -10px rgba(0,0,0,0.75)',
                  }}
                >
                  <PenFilter />

                  {/* Pressed + printed rim */}
                  <div className="absolute inset-3 rounded-[1.5rem] pointer-events-none" style={{ border: '2px solid rgba(150,55,38,0.42)' }} aria-hidden />
                  <div className="absolute inset-[18px] rounded-[1.25rem] pointer-events-none" style={{ border: '1px solid rgba(150,55,38,0.28)', boxShadow: 'inset 0 1px 2px rgba(60,35,10,0.18)' }} aria-hidden />
                  {/* Beer ring stain */}
                  <div
                    className="absolute -right-10 bottom-16 w-40 h-40 rounded-full pointer-events-none mix-blend-multiply"
                    style={{ background: 'radial-gradient(circle, transparent 54%, rgba(120,70,20,0.3) 57%, rgba(120,70,20,0.14) 64%, transparent 70%)' }}
                    aria-hidden
                  />

                  <p
                    className="relative text-center text-[9px] font-bold uppercase tracking-[0.2em] mb-4 whitespace-nowrap mix-blend-multiply"
                    style={{ color: 'rgba(150,55,38,0.7)', fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    ★ Biertaverne De Gouverneur ★
                  </p>

                  <div className="relative" style={PEN}>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-3xl leading-none py-1 pr-2" style={{ ...HAND, fontWeight: 600 }}>
                        De stand
                      </h2>
                      <button
                        type="button"
                        onClick={undo}
                        disabled={game.history.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border-2 text-xl leading-none disabled:opacity-25 active:scale-95 transition-transform"
                        style={{ ...HAND, fontWeight: 600, borderColor: `${INK}66` }}
                      >
                        <Undo2 className="w-4 h-4" />
                        Ongedaan
                      </button>
                    </div>
                    <ul aria-label="Scorebord">
                      {game.players.map((player, i) => (
                        <PlayerRow
                          key={player.id}
                          player={player}
                          last={i === game.players.length - 1}
                          onAdd={() => addPoints(player.id)}
                          onSubtract={() => subtractPoint(player.id)}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-center pt-2">
              <button type="button" className="btn-ghost text-ember" onClick={() => setConfirm('reset')}>
                <RotateCcw className="w-4 h-4" />
                Potje stoppen
              </button>
            </div>
          </div>
        )}
      </PageLayout>

      {createPortal(
        <>
          <ConfirmSheet
            open={confirm === 'reset'}
            title="Potje stoppen?"
            body="De huidige stand gaat verloren. Je spelers blijven bewaard."
            confirmLabel="Stoppen"
            onConfirm={backToSetup}
            onCancel={() => setConfirm(null)}
          />

          <AnimatePresence>
            {winner && <WinnerOverlay winner={winner} onRematch={rematch} onNewPlayers={backToSetup} onUndo={undo} />}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
