import { useState, useEffect, useMemo, useRef } from 'react';
import { User, Link2, Unlink, RefreshCw, CheckCircle2, XCircle, Star, Beer, Loader2, Lightbulb, Filter, ChevronDown, ExternalLink, Trophy, Target, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import PageLayout from '../components/PageLayout';
import BeerCard from '../components/BeerCard';
import BeerModal from '../components/BeerModal';
import { useUntappdProfileContext } from '../contexts/UntappdProfileContext';
import { useFavorites } from '../hooks/useFavorites';
import type { BeerData } from '../types/beer';
import { ANIMATION_CONFIG } from '../utils/animations';

type ViewMode = 'not-tried' | 'tried' | 'suggestions';
type SuggestionMode = 'top-rated' | 'style-match' | 'brewery-explore' | 'hidden-gems';

export default function ProfilePage() {
  const {
    profile,
    isLoading,
    error,
    connectProfile,
    disconnectProfile,
    refreshProfile,
    hasDrunk,
  } = useUntappdProfileContext();

  const { isFavorite, toggleFavorite } = useFavorites();

  const [username, setUsername] = useState('');
  const [allBeers, setAllBeers] = useState<BeerData[]>([]);
  const [beersLoading, setBeersLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('not-tried');
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>('top-rated');
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);

  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Fetch all beers from the menu
  useEffect(() => {
    const fetchBeers = async () => {
      try {
        let response;
        try {
          response = await fetch('/api/beers?limit=1000');
        } catch {
          response = await fetch('/beers.json');
        }

        if (!response.ok) throw new Error('Failed to fetch beers');

        const data = await response.json();
        setAllBeers(data.beers || []);
      } catch (err) {
        console.error('Error fetching beers:', err);
      } finally {
        setBeersLoading(false);
      }
    };

    fetchBeers();
  }, []);

  // Animate stats on profile load
  useEffect(() => {
    if (profile && statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll('.stat-card'),
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: ANIMATION_CONFIG.ease.bounce,
        }
      );
    }
  }, [profile]);

  // Animate cards when they change
  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.querySelectorAll('.beer-card-wrapper'),
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: ANIMATION_CONFIG.ease.smooth,
        }
      );
    }
  }, [viewMode, suggestionMode, categoryFilter, searchQuery]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setConnectError(null);
    try {
      await connectProfile(username.trim());
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    }
  };

  // Split beers into tried/not tried
  const { triedBeers, notTriedBeers } = useMemo(() => {
    if (!profile || allBeers.length === 0) {
      return { triedBeers: [] as BeerData[], notTriedBeers: allBeers };
    }

    const tried: BeerData[] = [];
    const notTried: BeerData[] = [];

    for (const beer of allBeers) {
      if (hasDrunk(beer.beer_url)) {
        tried.push(beer);
      } else {
        notTried.push(beer);
      }
    }

    return { triedBeers: tried, notTriedBeers: notTried };
  }, [allBeers, profile, hasDrunk]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allBeers.map(b => b.category));
    return ['all', ...Array.from(cats).sort()];
  }, [allBeers]);

  // Generate suggestions based on user's drinking history
  const suggestions = useMemo(() => {
    if (!profile || notTriedBeers.length === 0) return [];

    // Get the styles and breweries the user has tried from the menu
    const triedStyles = new Set(triedBeers.map(b => b.style).filter(Boolean));
    const triedBreweries = new Set(triedBeers.map(b => b.brewery).filter(Boolean));

    switch (suggestionMode) {
      case 'top-rated':
        // Highest rated beers they haven't tried
        return [...notTriedBeers]
          .filter(b => b.rating !== null)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 20);

      case 'style-match':
        // Beers in styles they already like
        if (triedStyles.size === 0) return notTriedBeers.slice(0, 20);
        return notTriedBeers
          .filter(b => b.style && triedStyles.has(b.style))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 20);

      case 'brewery-explore':
        // Beers from breweries they haven't tried yet
        return notTriedBeers
          .filter(b => b.brewery && !triedBreweries.has(b.brewery))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 20);

      case 'hidden-gems':
        // Good beers with fewer mentions (lower on the list, higher rating)
        return [...notTriedBeers]
          .filter(b => b.rating !== null && b.rating >= 3.75)
          .sort((a, b) => {
            // Prefer beers from less common styles
            const aStyleCount = allBeers.filter(x => x.style === a.style).length;
            const bStyleCount = allBeers.filter(x => x.style === b.style).length;
            if (aStyleCount !== bStyleCount) return aStyleCount - bStyleCount;
            return (b.rating || 0) - (a.rating || 0);
          })
          .slice(0, 20);

      default:
        return notTriedBeers.slice(0, 20);
    }
  }, [profile, notTriedBeers, triedBeers, suggestionMode, allBeers]);

  // Filter beers based on current view
  const displayBeers = useMemo(() => {
    let beers: BeerData[];

    switch (viewMode) {
      case 'tried':
        beers = triedBeers;
        break;
      case 'suggestions':
        beers = suggestions;
        break;
      case 'not-tried':
      default:
        beers = notTriedBeers;
        break;
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      beers = beers.filter(b => b.category === categoryFilter);
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      beers = beers.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.brewery && b.brewery.toLowerCase().includes(q)) ||
        (b.style && b.style.toLowerCase().includes(q))
      );
    }

    return beers;
  }, [viewMode, triedBeers, notTriedBeers, suggestions, categoryFilter, searchQuery]);

  // Stats
  const triedPercentage = allBeers.length > 0
    ? Math.round((triedBeers.length / allBeers.length) * 100)
    : 0;

  if (beersLoading) {
    return (
      <PageLayout title="Mijn Profiel" subtitle="Koppel je Untappd account">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Mijn Profiel" subtitle="Koppel je Untappd account en ontdek wat je nog niet hebt geproefd">
      {/* Connect Section */}
      {!profile ? (
        <div className="max-w-lg mx-auto mb-12">
          <div className="glass-panel rounded-3xl p-8 border border-amber-100/50 dark:border-amber-800/30">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                Koppel je Untappd
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Voer je Untappd gebruikersnaam in om te zien welke bieren op de kaart je al hebt geproefd.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Je profiel moet op publiek staan.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">untappd.com/user/</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jouw-username"
                  className="w-full pl-[155px] pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              {(connectError || error) && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{connectError || error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Profiel ophalen...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Account koppelen
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="glass-panel rounded-3xl p-6 border border-amber-100/50 dark:border-amber-800/30">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">
                    {profile.displayName}
                  </h2>
                  <a
                    href={`https://untappd.com/user/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 justify-center sm:justify-start"
                  >
                    @{profile.username}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {profile.totalUnique && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile.totalUnique.toLocaleString()} unieke bieren op Untappd
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={refreshProfile}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    title="Profiel vernieuwen"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={disconnectProfile}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:scale-105 active:scale-95"
                    title="Account ontkoppelen"
                  >
                    <Unlink className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Last updated */}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center sm:text-right mt-3">
                Laatst bijgewerkt: {new Date(profile.fetchedAt).toLocaleString('nl-NL')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="max-w-4xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card glass-panel rounded-2xl p-4 border border-amber-100/50 dark:border-amber-800/30 text-center" style={{ opacity: 0 }}>
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{triedBeers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Geproefd</p>
            </div>
            <div className="stat-card glass-panel rounded-2xl p-4 border border-amber-100/50 dark:border-amber-800/30 text-center" style={{ opacity: 0 }}>
              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{notTriedBeers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nog niet gehad</p>
            </div>
            <div className="stat-card glass-panel rounded-2xl p-4 border border-amber-100/50 dark:border-amber-800/30 text-center" style={{ opacity: 0 }}>
              <Beer className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{allBeers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Op de kaart</p>
            </div>
            <div className="stat-card glass-panel rounded-2xl p-4 border border-amber-100/50 dark:border-amber-800/30 text-center" style={{ opacity: 0 }}>
              <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{triedPercentage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compleet</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="glass-panel rounded-2xl p-4 border border-amber-100/50 dark:border-amber-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voortgang op de kaart</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{triedBeers.length}/{allBeers.length}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${triedPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode('not-tried')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'not-tried'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Target className="w-4 h-4" />
                Nog niet gehad ({notTriedBeers.length})
              </button>
              <button
                onClick={() => setViewMode('tried')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'tried'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Al geproefd ({triedBeers.length})
              </button>
              <button
                onClick={() => setViewMode('suggestions')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'suggestions'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Suggesties
              </button>
            </div>
          </div>

          {/* Suggestion Modes (only when suggestions tab active) */}
          {viewMode === 'suggestions' && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="glass-panel rounded-2xl p-4 border border-purple-100/50 dark:border-purple-800/30">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Suggestie type:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'top-rated' as SuggestionMode, label: 'Hoogst beoordeeld', icon: Star },
                    { key: 'style-match' as SuggestionMode, label: 'Past bij jouw smaak', icon: Target },
                    { key: 'brewery-explore' as SuggestionMode, label: 'Nieuwe brouwerijen', icon: Beer },
                    { key: 'hidden-gems' as SuggestionMode, label: 'Verborgen parels', icon: Sparkles },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setSuggestionMode(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        suggestionMode === key
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {suggestionMode === 'top-rated' && 'De best beoordeelde bieren die je nog niet hebt geproefd.'}
                  {suggestionMode === 'style-match' && 'Bieren in stijlen die je al lekker vindt, maar nog niet hebt geprobeerd.'}
                  {suggestionMode === 'brewery-explore' && 'Bieren van brouwerijen waar je nog niks van hebt gedronken.'}
                  {suggestionMode === 'hidden-gems' && 'Minder bekende stijlen met hoge beoordelingen.'}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="max-w-4xl mx-auto mb-6 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek op naam, brouwerij of stijl..."
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Alle categorieën' : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <div className="max-w-4xl mx-auto mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {displayBeers.length} {displayBeers.length === 1 ? 'bier' : 'bieren'} gevonden
            </p>
          </div>

          {/* Beer Grid */}
          <div ref={cardsRef} className="max-w-7xl mx-auto">
            {displayBeers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Beer className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {viewMode === 'tried' ? 'Je hebt nog geen bieren van de kaart geproefd!' : 'Geen bieren gevonden'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {viewMode === 'tried'
                    ? 'Tijd om er eentje te bestellen!'
                    : 'Probeer een andere zoekopdracht of filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayBeers.map((beer) => (
                  <div key={`${beer.beer_url}-${beer.category}`} className="beer-card-wrapper relative">
                    {/* Tried indicator badge */}
                    {viewMode !== 'tried' && hasDrunk(beer.beer_url) && (
                      <div className="absolute top-2 left-2 z-20 bg-green-500 text-white rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <BeerCard
                      beer={beer}
                      onClick={() => setSelectedBeer(beer)}
                      isFavorite={isFavorite(beer.beer_url)}
                      onToggleFavorite={() => toggleFavorite(beer.beer_url)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Beer Modal */}
      {selectedBeer && (
        <BeerModal
          beer={selectedBeer}
          onClose={() => setSelectedBeer(null)}
        />
      )}
    </PageLayout>
  );
}
