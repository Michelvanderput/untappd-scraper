import { useState, useEffect, useMemo } from 'react';
import { Plus, Star, Trophy, ExternalLink, Calendar, Beer } from 'lucide-react';
import type { Changelog, ChangelogEntry } from '../types/changelog';
import type { BeerData } from '../types/beer';
import { beerCache } from '../utils/cache';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import SectionHeading from '../components/SectionHeading';

export default function TrendsPage() {
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'latest' | 'week' | 'month'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cached = await beerCache.get<BeerData[]>('beers');
        if (cached) setBeers(cached);

        try {
          const response = await fetch('/api/beers');
          if (response.ok) {
            const data = await response.json();
            const list = data.beers ?? [];
            setBeers(list);
            await beerCache.set('beers', list);
          }
        } catch {
          // use cached
        }

        try {
          const apiRes = await fetch('/api/changelog');
          if (apiRes.ok) {
            const data = await apiRes.json();
            setChangelog(data);
          } else {
            const fallback = await fetch('https://raw.githubusercontent.com/Michelvanderput/untappd-scraper/main/changelog.json');
            setChangelog(await fallback.json());
          }
        } catch {
          setChangelog({ changes: [] });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredChanges = (): ChangelogEntry[] => {
    if (!changelog?.changes?.length) return [];
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;

    switch (selectedPeriod) {
      case 'latest':
        return changelog.changes.slice(0, 1);
      case 'week':
        return changelog.changes.filter(e => (now - new Date(e.date).getTime()) / day <= 7);
      case 'month':
        return changelog.changes.filter(e => (now - new Date(e.date).getTime()) / day <= 30);
      default:
        return changelog.changes.slice(0, 1);
    }
  };

  const newBeers = useMemo(() => {
    const entries = getFilteredChanges();
    const list: Array<BeerData & { addedAt?: string }> = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      for (const item of entry.added || []) {
        if (seen.has(item.beer_url)) continue;
        seen.add(item.beer_url);
        const full = beers.find(b => b.beer_url === item.beer_url);
        if (full) {
          list.push({ ...full, addedAt: entry.date });
        } else {
          list.push({
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
            addedAt: entry.date,
          } as BeerData & { addedAt?: string });
        }
      }
    }

    return list.slice(0, 24);
  }, [changelog, beers, selectedPeriod]);

  const topRated = useMemo(
    () =>
      [...beers]
        .filter(b => b.rating != null)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 12),
    [beers]
  );

  if (loading) {
    return (
      <PageLayout title="Trends" subtitle="Laden...">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" aria-hidden />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Trends"
      subtitle="Ontdek wat nieuw is en wat anderen het lekkerst vinden."
    >
      {/* Period filter – only for "New" */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {[
          { id: 'latest' as const, label: 'Laatste update' },
          { id: 'week' as const, label: 'Deze week' },
          { id: 'month' as const, label: 'Deze maand' },
        ].map((period) => (
          <button
            key={period.id}
            type="button"
            onClick={() => setSelectedPeriod(period.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {period.label}
          </button>
        ))}
      </div>

      {/* Nieuw op de kaart */}
      <SectionHeading
        title="Nieuw op de kaart"
        description="Probeer onze nieuwste bieren"
        icon={Plus}
        className="mb-6"
      />
      {newBeers.length === 0 ? (
        <Card className="p-10 text-center" hoverable={false}>
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
            <Beer className="w-8 h-8" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Geen nieuwe bieren in deze periode. Bekijk hieronder onze best beoordeelde bieren.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-14">
          {newBeers.map((beer) => (
            <a
              key={beer.beer_url}
              href={beer.beer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 p-4 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
            >
              <div className="aspect-square flex items-center justify-center mb-3 bg-amber-50/50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                {beer.image_url ? (
                  <img
                    src={beer.image_url}
                    alt=""
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Beer className="w-12 h-12 text-amber-300 dark:text-amber-600" />
                )}
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {beer.name}
              </h3>
              {beer.brewery && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{beer.brewery}</p>
              )}
              {beer.rating != null && (
                <div className="mt-2 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{beer.rating.toFixed(1)}</span>
                </div>
              )}
              <span className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                Bekijk op Untappd
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Best beoordeeld */}
      <SectionHeading
        title="Best beoordeeld"
        description="Populairste bieren volgens Untappd"
        icon={Trophy}
        className="mb-6"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {topRated.map((beer) => (
          <a
            key={beer.beer_url}
            href={beer.beer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 p-4 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
          >
            <div className="aspect-square flex items-center justify-center mb-3 bg-amber-50/50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {beer.image_url ? (
                <img
                  src={beer.image_url}
                  alt=""
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              ) : (
                <Beer className="w-12 h-12 text-amber-300 dark:text-amber-600" />
              )}
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400">
              {beer.name}
            </h3>
            {beer.brewery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{beer.brewery}</p>
            )}
            <div className="mt-2 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{beer.rating?.toFixed(1)}</span>
            </div>
            <span className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
              Bekijk op Untappd
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>
    </PageLayout>
  );
}
