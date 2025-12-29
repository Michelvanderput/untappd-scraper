import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import BeerRandomizer from '../components/BeerRandomizer';
import { beerCache } from '../utils/cache';
import type { BeerData } from '../types/beer';

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-amber-600 dark:text-amber-500 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">Bieren laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-amber-600" />
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white font-heading">
              Sur<span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">prise</span>
            </h1>
            <Sparkles className="w-12 h-12 text-amber-600" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Laat het lot beslissen! 🎲
          </p>
        </motion.div>

        {/* Randomizer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BeerRandomizer beers={beers} />
        </motion.div>
      </div>
    </div>
  );
}
