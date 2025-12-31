import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Beer, Search, Filter, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BeerData } from '../types/beer';
import BeerCard from '../components/BeerCard';
import BeerModal from '../components/BeerModal';
import { useDebounce } from '../hooks/useDebounce';
import { beerCache } from '../utils/cache';
import SEO from '../components/SEO';
import { animatePageHeader, animateFadeIn, animateGrid } from '../utils/animations';

export default function BeersPage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [filteredBeers, setFilteredBeers] = useState<BeerData[]>([]);
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(24);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Animate header on mount
  useEffect(() => {
    if (headerRef.current && !loading) {
      animatePageHeader(headerRef.current);
    }
  }, [loading]);

  // Animate search bar on mount
  useEffect(() => {
    if (searchRef.current && !loading) {
      animateFadeIn(searchRef.current, 0.3);
    }
  }, [loading]);

  // Animate grid on mount
  useEffect(() => {
    if (gridRef.current && !loading) {
      animateGrid(gridRef.current);
    }
  }, [filteredBeers, loading, displayCount]);

  // Animate filter panel
  useEffect(() => {
    if (filterRef.current && showFilters) {
      animateFadeIn(filterRef.current, 0.1);
    }
  }, [showFilters]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredBeers.length) {
          setDisplayCount(prev => Math.min(prev + 24, filteredBeers.length));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [displayCount, filteredBeers.length]);

  // Fetch beers from API or local JSON with caching
  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const cached = await beerCache.get<BeerData[]>('beers');
        if (cached) {
          setBeers(cached);
          setFilteredBeers(cached);
          setLoading(false);
          
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
          response = await fetch('/api/beers?limit=1000');
        } catch {
          response = await fetch('/beers.json');
        }
        
        const data = await response.json();
        const beersList = data.beers || [];
        
        setBeers(beersList);
        setFilteredBeers(beersList);
        setLoading(false);
        
        await beerCache.set('beers', beersList);
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
      }
    };

    fetchBeers();
  }, []);

  const deduplicateBeers = (beerList: BeerData[]) => {
    const seen = new Map<string, BeerData>();
    
    beerList.forEach(beer => {
      const key = `${beer.name.toLowerCase().trim()}-${(beer.brewery || '').toLowerCase().trim()}`;
      
      if (!seen.has(key)) {
        seen.set(key, beer);
      } else {
        const existing = seen.get(key)!;
        const newScore = (beer.rating ? 1 : 0) + (beer.image_url ? 1 : 0) + (beer.ibu ? 1 : 0);
        const existingScore = (existing.rating ? 1 : 0) + (existing.image_url ? 1 : 0) + (existing.ibu ? 1 : 0);
        
        if (newScore > existingScore) {
          seen.set(key, beer);
        }
      }
    });
    
    return Array.from(seen.values());
  };

  const searchBeers = (beerList: BeerData[], term: string) => {
    const searchTerms = term.toLowerCase().trim().split(/\s+/);
    
    return beerList.filter(beer => {
      const searchableText = [
        beer.name,
        beer.brewery,
        beer.style,
        beer.category,
        beer.subcategory
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const filteredBeersResult = useMemo(() => {
    let filtered = beers;

    filtered = deduplicateBeers(filtered);

    if (selectedCategory) {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(b => b.subcategory === selectedSubcategory);
    }

    if (debouncedSearchTerm) {
      filtered = searchBeers(filtered, debouncedSearchTerm);
    }

    return filtered;
  }, [debouncedSearchTerm, selectedCategory, selectedSubcategory, beers]);

  useEffect(() => {
    setFilteredBeers(filteredBeersResult);
    setDisplayCount(24); // Reset display count on filter change
  }, [filteredBeersResult]);

  const categories = Array.from(new Set(beers.map(b => b.category)));
  const subcategories = Array.from(new Set(
    beers
      .filter(b => !selectedCategory || b.category === selectedCategory)
      .map(b => b.subcategory)
      .filter(Boolean)
  )) as string[];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  const handleBeerClick = useCallback((beer: BeerData) => {
    setSelectedBeer(beer);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedBeer(null);
  }, []);

  const displayedBeers = filteredBeers.slice(0, displayCount);
  const hasMore = displayCount < filteredBeers.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 dark:text-amber-500 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300 font-heading">Bieren laden...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={selectedBeer ? `${selectedBeer.name} - BeerMenu` : 'BeerMenu - Ontdek de Beste Bieren'}
        description={selectedBeer ? `${selectedBeer.name} - ${selectedBeer.category} | ${selectedBeer.subcategory || ''} | ABV: ${selectedBeer.abv}%` : `Ontdek ${filteredBeers.length} unieke bieren. Zoek, filter en vind je favoriete bier!`}
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Abstract Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white mb-6 font-heading tracking-tight">
              Bier <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Menu</span>
            </h1>
            <div className="divider w-32 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 mx-auto mb-8 rounded-full shadow-lg shadow-amber-500/20" />
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full border border-amber-100 dark:border-gray-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {filteredBeers.length} unieke bieren beschikbaar
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div 
            ref={searchRef} 
            className="glass-panel rounded-2xl p-6 mb-12 opacity-0 relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  isSearching ? 'text-amber-500 animate-pulse' : 'text-gray-400 dark:text-gray-500 group-focus-within:text-amber-500'
                }`} />
                <input
                  type="text"
                  placeholder="Zoek op naam, brouwerij of stijl..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white text-lg"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Filter Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg ${
                  showFilters
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500 ring-inset'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/30'
                }`}
              >
                <Filter className={`w-5 h-5 ${showFilters ? 'rotate-180' : ''} transition-transform duration-300`} />
                <span>Filters</span>
              </motion.button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                        Categorie
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubcategory('');
                          }}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none text-gray-900 dark:text-white"
                        >
                          <option value="">Alle categorieën</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                        Subcategorie
                      </label>
                      <div className="relative">
                        <select
                          value={selectedSubcategory}
                          onChange={(e) => setSelectedSubcategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedCategory}
                        >
                          <option value="">Alle subcategorieën</option>
                          {subcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {(searchTerm || selectedCategory || selectedSubcategory) && (
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Alles wissen
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Beer Grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          >
            {displayedBeers.map((beer) => (
              <div key={beer.beer_url} className="h-full">
                <BeerCard
                  beer={beer}
                  onClick={() => handleBeerClick(beer)}
                />
              </div>
            ))}
          </div>

          {/* Loading More Indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-12">
              <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">Meer bieren laden...</span>
              </div>
            </div>
          )}

          {/* End of List */}
          {!hasMore && filteredBeers.length > 0 && (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                <Beer className="w-8 h-8 opacity-50" />
                <p className="font-medium">Dat waren ze allemaal!</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredBeers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">Geen bieren gevonden</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                We konden geen bieren vinden die aan je criteria voldoen. Probeer een andere zoekopdracht of filter.
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Filters wissen
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Beer Modal */}
      <BeerModal
        beer={selectedBeer}
        onClose={handleModalClose}
      />
    </>
  );
}
