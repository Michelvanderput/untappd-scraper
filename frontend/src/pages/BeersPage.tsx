import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Car, Zap, Candy, Flame, RefreshCw, Beer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BeerData } from '../types/beer';
import BeerCard from '../components/BeerCard';
import BottleCap from '../components/BottleCap';
import EmptyState from '../components/EmptyState';
import PageLayout from '../components/PageLayout';
import Sheet from '../components/Sheet';
import SEO from '../components/SEO';
import { useDebounce } from '../hooks/useDebounce';
import { useBeers } from '../hooks/useBeers';
import { haptics } from '../utils/haptic';
import { gsap, Flip, prefersReducedMotion, EASE_OUT_EXPO } from '../lib/gsap';

const HeroCap = lazy(() => import('../components/HeroCap'));

const BeerModal = lazy(() => import('../components/BeerModal'));

type SmartTag = 'debob' | 'hopbom' | 'zoetekauw' | 'zwaar';
type SortKey = 'default' | 'rating' | 'abv-desc' | 'abv-asc' | 'name';

const SMART_TAGS: { id: SmartTag; label: string; icon: LucideIcon }[] = [
  { id: 'debob', label: 'De Bob', icon: Car },
  { id: 'hopbom', label: 'Hopbom', icon: Zap },
  { id: 'zoetekauw', label: 'Zoetekauw', icon: Candy },
  { id: 'zwaar', label: 'Zwaar geschut', icon: Flame },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'default', label: 'Kaartvolgorde' },
  { id: 'rating', label: 'Hoogste rating' },
  { id: 'abv-desc', label: 'Sterkste eerst' },
  { id: 'abv-asc', label: 'Lichtste eerst' },
  { id: 'name', label: 'Naam A–Z' },
];

const ABV_MAX = 15;
const IBU_MAX = 120;
const PAGE = 24;

function deduplicateBeers(beerList: BeerData[]) {
  const seen = new Map<string, BeerData>();
  const score = (b: BeerData) => (b.rating ? 1 : 0) + (b.image_url ? 1 : 0) + (b.ibu ? 1 : 0);
  for (const beer of beerList) {
    const key = `${beer.name.toLowerCase().trim()}-${(beer.brewery || '').toLowerCase().trim()}`;
    const existing = seen.get(key);
    if (!existing || score(beer) > score(existing)) seen.set(key, beer);
  }
  return Array.from(seen.values());
}

function searchBeers(beerList: BeerData[], term: string) {
  const terms = term.toLowerCase().trim().split(/\s+/);
  return beerList.filter((beer) => {
    const text = [beer.name, beer.brewery, beer.style, beer.category, beer.subcategory].filter(Boolean).join(' ').toLowerCase();
    return terms.every((t) => text.includes(t));
  });
}

function matchesSmartTag(b: BeerData, tag: SmartTag) {
  const style = b.style?.toLowerCase() || '';
  switch (tag) {
    case 'debob':
      return (b.abv || 0) <= 0.5;
    case 'hopbom':
      return (style.includes('ipa') || style.includes('pale ale')) && (b.ibu || 0) > 40;
    case 'zoetekauw':
      return ['stout', 'porter', 'sour', 'fruit', 'pastry'].some((s) => style.includes(s));
    case 'zwaar':
      return (b.abv || 0) >= 10;
  }
}

function RangeField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: [number, number];
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: [number, number]) => void;
}) {
  return (
    <fieldset>
      <legend className="flex w-full items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        <span className="text-sm tabular">{display}</span>
      </legend>
      <div className="space-y-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          aria-label={`${label} minimum`}
          onChange={(e) => onChange([Math.min(parseFloat(e.target.value), value[1]), value[1]])}
          className="w-full accent-gold h-8"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          aria-label={`${label} maximum`}
          onChange={(e) => onChange([value[0], Math.max(parseFloat(e.target.value), value[0])])}
          className="w-full accent-gold h-8"
        />
      </div>
    </fieldset>
  );
}

export default function BeersPage() {
  const { beers, loading, error, reload } = useBeers();
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [activeSmartTag, setActiveSmartTag] = useState<SmartTag | null>(null);
  const [abvRange, setAbvRange] = useState<[number, number]>([0, ABV_MAX]);
  const [ibuRange, setIbuRange] = useState<[number, number]>([0, IBU_MAX]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const unique = useMemo(() => deduplicateBeers(beers), [beers]);

  // Deep link from the ⌘K menu: /?beer=<beer_url> opens that beer's sheet
  const beerParam = searchParams.get('beer');
  const deepLinkedBeer = useMemo(
    () => (beerParam ? beers.find((b) => b.beer_url === beerParam) ?? null : null),
    [beerParam, beers]
  );

  /** Remember where every card is right now, so Flip can glide them to their new spot */
  const captureLayout = useCallback(() => {
    const cards = gridRef.current?.querySelectorAll('[data-flip-id]');
    if (cards?.length && !prefersReducedMotion()) flipState.current = Flip.getState(cards);
  }, []);

  const filteredBeers = useMemo(() => {
    let list = unique;
    if (activeSmartTag) list = list.filter((b) => matchesSmartTag(b, activeSmartTag));
    if (selectedCategory) list = list.filter((b) => b.category === selectedCategory);
    if (selectedSubcategory) list = list.filter((b) => b.subcategory === selectedSubcategory);
    if (debouncedSearchTerm) list = searchBeers(list, debouncedSearchTerm);
    if (abvRange[0] > 0 || abvRange[1] < ABV_MAX) {
      list = list.filter((b) => (b.abv || 0) >= abvRange[0] && (b.abv || 0) <= abvRange[1]);
    }
    if (ibuRange[0] > 0 || ibuRange[1] < IBU_MAX) {
      list = list.filter((b) => (b.ibu || 0) >= ibuRange[0] && (b.ibu || 0) <= ibuRange[1]);
    }
    if (minRating > 0) list = list.filter((b) => (b.rating || 0) >= minRating);

    switch (sort) {
      case 'rating':
        return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'abv-desc':
        return [...list].sort((a, b) => (b.abv ?? 0) - (a.abv ?? 0));
      case 'abv-asc':
        return [...list].sort((a, b) => (a.abv ?? 99) - (b.abv ?? 99));
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
      default:
        return list;
    }
  }, [unique, debouncedSearchTerm, selectedCategory, selectedSubcategory, activeSmartTag, abvRange, ibuRange, minRating, sort]);

  // New result set → start paging from the top again
  const [pagedList, setPagedList] = useState(filteredBeers);
  if (pagedList !== filteredBeers) {
    setPagedList(filteredBeers);
    setDisplayCount(PAGE);
  }

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setDisplayCount((n) => Math.min(n + PAGE, filteredBeers.length));
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredBeers.length, displayCount]);

  const categories = useMemo(() => Array.from(new Set(beers.map((b) => b.category))).filter(Boolean), [beers]);
  const subcategories = useMemo(
    () =>
      Array.from(
        new Set(beers.filter((b) => !selectedCategory || b.category === selectedCategory).map((b) => b.subcategory))
      ).filter(Boolean) as string[],
    [beers, selectedCategory]
  );

  const sheetFilterCount =
    (selectedSubcategory ? 1 : 0) +
    (abvRange[0] > 0 || abvRange[1] < ABV_MAX ? 1 : 0) +
    (ibuRange[0] > 0 || ibuRange[1] < IBU_MAX ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sort !== 'default' ? 1 : 0);
  const anyFilter = !!(searchTerm || selectedCategory || activeSmartTag || sheetFilterCount);

  const clearFilters = () => {
    captureLayout();
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setActiveSmartTag(null);
    setAbvRange([0, ABV_MAX]);
    setIbuRange([0, IBU_MAX]);
    setMinRating(0);
    setSort('default');
  };

  const handleBeerClick = useCallback((beer: BeerData) => setSelectedBeer(beer), []);
  const handleModalClose = useCallback(() => {
    setSelectedBeer(null);
    if (beerParam) {
      setSearchParams(
        (prev) => {
          prev.delete('beer');
          return prev;
        },
        { replace: true }
      );
    }
  }, [beerParam, setSearchParams]);

  // Cards glide to their new place when filters change (Flip) and rise in when they first appear
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const reduce = prefersReducedMotion();
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-flip-id]'));

    if (flipState.current && !reduce) {
      Flip.from(flipState.current, { duration: 0.7, ease: EASE_OUT_EXPO, stagger: 0.01, overwrite: true });
    }
    flipState.current = null;

    const fresh = cards.filter((c) => !c.dataset.revealed);
    fresh.forEach((c) => {
      c.dataset.revealed = '1';
    });
    if (!reduce && fresh.length) {
      gsap.fromTo(
        fresh,
        { autoAlpha: 0, y: 28, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.75, ease: EASE_OUT_EXPO, stagger: 0.035, clearProps: 'opacity,visibility,transform' }
      );
    }
  }, [filteredBeers, displayCount]);

  if (loading && beers.length === 0) {
    return (
      <div className="grid place-items-center min-h-[70vh]" role="status" aria-label="Bieren laden">
        <BottleCap className="w-14 h-14" spinning />
      </div>
    );
  }

  if (error && beers.length === 0) {
    return (
      <EmptyState
        icon={Beer}
        title="Tap staat droog"
        description={error}
        className="min-h-[70vh]"
        action={
          <button type="button" onClick={reload} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Opnieuw proberen
          </button>
        }
      />
    );
  }

  const displayedBeers = filteredBeers.slice(0, displayCount);
  const hasMore = displayCount < filteredBeers.length;

  return (
    <>
      <SEO
        title="BeerMenu – Biertaverne De Gouverneur"
        description={`Ontdek ${unique.length} unieke bieren. Zoek, filter en vind je favoriete bier.`}
      />
      <PageLayout
        eyebrow="Biertaverne De Gouverneur"
        title="Wat drink je vanavond?"
        subtitle={`${unique.length} bieren op de kaart — van de tap, uit de bierbijbel en op=op.`}
        floatAside
        aside={
          <Suspense fallback={<div className="w-28 h-28 sm:w-40 sm:h-40 md:w-60 md:h-60" aria-hidden />}>
            <HeroCap />
          </Suspense>
        }
      >
        {/* Sticky search */}
        <div className="sticky z-30 top-[calc(3.5rem+env(safe-area-inset-top))] md:top-16 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-bg/85 backdrop-blur-xl">
          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Zoek bieren</span>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" aria-hidden />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Naam, brouwerij of stijl"
                value={searchTerm}
                onChange={(e) => {
                  captureLayout();
                  setSearchTerm(e.target.value);
                }}
                className="field pl-12 pr-11 rounded-full"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    captureLayout();
                    setSearchTerm('');
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 icon-btn w-10 h-10 text-muted"
                  aria-label="Zoekopdracht wissen"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="relative icon-btn w-12 h-12 bg-surface-2 border border-line/10"
              aria-label={`Filters${sheetFilterCount ? ` (${sheetFilterCount} actief)` : ''}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {sheetFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center w-5 h-5 rounded-full bg-gold text-on-gold text-[11px] font-medium tabular">
                  {sheetFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Categories */}
          <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="Categorie">
            {['', ...categories].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat || 'all'}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    haptics.tap();
                    captureLayout();
                    setSelectedCategory(cat);
                    setSelectedSubcategory('');
                  }}
                  className={`chip ${active ? 'chip-active' : ''}`}
                >
                  {cat || 'Alles'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart tags */}
        <div className="mt-1 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Snelle selecties">
          {SMART_TAGS.map(({ id, label, icon: Icon }) => {
            const active = activeSmartTag === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  haptics.tap();
                  captureLayout();
                  setActiveSmartTag(active ? null : id);
                }}
                className={`chip border-dashed ${active ? 'bg-gold/15 border-gold/60 border-solid text-gold hover:text-gold' : ''}`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-4 min-h-[40px]">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="text-fg tabular font-medium">{filteredBeers.length}</span>{' '}
            {filteredBeers.length === 1 ? 'bier' : 'bieren'}
            {debouncedSearchTerm && <> voor “{debouncedSearchTerm}”</>}
          </p>
          {anyFilter && (
            <button type="button" onClick={clearFilters} className="btn-ghost min-h-[40px] px-3 text-sm">
              <X className="w-4 h-4" />
              Wis filters
            </button>
          )}
        </div>

        {filteredBeers.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Niks gevonden"
            description="Geen bier dat aan al je wensen voldoet. Probeer een andere zoekterm of minder filters."
            action={
              <button type="button" onClick={clearFilters} className="btn-primary">
                Filters wissen
              </button>
            }
          />
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayedBeers.map((beer) => (
              <div key={beer.beer_url} data-flip-id={beer.beer_url} className="[perspective:900px]">
                <BeerCard beer={beer} onClick={() => handleBeerClick(beer)} />
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={loadMoreRef} className="grid place-items-center py-10" role="status" aria-label="Meer bieren laden">
            <BottleCap className="w-8 h-8" spinning />
          </div>
        )}
        {!hasMore && filteredBeers.length > PAGE && (
          <p className="text-center text-sm text-muted py-10 font-display italic">Dat was de hele kaart. Proost.</p>
        )}
      </PageLayout>

      <Sheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSelectedSubcategory('');
                setAbvRange([0, ABV_MAX]);
                setIbuRange([0, IBU_MAX]);
                setMinRating(0);
                setSort('default');
              }}
              disabled={sheetFilterCount === 0}
            >
              Reset
            </button>
            <button type="button" className="btn-primary flex-1" onClick={() => setShowFilters(false)}>
              Toon {filteredBeers.length} bieren
            </button>
          </div>
        }
      >
        <div className="space-y-7">
          <fieldset>
            <legend className="stat-label mb-3">Sorteren</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sort === s.id}
                  onClick={() => {
                    captureLayout();
                    setSort(s.id);
                  }}
                  className={`chip ${sort === s.id ? 'chip-active' : ''}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          {subcategories.length > 0 && (
            <div>
              <label htmlFor="subcat" className="stat-label block mb-2">
                Subcategorie
              </label>
              <select
                id="subcat"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="field appearance-none"
              >
                <option value="">Alle subcategorieën</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <RangeField
            label="Alcohol (ABV)"
            value={abvRange}
            display={`${abvRange[0]}% – ${abvRange[1]}${abvRange[1] === ABV_MAX ? '+' : ''}%`}
            min={0}
            max={ABV_MAX}
            step={0.5}
            onChange={setAbvRange}
          />
          <RangeField
            label="Bitterheid (IBU)"
            value={ibuRange}
            display={`${ibuRange[0]} – ${ibuRange[1]}${ibuRange[1] === IBU_MAX ? '+' : ''}`}
            min={0}
            max={IBU_MAX}
            step={5}
            onChange={setIbuRange}
          />

          <fieldset>
            <legend className="flex w-full items-center justify-between mb-2">
              <span className="stat-label">Minimale rating</span>
              <span className="text-sm tabular">{minRating > 0 ? `${minRating.toFixed(1)}+` : 'Alle'}</span>
            </legend>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              aria-label="Minimale rating"
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full accent-gold h-8"
            />
          </fieldset>
        </div>
      </Sheet>

      <Suspense fallback={null}>
        {(selectedBeer ?? deepLinkedBeer) && (
          <BeerModal beer={(selectedBeer ?? deepLinkedBeer)!} onClose={handleModalClose} />
        )}
      </Suspense>
    </>
  );
}
