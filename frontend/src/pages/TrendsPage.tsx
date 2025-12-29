import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Calendar, Star, Award, BarChart3, Flame, Trophy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Changelog, ChangelogEntry } from '../types/changelog';
import type { BeerData } from '../types/beer';
import { beerCache } from '../utils/cache';

export default function TrendsPage() {
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'latest' | 'week' | 'month'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch beers data
        const cached = await beerCache.get<BeerData[]>('beers');
        
        if (cached) {
          setBeers(cached);
        }
        
        try {
          const response = await fetch('/api/beers');
          if (response.ok) {
            const freshData = await response.json();
            if (freshData && freshData.length > 0) {
              setBeers(freshData);
              await beerCache.set('beers', freshData);
            }
          }
        } catch (fetchError) {
          console.warn('API fetch failed, using cached data:', fetchError);
        }

        // Try API endpoint first, then fallback to root changelog.json
        let changelogData;
        try {
          const apiRes = await fetch('/api/changelog');
          if (apiRes.ok) {
            changelogData = await apiRes.json();
          } else {
            throw new Error('API not available');
          }
        } catch {
          // Fallback to fetching from GitHub raw or use mock data
          const rootRes = await fetch('https://raw.githubusercontent.com/Michelvanderput/untappd-scraper/main/changelog.json');
          changelogData = await rootRes.json();
        }

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

    return risers.sort((a, b) => b.change - a.change).slice(0, 5);
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

    return fallers.sort((a, b) => a.change - b.change).slice(0, 5);
  };

  const getNewAdditions = () => {
    const filteredChanges = getFilteredChanges();
    const newBeers: Array<{ name: string; beer_url: string; brewery?: string; abv?: number; rating?: number }> = [];

    filteredChanges.forEach(entry => {
      newBeers.push(...entry.added);
    });

    return newBeers.slice(0, 20);
  };

  const getTopRatedBeers = () => {
    return [...beers]
      .filter(beer => beer.rating && beer.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  };

  const getTopBreweries = () => {
    const breweryCount: Record<string, { count: number; avgRating: number; totalRating: number }> = {};
    
    beers.forEach(beer => {
      if (beer.brewery) {
        if (!breweryCount[beer.brewery]) {
          breweryCount[beer.brewery] = { count: 0, avgRating: 0, totalRating: 0 };
        }
        breweryCount[beer.brewery].count++;
        if (beer.rating) {
          breweryCount[beer.brewery].totalRating += beer.rating;
        }
      }
    });

    // Calculate average ratings
    Object.keys(breweryCount).forEach(brewery => {
      const data = breweryCount[brewery];
      data.avgRating = data.totalRating / data.count;
    });

    return Object.entries(breweryCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const getStats = () => {
    const totalBeers = beers.length;
    const avgRating = beers.reduce((sum, beer) => sum + (beer.rating || 0), 0) / totalBeers;
    const avgABV = beers.reduce((sum, beer) => sum + (beer.abv || 0), 0) / totalBeers;
    const uniqueBreweries = new Set(beers.map(b => b.brewery).filter(Boolean)).size;
    const uniqueCategories = new Set(beers.map(b => b.category).filter(Boolean)).size;
    
    return {
      totalBeers,
      avgRating,
      avgABV,
      uniqueBreweries,
      uniqueCategories
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Trends laden...</p>
        </div>
      </div>
    );
  }

  const risers = getBiggestRisers();
  const fallers = getBiggestFallers();
  const newBeers = getNewAdditions();
  const topRated = getTopRatedBeers();
  const topBreweries = getTopBreweries();
  const stats = getStats();

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-display tracking-tighter text-brand-black dark:text-brand-text-primary mb-4 leading-none">
            TRENDS
          </h1>
          <p className="text-lg text-brand-text-secondary dark:text-brand-text-secondary font-sans tracking-wide uppercase">
            Ontdek de trends, top bieren en interessante statistieken
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalBeers}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Totaal Bieren</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.avgRating.toFixed(2)}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Gem. Rating</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.avgABV.toFixed(1)}%</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Gem. ABV</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.uniqueBreweries}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Brouwerijen</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.uniqueCategories}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Categorieën</p>
          </div>
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
              className={`flex items-center gap-2 px-6 py-3 font-sans font-medium uppercase text-sm tracking-wider transition-all border ${
                selectedPeriod === period.id
                  ? 'bg-brand-accent text-white border-brand-accent'
                  : 'bg-brand-white dark:bg-brand-gray-dark text-brand-text-secondary dark:text-brand-text-secondary border-brand-border dark:border-brand-border hover:border-brand-accent'
              }`}
            >
              <period.icon className="w-5 h-5" />
              {period.label}
            </button>
          ))}
        </div>

        {/* Top Rated Beers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 rounded-2xl shadow-xl p-6 mb-6 dark:border dark:border-amber-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100">Top 10 Hoogst Gewaardeerd</h2>
              <p className="text-sm text-gray-600 dark:text-amber-200/70">De beste bieren op basis van rating</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {topRated.map((beer, index) => (
              <motion.a
                key={beer.beer_url}
                href={beer.beer_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group block"
              >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer">
                  {/* Rank Badge */}
                  <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                    'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Beer Image */}
                  {beer.image_url && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={beer.image_url}
                        alt={beer.name}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Beer Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="font-bold text-sm text-gray-800 dark:text-amber-100 line-clamp-2 min-h-[2.5rem] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {beer.name}
                      </p>
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-amber-500 flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg text-gray-800 dark:text-amber-100">{beer.rating?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-amber-200/70 truncate">{beer.brewery}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">📈 Trends & Changelog</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Top Breweries */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl shadow-lg p-4 dark:border dark:border-amber-900/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-amber-100">Top Brouwerijen</h2>
                <p className="text-xs text-gray-600 dark:text-amber-200/70">Meeste bieren</p>
              </div>
            </div>

            <div className="space-y-2">
              {topBreweries.map((brewery, index) => {
                const maxCount = topBreweries[0]?.count || 1;
                const percentage = (brewery.count / maxCount) * 100;
                
                return (
                  <motion.div
                    key={brewery.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-800 dark:text-amber-100 truncate flex-1">{brewery.name}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-xs text-gray-600 dark:text-amber-200/70">{brewery.count}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium">{brewery.avgRating.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
          {/* Biggest Risers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl shadow-lg p-4 dark:border dark:border-amber-900/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-amber-100">Stijgers</h2>
                <p className="text-xs text-gray-600 dark:text-amber-200/70">Rating stijgingen</p>
              </div>
            </div>

            {risers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Geen stijgers gevonden</p>
            ) : (
              <div className="space-y-2">
                {risers.map((beer, index) => {
                  const maxChange = Math.max(...risers.map(b => b.change));
                  const percentage = (beer.change / maxChange) * 100;
                  const changePercent = ((beer.change / 5) * 100).toFixed(1); // Out of 5 stars
                  
                  return (
                    <motion.a
                      key={beer.beer_url}
                      href={beer.beer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="block p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group relative overflow-hidden"
                    >
                      {/* Background bar */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-green-200/40 to-transparent transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-amber-100 truncate group-hover:text-green-700 dark:group-hover:text-green-400">
                              {beer.name}
                            </p>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-500 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-green-600 font-bold">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-sm">+{changePercent}%</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (+{beer.change.toFixed(3)} sterren)
                          </span>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Biggest Fallers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl shadow-lg p-4 dark:border dark:border-amber-900/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-amber-100">Dalers</h2>
                <p className="text-xs text-gray-600 dark:text-amber-200/70">Rating dalingen</p>
              </div>
            </div>

            {fallers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Geen dalers gevonden</p>
            ) : (
              <div className="space-y-2">
                {fallers.map((beer, index) => {
                  const maxChange = Math.max(...fallers.map(b => Math.abs(b.change)));
                  const percentage = (Math.abs(beer.change) / maxChange) * 100;
                  const changePercent = ((Math.abs(beer.change) / 5) * 100).toFixed(1);
                  
                  return (
                    <motion.a
                      key={beer.beer_url}
                      href={beer.beer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="block p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group relative overflow-hidden"
                    >
                      {/* Background bar */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-red-200/40 to-transparent transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-amber-100 truncate group-hover:text-red-700 dark:group-hover:text-red-400">
                              {beer.name}
                            </p>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-red-500 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-red-600 font-bold">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-sm">-{changePercent}%</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({beer.change.toFixed(3)} sterren)
                          </span>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* New Additions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl shadow-lg p-4 dark:border dark:border-amber-900/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-amber-100">Nieuw</h2>
                <p className="text-xs text-gray-600 dark:text-amber-200/70">Nieuwe toevoegingen</p>
              </div>
            </div>

            {newBeers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Geen nieuwe bieren</p>
            ) : (
              <div className="space-y-2">
                {newBeers.map((beer, index) => (
                  <motion.a
                    key={beer.beer_url}
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="font-semibold text-sm text-gray-800 dark:text-amber-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                            {beer.name}
                          </p>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                        </div>
                        {beer.brewery && (
                          <p className="text-xs text-gray-600 dark:text-amber-200/70 truncate">{beer.brewery}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        {beer.abv && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
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
