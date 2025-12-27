import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Calendar, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Changelog, ChangelogEntry } from '../types/changelog';

export default function TrendsPage() {
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'latest' | 'week' | 'month'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const changelogRes = await fetch('/changelog.json').catch(() => fetch('/api/changelog'));
        const changelogData = await changelogRes.json();

        setChangelog(changelogData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredChanges = (): ChangelogEntry[] => {
    if (!changelog) return [];

    const now = new Date();
    const changes = changelog.changes;

    switch (selectedPeriod) {
      case 'latest':
        return changes.slice(0, 1);
      case 'week':
        return changes.filter(entry => {
          const entryDate = new Date(entry.date);
          const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        });
      case 'month':
        return changes.filter(entry => {
          const entryDate = new Date(entry.date);
          const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        });
      default:
        return changes.slice(0, 1);
    }
  };

  const getBiggestRisers = () => {
    const filteredChanges = getFilteredChanges();
    const risers: Array<{ name: string; beer_url: string; change: number }> = [];

    filteredChanges.forEach(entry => {
      entry.updated.forEach(beer => {
        if (beer.changes.rating) {
          const change = beer.changes.rating.new - beer.changes.rating.old;
          if (change > 0) {
            risers.push({
              name: beer.name,
              beer_url: beer.beer_url,
              change
            });
          }
        }
      });
    });

    return risers.sort((a, b) => b.change - a.change).slice(0, 10);
  };

  const getBiggestFallers = () => {
    const filteredChanges = getFilteredChanges();
    const fallers: Array<{ name: string; beer_url: string; change: number }> = [];

    filteredChanges.forEach(entry => {
      entry.updated.forEach(beer => {
        if (beer.changes.rating) {
          const change = beer.changes.rating.new - beer.changes.rating.old;
          if (change < 0) {
            fallers.push({
              name: beer.name,
              beer_url: beer.beer_url,
              change
            });
          }
        }
      });
    });

    return fallers.sort((a, b) => a.change - b.change).slice(0, 10);
  };

  const getNewAdditions = () => {
    const filteredChanges = getFilteredChanges();
    const newBeers: Array<{ name: string; beer_url: string; brewery?: string; abv?: number; rating?: number }> = [];

    filteredChanges.forEach(entry => {
      newBeers.push(...entry.added);
    });

    return newBeers.slice(0, 20);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Trends laden...</p>
        </div>
      </div>
    );
  }

  const risers = getBiggestRisers();
  const fallers = getBiggestFallers();
  const newBeers = getNewAdditions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4 font-heading">
            📊 Bier Trends
          </h1>
          <p className="text-xl text-gray-600">
            Ontdek de grootste stijgers, dalers en nieuwe toevoegingen
          </p>
        </motion.div>

        {/* Period Selector */}
        <div className="flex justify-center gap-3 mb-8">
          {[
            { id: 'latest' as const, label: 'Laatste Update', icon: Calendar },
            { id: 'week' as const, label: 'Deze Week', icon: Calendar },
            { id: 'month' as const, label: 'Deze Maand', icon: Calendar }
          ].map(period => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedPeriod === period.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <period.icon className="w-5 h-5" />
              {period.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biggest Risers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Stijgers</h2>
                <p className="text-sm text-gray-600">Grootste rating stijgingen</p>
              </div>
            </div>

            {risers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen stijgers gevonden</p>
            ) : (
              <div className="space-y-3">
                {risers.map((beer, index) => (
                  <motion.a
                    key={beer.beer_url}
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate group-hover:text-green-700">
                          {beer.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-bold ml-2">
                        <TrendingUp className="w-4 h-4" />
                        +{beer.change.toFixed(3)}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Biggest Fallers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dalers</h2>
                <p className="text-sm text-gray-600">Grootste rating dalingen</p>
              </div>
            </div>

            {fallers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen dalers gevonden</p>
            ) : (
              <div className="space-y-3">
                {fallers.map((beer, index) => (
                  <motion.a
                    key={beer.beer_url}
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate group-hover:text-red-700">
                          {beer.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-red-600 font-bold ml-2">
                        <TrendingDown className="w-4 h-4" />
                        {beer.change.toFixed(3)}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>

          {/* New Additions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Nieuw</h2>
                <p className="text-sm text-gray-600">Nieuwe toevoegingen</p>
              </div>
            </div>

            {newBeers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen nieuwe bieren</p>
            ) : (
              <div className="space-y-3">
                {newBeers.map((beer, index) => (
                  <motion.a
                    key={beer.beer_url}
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate group-hover:text-blue-700">
                          {beer.name}
                        </p>
                        {beer.brewery && (
                          <p className="text-xs text-gray-600 truncate">{beer.brewery}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {beer.abv && (
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">
                            {beer.abv}%
                          </span>
                        )}
                        {beer.rating && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{beer.rating.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
