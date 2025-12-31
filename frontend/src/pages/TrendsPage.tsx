import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Calendar, Star, Award, BarChart3, Flame, Trophy, ExternalLink, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
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

  // --- Data Preparation for Charts ---

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    beers.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [beers]);

  const abvData = useMemo(() => {
    const ranges = [
      { name: '0-4%', min: 0, max: 4, count: 0 },
      { name: '4-6%', min: 4, max: 6, count: 0 },
      { name: '6-8%', min: 6, max: 8, count: 0 },
      { name: '8-10%', min: 8, max: 10, count: 0 },
      { name: '10%+', min: 10, max: 100, count: 0 },
    ];
    
    beers.forEach(b => {
      const abv = b.abv || 0;
      const range = ranges.find(r => abv >= r.min && abv < r.max);
      if (range) range.count++;
    });
    
    return ranges;
  }, [beers]);

  const breweryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    beers.forEach(b => {
      if (b.brewery) counts[b.brewery] = (counts[b.brewery] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [beers]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl">
          <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-amber-600 dark:text-amber-500 text-sm">
            {payload[0].value} bieren
          </p>
        </div>
      );
    }
    return null;
  };

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
  const stats = getStats();

  return (
    <PageLayout title="Trends & Updates" subtitle="Ontdek de trends, top bieren en interessante statistieken">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white border-none transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalBeers}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Totaal Bieren</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white border-none transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.avgRating}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Gem. Rating</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white border-none transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{newBeers.length}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Nieuw</p>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-blue-500 p-6 text-white border-none transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.uniqueBreweries}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Brouwerijen</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white border-none transform hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.uniqueCategories}</span>
          </div>
          <p className="text-sm font-semibold opacity-90">Categorieën</p>
        </Card>
      </div>

      {/* DASHBOARD CHARTS */}
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center font-heading">📊 Data Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Category Distribution */}
        <Card className="p-6" hoverable={false}>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-amber-500" />
                    Bieren per Categorie
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Verdeling van de populairste stijlen</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{ fontSize: 11, fill: '#6b7280' }} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                            {categoryData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(35, 95%, ${50 + index * 5}%)`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* ABV Distribution */}
        <Card className="p-6" hoverable={false}>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Alcoholpercentage (ABV)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hoe sterk zijn de bieren?</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={abvData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAbv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAbv)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Top Breweries List */}
        <Card className="p-6 md:col-span-2" hoverable={false}>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    Populaire Brouwerijen
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Brouwerijen met de meeste bieren op de kaart</p>
            </div>
            
            <div className="space-y-4">
                {breweryChartData.map((brewery, index) => (
                    <div key={brewery.name} className="relative group">
                        <div className="flex items-center justify-between mb-2 z-10 relative">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 ring-1 ring-yellow-500/50' :
                                    index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-500/50' :
                                    index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400 ring-1 ring-orange-500/50' :
                                    'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-500'
                                }`}>
                                    {index + 1}
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {brewery.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pl-2">
                                <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md text-xs whitespace-nowrap border border-gray-200 dark:border-gray-700">
                                    {brewery.value} bieren
                                </span>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                    index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                    'bg-gradient-to-r from-purple-500 to-indigo-500 opacity-70'
                                }`}
                                style={{ width: `${(brewery.value / breweryChartData[0].value) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {[
          { id: 'latest' as const, label: 'Laatste Update' },
          { id: 'week' as const, label: 'Deze Week' },
          { id: 'month' as const, label: 'Deze Maand' }
        ].map(period => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-xl font-semibold transition-all active:scale-95 ${
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            {period.label}
          </button>
        ))}
      </div>

      {/* Top Rated Beers */}
      <Card className="p-6 mb-8" hoverable={false}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white font-heading">Top Rated Bieren</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">De hoogst gewaardeerde bieren in het assortiment</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topRated.map((beer) => (
            <a
              key={beer.beer_url}
              href={beer.beer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-panel p-4 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
            >
              <div className="flex flex-col items-center text-center h-full">
                {beer.image_url ? (
                  <img src={beer.image_url} alt={beer.name} className="w-20 h-20 object-contain mb-3 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mb-3">
                    <Star className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                <h3 className="font-bold text-sm text-gray-800 dark:text-amber-100 mb-auto line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {beer.name}
                </h3>
                <div className="mt-3 flex flex-col items-center w-full">
                  <div className="flex items-center justify-center gap-1 mb-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm text-gray-800 dark:text-amber-100">{beer.rating?.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{beer.brewery}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center font-heading">📈 Trends & Changelog</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biggest Risers */}
        <Card className="p-6 h-full" hoverable={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Stijgers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grootste rating stijging</p>
            </div>
          </div>

          {risers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Geen stijgers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {risers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all border border-transparent hover:border-green-200 dark:hover:border-green-800 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{beer.name}</h4>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded inline-block mt-1">
                        +{beer.change.toFixed(3)}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 flex-shrink-0 ml-2 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Biggest Fallers */}
        <Card className="p-6 h-full" hoverable={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-lg shadow-red-500/20">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Dalers</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grootste rating daling</p>
            </div>
          </div>

          {fallers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingDown className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Geen dalers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fallers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">{beer.name}</h4>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded inline-block mt-1">
                        {beer.change.toFixed(3)}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600 flex-shrink-0 ml-2 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* New Additions */}
        <Card className="p-6 h-full" hoverable={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Nieuw</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Recent toegevoegd</p>
            </div>
          </div>

          {newBeers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Plus className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Geen nieuwe bieren</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newBeers.map((beer) => (
                <a
                  key={beer.beer_url}
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{beer.name}</h4>
                      {beer.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{beer.rating.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0 ml-2 transition-colors" />
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
