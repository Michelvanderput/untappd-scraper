import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Plus, Trophy, Beer, Star } from 'lucide-react';
import type { Changelog, ChangelogEntry } from '../types/changelog';
import type { BeerData } from '../types/beer';
import PageLayout from '../components/PageLayout';
import SectionHeading from '../components/SectionHeading';
import BottleCap from '../components/BottleCap';
import SEO from '../components/SEO';
import { useBeers } from '../hooks/useBeers';
import { stagger } from '../lib/stagger';
import { useSlidingPill } from '../lib/useSlidingPill';

const BeerModal = lazy(() => import('../components/BeerModal'));

type Period = 'latest' | 'week' | 'month';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'latest', label: 'Laatste update' },
  { id: 'week', label: 'Deze week' },
  { id: 'month', label: 'Deze maand' },
];

const DAY = 1000 * 60 * 60 * 24;

async function fetchChangelog(): Promise<Changelog> {
  try {
    const res = await fetch('/api/changelog');
    if (res.ok && res.headers.get('content-type')?.includes('json')) return res.json();
  } catch {
    // fall through to GitHub copy
  }
  try {
    const res = await fetch('https://raw.githubusercontent.com/Michelvanderput/untappd-scraper/main/changelog.json');
    if (res.ok) return res.json();
  } catch {
    // offline
  }
  return { changes: [] };
}

function Thumb({ beer, className }: { beer: BeerData; className: string }) {
  const [broken, setBroken] = useState(false);
  return beer.image_url && !broken ? (
    <img src={beer.image_url} alt="" loading="lazy" onError={() => setBroken(true)} className={`object-contain ${className}`} />
  ) : (
    <span className={`grid place-items-center ${className}`}>
      <Beer className="w-1/2 h-1/2 text-muted/60" aria-hidden />
    </span>
  );
}

export default function TrendsPage() {
  const { beers, loading: beersLoading } = useBeers();
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [period, setPeriod] = useState<Period>('latest');
  const periods = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetchChangelog().then(setChangelog);
  }, []);

  const newBeers = useMemo(() => {
    const changes = changelog?.changes ?? [];
    const entries: ChangelogEntry[] =
      period === 'latest'
        ? changes.slice(0, 1)
        : changes.filter((e) => (now - new Date(e.date).getTime()) / DAY <= (period === 'week' ? 7 : 30));

    const byUrl = new Map(beers.map((b) => [b.beer_url, b]));
    const seen = new Set<string>();
    const list: BeerData[] = [];
    for (const entry of entries) {
      for (const item of entry.added || []) {
        if (seen.has(item.beer_url)) continue;
        seen.add(item.beer_url);
        list.push(
          byUrl.get(item.beer_url) ?? {
            name: item.name,
            beer_url: item.beer_url,
            brewery: item.brewery ?? null,
            brewery_url: null,
            style: null,
            category: 'Overig',
            subcategory: null,
            abv: item.abv ?? null,
            ibu: null,
            rating: item.rating ?? null,
            image_url: null,
            container: null,
          }
        );
      }
    }
    return list.slice(0, 24);
  }, [changelog, beers, period, now]);

  const topRated = useMemo(
    () =>
      [...beers]
        .filter((b) => b.rating != null)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 12),
    [beers]
  );

  const loading = (beersLoading && beers.length === 0) || changelog === null;
  // The pill lives inside the loaded state, so re-place it when loading ends
  useSlidingPill(periods, pill, '[aria-checked="true"]', `${period}:${loading}`);

  return (
    <>
      <SEO title="Trends – BeerMenu" description="Nieuw op de kaart en de best beoordeelde bieren." />
      <PageLayout eyebrow="Trends" title="Wat is er nieuw?" subtitle="Vers op de kaart en de bieren die het hoogst scoren op Untappd.">
        {loading ? (
          <div className="grid place-items-center py-24" role="status" aria-label="Laden">
            <BottleCap className="w-12 h-12" spinning />
          </div>
        ) : (
          <div className="space-y-14">
            <section>
              <SectionHeading title="Nieuw op de kaart" icon={Plus} />
              <div ref={periods} className="relative inline-flex p-1 mb-6 rounded-full bg-surface border border-line/10" role="radiogroup" aria-label="Periode">
                <span ref={pill} className="absolute left-0 top-0 rounded-full bg-fg opacity-0 invisible pointer-events-none" aria-hidden />
                {PERIODS.map((p) => {
                  const active = period === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPeriod(p.id)}
                      className={`relative z-10 px-4 min-h-[40px] rounded-full text-sm font-medium transition-colors ${active ? 'text-bg' : 'text-muted hover:text-fg'}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {newBeers.length === 0 ? (
                <p className="surface p-8 text-center text-muted">Geen nieuwe bieren in deze periode.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {newBeers.map((beer, i) => (
                    <button
                      key={beer.beer_url}
                      type="button"
                      onClick={() => setSelectedBeer(beer)}
                      style={stagger(Math.min(i, 12) * 0.7)}
                      className="enter-up group text-left surface p-3 hover:border-gold/30 transition-colors"
                    >
                      <span className="relative block aspect-square rounded-2xl bg-surface-2/60 mb-3 overflow-hidden p-4">
                        <Thumb beer={beer} className="w-full h-full transition-transform duration-500 group-hover:scale-110" />
                        <span className="absolute top-2 left-2 px-2 h-5 inline-flex items-center rounded-full bg-hop text-stout text-[10px] font-medium uppercase tracking-wider">
                          Nieuw
                        </span>
                      </span>
                      <span className="block text-sm font-medium leading-tight line-clamp-2">{beer.name}</span>
                      {beer.brewery && <span className="block text-xs text-muted truncate mt-0.5">{beer.brewery}</span>}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeading title="Best beoordeeld" description="Top 12 volgens Untappd" icon={Trophy} />
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {topRated.map((beer, i) => (
                  <li key={beer.beer_url} className="reveal-view min-w-0 border-b border-line/10">
                    <button
                      type="button"
                      onClick={() => setSelectedBeer(beer)}
                      className="w-full flex items-center gap-4 py-3 text-left group"
                    >
                      <span
                        className={`font-display italic font-extrabold text-4xl w-12 tabular leading-none ${i < 3 ? 'text-gold' : 'text-muted/50'}`}
                      >
                        {i + 1}
                      </span>
                      <Thumb beer={beer} className="w-12 h-12 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate group-hover:text-gold transition-colors">{beer.name}</span>
                        <span className="block text-xs text-muted truncate">{beer.brewery}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm tabular">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" aria-hidden />
                        {beer.rating?.toFixed(2)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </PageLayout>

      <Suspense fallback={null}>
        {selectedBeer && <BeerModal beer={selectedBeer} onClose={() => setSelectedBeer(null)} />}
      </Suspense>
    </>
  );
}
