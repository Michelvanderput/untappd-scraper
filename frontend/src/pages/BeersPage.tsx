import { useState, useEffect, useMemo } from 'react';
import { Beer, Search, Filter, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BeerData } from '../types/beer';
import BeerCard from '../components/BeerCard';
import { useDebounce } from '../hooks/useDebounce';
import { beerCache } from '../utils/cache';

export default function BeersPage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [filteredBeers, setFilteredBeers] = useState<BeerData[]>([]);
  const [currentBeer, setCurrentBeer] = useState<BeerData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [beersPerPage, setBeersPerPage] = useState(24);

  // Fetch beers from API or local JSON with caching
  useEffect(() => {
    const fetchBeers = async () => {
      try {
        // Try cache first
        const cached = await beerCache.get<BeerData[]>('beers');
        if (cached) {
          setBeers(cached);
          setFilteredBeers(cached);
          setLoading(false);
          
          // Fetch in background to update cache
          fetchAndCache();
          return;
        }

        // No cache, fetch immediately
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
          // Fetch all beers without pagination limit
          response = await fetch('/api/beers?limit=1000');
        } catch {
          response = await fetch('/beers.json');
        }
        
        const data = await response.json();
        const beersList = data.beers || [];
        
        setBeers(beersList);
        setFilteredBeers(beersList);
        setLoading(false);
        
        // Cache for next time
        await beerCache.set('beers', beersList);
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
      }
    };

    fetchBeers();
  }, []);

  // Deduplicate beers helper
  const deduplicateBeers = (beerList: BeerData[]) => {
    const seen = new Map<string, BeerData>();
    
    beerList.forEach(beer => {
      // Create unique key based on name + brewery
      const key = `${beer.name.toLowerCase().trim()}-${(beer.brewery || '').toLowerCase().trim()}`;
      
      // Keep the first occurrence or the one with more complete data
      if (!seen.has(key)) {
        seen.set(key, beer);
      } else {
        const existing = seen.get(key)!;
        // Prefer beer with more complete data (has rating, image, etc.)
        const newScore = (beer.rating ? 1 : 0) + (beer.image_url ? 1 : 0) + (beer.ibu ? 1 : 0);
        const existingScore = (existing.rating ? 1 : 0) + (existing.image_url ? 1 : 0) + (existing.ibu ? 1 : 0);
        
        if (newScore > existingScore) {
          seen.set(key, beer);
        }
      }
    });
    
    return Array.from(seen.values());
  };

  // Optimized search helper
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
      
      // All search terms must match somewhere in the beer data
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  // Debounce search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Filter beers with useMemo for performance
  const filteredBeersResult = useMemo(() => {
    let filtered = beers;

    // Remove duplicates first
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

  // Update filtered beers and reset page
  useEffect(() => {
    setFilteredBeers(filteredBeersResult);
    setCurrentPage(1);
  }, [filteredBeersResult]);

  // Get unique categories and subcategories
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 dark:text-amber-500 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">Bieren laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 font-heading">
            Bier <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Menu</span>
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 mx-auto mb-8 rounded-full" />
          <p className="text-2xl text-gray-600 dark:text-gray-300 font-medium">
            {filteredBeers.length} unieke bieren beschikbaar
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-amber-100 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                isSearching ? 'text-amber-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Zoek op naam, brouwerij of stijl..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white/80 dark:bg-gray-700/80 dark:text-white transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 transition-colors shadow-md"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-100 dark:border-gray-700"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white/80 dark:bg-gray-700/80 dark:text-white"
                >
                  <option value="">Alle categorieën</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategorie
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white/80 dark:bg-gray-700/80 dark:text-white"
                  disabled={!selectedCategory}
                >
                  <option value="">Alle subcategorieën</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {(searchTerm || selectedCategory || selectedSubcategory) && (
                <div className="md:col-span-2">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                  >
                    <X className="w-4 h-4" />
                    Alle filters wissen
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Current Selected Beer */}
        {currentBeer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border-2 border-amber-300 dark:border-amber-600 relative">

            <div className="flex flex-col md:flex-row gap-8">
              {/* Beer Image */}
              <div className="flex-shrink-0">
                {currentBeer.image_url ? (
                  <img
                    src={currentBeer.image_url}
                    alt={currentBeer.name}
                    className="w-48 h-48 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg flex items-center justify-center">
                    <Beer className="w-24 h-24 text-amber-600" />
                  </div>
                )}
              </div>

              {/* Beer Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {currentBeer.name}
                </h2>
                
                {currentBeer.brewery && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                    {currentBeer.brewery}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {currentBeer.style && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stijl</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{currentBeer.style}</p>
                    </div>
                  )}
                  
                  {currentBeer.abv !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ABV</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{currentBeer.abv}%</p>
                    </div>
                  )}
                  
                  {currentBeer.ibu !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IBU</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{currentBeer.ibu}</p>
                    </div>
                  )}
                  
                  {currentBeer.rating !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {currentBeer.rating.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentBeer.container && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Verpakking</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{currentBeer.container}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Categorie</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{currentBeer.category}</p>
                  </div>
                </div>

                {currentBeer.subcategory && (
                  <div className="mb-4">
                    <span className="inline-block bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium">
                      {currentBeer.subcategory}
                    </span>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}

        {/* Pagination Controls - Top */}
        {filteredBeers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Bieren per pagina:
              </label>
              <select
                value={beersPerPage}
                onChange={(e) => {
                  setBeersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white/80 dark:bg-gray-700/80 dark:text-white"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Toon {((currentPage - 1) * beersPerPage) + 1} - {Math.min(currentPage * beersPerPage, filteredBeers.length)} van {filteredBeers.length} bieren
            </div>
          </div>
        )}

        {/* Beer Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
        >
          {filteredBeers
            .slice((currentPage - 1) * beersPerPage, currentPage * beersPerPage)
            .map((beer, index) => (
              <motion.div
                key={beer.beer_url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <BeerCard
                  beer={beer}
                  onClick={() => setCurrentBeer(beer)}
                />
              </motion.div>
            ))}
        </motion.div>

        {/* Pagination Controls - Bottom */}
        {filteredBeers.length > beersPerPage && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Vorige
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(filteredBeers.length / beersPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and pages around current
                  const totalPages = Math.ceil(filteredBeers.length / beersPerPage);
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsisBefore && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-xl transition-colors shadow-sm ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredBeers.length / beersPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(filteredBeers.length / beersPerPage)}
              className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Volgende
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {filteredBeers.length === 0 && (
          <div className="text-center py-12">
            <Beer className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">Geen bieren gevonden</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium"
            >
              Filters wissen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
