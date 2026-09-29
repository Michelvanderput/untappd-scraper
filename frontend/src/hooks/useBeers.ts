import { useCallback, useEffect, useState } from 'react';
import type { BeerData } from '../types/beer';
import { beerCache } from '../utils/cache';

// Shared across pages for the lifetime of the tab, so switching tabs doesn't refetch.
let memory: BeerData[] | null = null;
let inflight: Promise<BeerData[]> | null = null;

async function fetchJson(url: string): Promise<{ beers?: BeerData[] } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  // In local dev the SPA fallback answers /api/* with index.html
  if (!res.headers.get('content-type')?.includes('json')) return null;
  return res.json();
}

async function fetchBeers(): Promise<BeerData[]> {
  let data = await fetchJson('/api/beers?limit=5000').catch(() => null);
  if (!data) data = await fetchJson('/beers.json');
  if (!data) throw new Error('Geen bierdata beschikbaar');
  const list = data.beers ?? [];
  memory = list;
  beerCache.set('beers', list).catch(() => {});
  return list;
}

function loadFresh(): Promise<BeerData[]> {
  if (!inflight) {
    inflight = fetchBeers().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/**
 * Beer list with stale-while-revalidate: memory → IndexedDB → network.
 */
export function useBeers() {
  const [beers, setBeers] = useState<BeerData[]>(memory ?? []);
  const [loading, setLoading] = useState(!memory);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const fresh = await loadFresh();
      setBeers(fresh);
    } catch {
      setError('De bieren konden niet worden geladen. Controleer je internetverbinding.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!memory) {
        const cached = await beerCache.get<BeerData[]>('beers').catch(() => null);
        if (!cancelled && cached?.length) {
          memory = cached;
          setBeers(cached);
          setLoading(false);
        }
      }
      if (!cancelled) reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return { beers, loading, error, reload };
}
