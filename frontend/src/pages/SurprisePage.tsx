import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import BeerRandomizer from '../components/BeerRandomizer';
import { beerCache } from '../utils/cache';
import type { BeerData } from '../types/beer';
import PageLayout from '../components/PageLayout';

export default function SurprisePage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const cached = await beerCache.get<BeerData[]>('beers');
        if (cached && cached.length > 0) {
          setBeers(cached);
          setLoading(false);
          // Fetch fresh data in background
          fetchAndCache();
          return;
        }

        await fetchAndCache();
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
      }
    };

    const fetchAndCache = async () => {
      try {
        let response;
        try {
          response = await fetch('/api/beers');
        } catch {
          response = await fetch('/beers.json');
        }
        
        const data = await response.json();
        const beersList = data.beers || [];
        
        setBeers(beersList);
        setLoading(false);
        
        await beerCache.set('beers', beersList);
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
      }
    };

    fetchBeers();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Surprise" subtitle="Laden...">
        <div className="flex justify-center items-center py-20">
          <Sparkles className="w-16 h-16 text-amber-600 dark:text-amber-500 animate-bounce" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Surprise" subtitle="Laat het lot beslissen! 🎲">
      <BeerRandomizer beers={beers} />
    </PageLayout>
  );
}
