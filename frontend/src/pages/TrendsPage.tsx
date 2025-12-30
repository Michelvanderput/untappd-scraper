import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Calendar, Star, Award, BarChart3, Flame, Trophy, ExternalLink } from 'lucide-react';
import type { Changelog, ChangelogEntry } from '../types/changelog';
import type { BeerData } from '../types/beer';
import { beerCache } from '../utils/cache';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';

export default function TrendsPage() {
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'latest' | 'week' | 'month'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        let changelogData;
        try {
          const apiRes = await fetch('/api/changelog');
          if (apiRes.ok) {
            changelogData = await apiRes.json();
          } else {
            throw new Error('API not available');
          }
        } catch {
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
            risers.push({ name: beer.name, beer_url: beer.beer_url, change });
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
            fallers.push({ name: beer.name, beer_url: beer.beer_url, change });
          }
        }
      });
    });

    return fallers.sort((a, b) => a.change - b.change).slice(0, 5);
  };

  const getNewAdditions = () => {
    const filteredChanges = getFilteredChanges();
    const newBeers: Array<{ name: string; beer_url: string; rating: number | null; brewery: string | null }> = [];

    filteredChanges.forEach(entry => {
      entry.added.forEach(beer => {
        const beerData = beers.find(b => b.beer_url === beer.beer_url);
        newBeers.push({
          name: beer.name,
          beer_url: beer.beer_url,
          rating: beerData?.rating || null,
          brewery: beerData?.brewery || null
        });
      });
    });

    return newBeers.slice(0, 10);
  };

  const getTopRatedBeers = () => {
    return [...beers]
      .filter(beer => beer.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  };

  const getTopBreweries = () => {
    const breweryMap = new Map<string, { count: number; totalRating: number }>();
    
    beers.forEach(beer => {
      if (beer.brewery) {
        const existing = breweryMap.get(beer.brewery) || { count: 0, totalRating: 0 };
        breweryMap.set(beer.brewery, {
          count: existing.count + 1,
          totalRating: existing.totalRating + (beer.rating || 0)
        });
      }
    });

    return Array.from(breweryMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgRating: data.totalRating / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getStats = () => {
    const uniqueBreweries = new Set(beers.map(b => b.brewery).filter(Boolean)).size;
    const uniqueCategories = new Set(beers.map(b => b.category)).size;
    const avgRating = beers.reduce((sum, b) => sum + (b.rating || 0), 0) / beers.filter(b => b.rating).length;
    const highestRated = beers.filter(b => b.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    return {
      totalBeers: beers.length,
      uniqueBreweries,
      uniqueCategories,
      avgRating: avgRating.toFixed(2),
      highestRated: highestRated?.name || 'N/A'
    };
  };

  if (loading) {
    return (
      <PageLayout title="Trends & Updates" subtitle="Laden...">
        <div className="flex justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageLayout>
    );
  }

  const risers = getBiggestRisers();
  const fallers = getBiggestFallers();
  const newBeers = getNewAdditions();
  const topRated = getTopRatedBeers();
  const topBreweries = getTopBreweries();
  const stats = getStats();

  return (
    <PageLayout title="Trends & Updates" subtitle="Ontdek de trends, top bieren en interessante statistieken">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white border-none">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalBeers}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Totaal Bieren</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white border-none">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.avgRating}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Gem. Rating</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white border-none">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{newBeers.length}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Nieuw</p>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-blue-500 p-6 text-white border-none">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.uniqueBreweries}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Brouwerijen</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white border-none">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.uniqueCategories}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Categorieën</p>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center gap-3 mb-8">
        {[
          { id: 'latest' as const, label: 'Laatste Update' },
          { id: 'week' as const, label: 'Deze Week' },
          { id: 'month' as const, label: 'Deze Maand' }
        ].map(period => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 ${
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {period.label}
          </button>
        ))}
      </div>

      {/* Top Rated Beers */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Top Rated Bieren</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">De hoogst gewaardeerde bieren</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {topRated.map((beer) => (
            <a
              key={beer.beer_url}
              href={beer.beer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 hover:shadow-lg transition-all active:scale-95 border border-amber-200 dark:border-amber-900/30"
            >
              <div className="flex flex-col items-center text-center">
                {beer.image_url ? (
                  <img src={beer.image_url} alt={beer.name} className="w-16 h-16 object-contain mb-3" />
                ) : (
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center mb-3">
                    <Star className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                <h3 className="font-bold text-sm text-gray-800 dark:text-amber-100 mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {beer.name}
                </h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-lg text-gray-800 dark:text-amber-100">{beer.rating?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-amber-200/70 truncate w-full">{beer.brewery}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">📈 Trends & Changelog</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Top Breweries */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Top Brouwerijen</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Meeste bieren</p>
            </div>
          </div>

          <div className="space-y-2">
            {topBreweries.map((brewery) => {
              const maxCount = topBreweries[0]?.count || 1;
              const percentage = (brewery.count / maxCount) * 100;
              
              return (
                <div key={brewery.name} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white truncate flex-1">{brewery.name}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{brewery.count}</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">{brewery.avgRating.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Biggest Risers */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Stijgers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grootste rating stijging</p>
            </div>
          </div>

          {risers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Geen stijgers in deze periode</p>
          ) : (
            <div className="space-y-2">
              {risers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-900/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">{beer.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (+{beer.change.toFixed(3)} sterren)
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Biggest Fallers */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Dalers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grootste rating daling</p>
            </div>
          </div>

          {fallers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Geen dalers in deze periode</p>
          ) : (
            <div className="space-y-2">
              {fallers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-900/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">{beer.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({beer.change.toFixed(3)} sterren)
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-600 flex-shrink-0 ml-2" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* New Additions */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Nieuw Toegevoegd</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Recent toegevoegd</p>
            </div>
          </div>

          {newBeers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Geen nieuwe bieren in deze periode</p>
          ) : (
            <div className="space-y-2">
              {newBeers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-900/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">{beer.name}</h4>
                      {beer.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium">{beer.rating.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
