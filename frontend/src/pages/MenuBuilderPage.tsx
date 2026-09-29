import { useState, lazy, Suspense } from 'react';
import {
  Sparkles,
  RefreshCw,
  Download,
  Share2,
  Shuffle,
  Map,
  PartyPopper,
  GraduationCap,
  ChevronDown,
  Minus,
  Plus,
  ArrowRight,
  Check,
  Scale,
  Beer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BeerData } from '../types/beer';
import { generateBeerMenu, generatePairingSuggestions, type GeneratedMenu, type MenuGenerationOptions } from '../utils/beerPairing';
import BeerCard from '../components/BeerCard';
import BottleCap from '../components/BottleCap';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import { useBeers } from '../hooks/useBeers';
import { haptics } from '../utils/haptic';

const BeerModal = lazy(() => import('../components/BeerModal'));

type Mode = MenuGenerationOptions['mode'];

const GENERATION_MODES: { id: Mode; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'balanced', label: 'Balans', icon: Scale, description: 'Een mooie mix van stijlen' },
  { id: 'journey', label: 'Reis', icon: Map, description: 'Van licht naar zwaar' },
  { id: 'party', label: 'Party', icon: PartyPopper, description: 'Crowd pleasers' },
  { id: 'expert', label: 'Expert', icon: GraduationCap, description: 'Voor kenners' },
  { id: 'random', label: 'Random', icon: Shuffle, description: 'Het lot beslist' },
];

// Generator themes start with an emoji; the UI uses Lucide icons instead
const cleanTheme = (theme: string) => theme.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '');

const MIN_SIZE = 3;
const MAX_SIZE = 8;

export default function MenuBuilderPage() {
  const { beers, loading } = useBeers();

  const [menuSize, setMenuSize] = useState(4);
  const [mode, setMode] = useState<Mode>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minABV, setMinABV] = useState<number | undefined>(undefined);
  const [maxABV, setMaxABV] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const [viewState, setViewState] = useState<'setup' | 'revealing' | 'summary'>('setup');
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    haptics.select();
    // Short pause so the build-up animation reads as "composing"
    setTimeout(() => {
      const menu = generateBeerMenu(beers, {
        size: menuSize,
        mode,
        preferences: { minABV, maxABV, minRating },
      });
      setGeneratedMenu(menu);
      setRevealIndex(0);
      setViewState('revealing');
      setGenerating(false);
    }, 700);
  };

  const handleNextReveal = () => {
    if (!generatedMenu) return;
    haptics.tap();
    if (revealIndex < generatedMenu.beers.length - 1) setRevealIndex((i) => i + 1);
    else setViewState('summary');
  };

  const handleReset = () => {
    setViewState('setup');
    setGeneratedMenu(null);
    setRevealIndex(0);
  };

  const menuText = (menu: GeneratedMenu) =>
    `
${menu.theme}
${menu.description}

Bieren:
${menu.beers
  .map(
    (beer, i) => `${i + 1}. ${beer.name} - ${beer.brewery}
   ${beer.abv}% ABV ${beer.ibu ? `| ${beer.ibu} IBU` : ''} | ${beer.rating?.toFixed(2)}
   ${beer.style}`
  )
  .join('\n\n')}
${menu.pairingNotes ? '\nTips:\n' + menu.pairingNotes.join('\n') : ''}

${generatePairingSuggestions(menu).join('\n')}
`.trim();

  const handleExport = () => {
    if (!generatedMenu) return;
    const blob = new Blob([menuText(generatedMenu)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bier-menu-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!generatedMenu) return;
    const text = `Mijn biermenu: ${cleanTheme(generatedMenu.theme)}\n${generatedMenu.beers.map((b) => b.name).join(', ')}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setNote('Menu gekopieerd');
        setTimeout(() => setNote(null), 2000);
      }
    } catch {
      // share cancelled
    }
  };

  if (loading && beers.length === 0) {
    return (
      <div className="grid place-items-center min-h-[70vh]" role="status" aria-label="Bieren laden">
        <BottleCap className="w-14 h-14" spinning />
      </div>
    );
  }

  const selectedMode = GENERATION_MODES.find((m) => m.id === mode)!;

  return (
    <>
      <SEO title="Menu Builder – BeerMenu" description="Stel een proeverij-menu samen van de kaart." />
      <PageLayout
        eyebrow={viewState === 'setup' ? 'Proeverij' : 'Jouw menu'}
        title={viewState === 'setup' ? 'Menu Builder' : generatedMenu ? cleanTheme(generatedMenu.theme) : 'Menu'}
        subtitle={viewState === 'setup' ? 'Stel een proeverij samen: kies een sfeer en het aantal glazen.' : undefined}
        contentWidth="compact"
      >
        <AnimatePresence mode="wait">
          {viewState === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
              <fieldset>
                <legend className="stat-label mb-3">Sfeer</legend>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {GENERATION_MODES.map(({ id, label, icon: Icon, description }, i) => {
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
                        className={`relative text-left p-4 rounded-3xl border transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] ${
                          i === GENERATION_MODES.length - 1 ? 'col-span-2' : ''
                        } ${active ? 'bg-fg text-bg border-fg' : 'bg-surface border-line/10 hover:border-line/25'}`}
                      >
                        <Icon className={`w-6 h-6 mb-6 ${active ? 'text-bg' : 'text-gold'}`} aria-hidden />
                        <span className="block font-display italic font-extrabold text-2xl leading-none">{label}</span>
                        <span className={`block mt-1 text-sm ${active ? 'text-bg/70' : 'text-muted'}`}>{description}</span>
                        {active && <Check className="absolute top-4 right-4 w-5 h-5" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="surface p-4 flex items-center justify-between">
                <div>
                  <p className="stat-label">Aantal glazen</p>
                  <p className="text-sm text-muted mt-1">
                    {MIN_SIZE}–{MAX_SIZE}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="icon-btn border border-line/15"
                    onClick={() => setMenuSize((n) => Math.max(MIN_SIZE, n - 1))}
                    disabled={menuSize <= MIN_SIZE}
                    aria-label="Minder glazen"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-display italic font-extrabold text-4xl w-8 text-center tabular" aria-live="polite">
                    {menuSize}
                  </span>
                  <button
                    type="button"
                    className="icon-btn border border-line/15"
                    onClick={() => setMenuSize((n) => Math.min(MAX_SIZE, n + 1))}
                    disabled={menuSize >= MAX_SIZE}
                    aria-label="Meer glazen"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="btn-ghost px-2 -ml-2"
                  aria-expanded={showAdvanced}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Meer opties
                </button>
                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 pt-3">
                        {[
                          { id: 'min-abv', label: 'Min ABV', value: minABV, set: setMinABV, placeholder: '0', step: '0.5' },
                          { id: 'max-abv', label: 'Max ABV', value: maxABV, set: setMaxABV, placeholder: '15', step: '0.5' },
                          { id: 'min-rating', label: 'Min rating', value: minRating, set: setMinRating, placeholder: '0', step: '0.1' },
                        ].map((f) => (
                          <div key={f.id}>
                            <label htmlFor={f.id} className="stat-label block mb-1.5">
                              {f.label}
                            </label>
                            <input
                              id={f.id}
                              type="number"
                              inputMode="decimal"
                              step={f.step}
                              placeholder={f.placeholder}
                              value={f.value ?? ''}
                              onChange={(e) => f.set(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="field tabular"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary w-full h-14 text-lg">
                {generating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Menu samenstellen…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Stel mijn {selectedMode.label.toLowerCase()}-menu samen
                  </>
                )}
              </button>
            </motion.div>
          )}

          {viewState === 'revealing' && generatedMenu && (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="stat-label">
                  Glas <span className="text-fg tabular">{revealIndex + 1}</span> van <span className="tabular">{generatedMenu.beers.length}</span>
                </p>
                <button type="button" className="btn-ghost min-h-[40px] px-3 text-sm" onClick={() => setViewState('summary')}>
                  Sla over
                </button>
              </div>
              <div className="flex gap-1 mb-6" aria-hidden>
                {generatedMenu.beers.map((_, i) => (
                  <span key={i} className="h-1 flex-1 rounded-full bg-line/10 overflow-hidden">
                    <motion.span
                      className="block h-full bg-gold"
                      initial={false}
                      animate={{ width: i <= revealIndex ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </span>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={revealIndex}
                  initial={{ opacity: 0, x: 60, rotate: 4 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -60, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                >
                  <BeerCard beer={generatedMenu.beers[revealIndex]} size="large" onClick={() => setSelectedBeer(generatedMenu.beers[revealIndex])} />
                </motion.div>
              </AnimatePresence>

              <button type="button" onClick={handleNextReveal} className="btn-primary w-full h-14 text-lg mt-6">
                {revealIndex < generatedMenu.beers.length - 1 ? (
                  <>
                    Volgend glas <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Naar overzicht <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {viewState === 'summary' && generatedMenu && (
            <motion.div key="summary" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              {/* Ticket */}
              <div className="relative surface overflow-hidden">
                <div className="p-6 pb-5 bg-[radial-gradient(circle_at_100%_0%,rgb(var(--gold)/0.18),transparent_55%)]">
                  <p className="eyebrow mb-2 flex items-center gap-2">
                    <selectedMode.icon className="w-3.5 h-3.5 text-gold" aria-hidden />
                    {selectedMode.label}
                  </p>
                  <p className="text-muted">{generatedMenu.description}</p>
                </div>
                <div className="relative border-t border-dashed border-line/20">
                  <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-bg" aria-hidden />
                  <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-bg" aria-hidden />
                </div>
                <ol className="divide-y divide-line/10">
                  {generatedMenu.beers.map((beer, index) => (
                    <motion.li key={beer.beer_url} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBeer(beer)}
                        className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-line/5 transition-colors"
                      >
                        <span className="font-display italic font-extrabold text-2xl w-6 text-gold tabular">{index + 1}</span>
                        {beer.image_url ? (
                          <img src={beer.image_url} alt="" className="w-10 h-10 object-contain" loading="lazy" />
                        ) : (
                          <Beer className="w-8 h-8 text-muted" aria-hidden />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{beer.name}</span>
                          <span className="block text-xs text-muted truncate">{beer.brewery}</span>
                        </span>
                        <span className="text-sm tabular text-ember">{beer.abv != null ? `${beer.abv}%` : '–'}</span>
                      </button>
                    </motion.li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleExport} className="btn-secondary">
                  <Download className="w-4 h-4" /> Opslaan
                </button>
                <button type="button" onClick={handleShare} className="btn-primary">
                  <Share2 className="w-4 h-4" /> Delen
                </button>
              </div>
              {note && (
                <p role="status" className="text-center text-sm text-hop">
                  {note}
                </p>
              )}
              <div className="flex justify-center">
                <button type="button" onClick={handleReset} className="btn-ghost">
                  <RefreshCw className="w-4 h-4" />
                  Nieuw menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageLayout>

      <Suspense fallback={null}>
        {selectedBeer && <BeerModal beer={selectedBeer} onClose={() => setSelectedBeer(null)} />}
      </Suspense>
    </>
  );
}
