import { useState, useEffect } from 'react';
import { Beer, Shuffle, Search, Filter, X, ExternalLink, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface BeerData {
  name: string;
  beer_url: string;
  image_url: string | null;
  style: string | null;
  brewery: string | null;
  brewery_url: string | null;
  category: string;
  subcategory: string | null;
  abv: number | null;
  ibu: number | null;
  rating: number | null;
  container: string | null;
}

interface ApiResponse {
  beers: BeerData[];
  count: number;
}

function App() {
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

  // Fetch beers from API
  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const response = await fetch('/api/beers');
        const data: ApiResponse = await response.json();
        setBeers(data.beers);
        setFilteredBeers(data.beers);
        setLoading(false);
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

  // Filter beers
  useEffect(() => {
    let filtered = beers;

    // Remove duplicates first
    filtered = deduplicateBeers(filtered);

    if (selectedCategory) {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(b => b.subcategory === selectedSubcategory);
    }

    if (searchTerm) {
      filtered = searchBeers(filtered, searchTerm);
    }

    setFilteredBeers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedCategory, selectedSubcategory, beers]);

  // Get unique categories and subcategories
  const categories = Array.from(new Set(beers.map(b => b.category)));
  const subcategories = Array.from(new Set(
    beers
      .filter(b => !selectedCategory || b.category === selectedCategory)
      .map(b => b.subcategory)
      .filter(Boolean)
  )) as string[];

  // Randomize beer
  const randomizeBeer = () => {
    if (filteredBeers.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredBeers.length);
    setCurrentBeer(filteredBeers[randomIndex]);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700">Bieren laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Beer className="w-12 h-12 text-amber-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Biertaverne De Gouverneur
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {filteredBeers.length} unieke bieren beschikbaar
            {beers.length !== deduplicateBeers(beers).length && (
              <span className="text-sm text-gray-500 ml-2">
                ({beers.length - deduplicateBeers(beers).length} duplicaten verwijderd)
              </span>
            )}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Zoek op naam, brouwerij of stijl..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            {/* Randomize Button */}
            <button
              onClick={randomizeBeer}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              <Shuffle className="w-5 h-5" />
              Random Bier
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Alle categorieën</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategorie
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
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
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                    Filters wissen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Random Beer */}
        {currentBeer && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-amber-400">
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
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Beer className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Beer Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {currentBeer.name}
                </h2>
                
                {currentBeer.brewery && (
                  <p className="text-xl text-gray-600 mb-4">
                    {currentBeer.brewery}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {currentBeer.style && (
                    <div>
                      <p className="text-sm text-gray-500">Stijl</p>
                      <p className="font-semibold text-gray-800">{currentBeer.style}</p>
                    </div>
                  )}
                  
                  {currentBeer.abv !== null && (
                    <div>
                      <p className="text-sm text-gray-500">ABV</p>
                      <p className="font-semibold text-gray-800">{currentBeer.abv}%</p>
                    </div>
                  )}
                  
                  {currentBeer.ibu !== null && (
                    <div>
                      <p className="text-sm text-gray-500">IBU</p>
                      <p className="font-semibold text-gray-800">{currentBeer.ibu}</p>
                    </div>
                  )}
                  
                  {currentBeer.rating !== null && (
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <p className="font-semibold text-gray-800">
                          {currentBeer.rating.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentBeer.container && (
                    <div>
                      <p className="text-sm text-gray-500">Verpakking</p>
                      <p className="font-semibold text-gray-800">{currentBeer.container}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Categorie</p>
                    <p className="font-semibold text-gray-800">{currentBeer.category}</p>
                  </div>
                </div>

                {currentBeer.subcategory && (
                  <div className="mb-4">
                    <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentBeer.subcategory}
                    </span>
                  </div>
                )}

                <a
                  href={currentBeer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  Bekijk op Untappd
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls - Top */}
        {filteredBeers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700">
                Bieren per pagina:
              </label>
              <select
                value={beersPerPage}
                onChange={(e) => {
                  setBeersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Toon {((currentPage - 1) * beersPerPage) + 1} - {Math.min(currentPage * beersPerPage, filteredBeers.length)} van {filteredBeers.length} bieren
            </div>
          </div>
        )}

        {/* Beer Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredBeers
            .slice((currentPage - 1) * beersPerPage, currentPage * beersPerPage)
            .map((beer) => (
              <div
                key={beer.beer_url}
                onClick={() => setCurrentBeer(beer)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6 hover:scale-105"
              >
                <div className="flex gap-4">
                  {beer.image_url ? (
                    <img
                      src={beer.image_url}
                      alt={beer.name}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Beer className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-1 truncate">
                      {beer.name}
                    </h3>
                    {beer.brewery && (
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {beer.brewery}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {beer.abv !== null && (
                        <span className="text-gray-700 font-medium">
                          {beer.abv}%
                        </span>
                      )}
                      {beer.rating !== null && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-gray-700">
                            {beer.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination Controls - Bottom */}
        {filteredBeers.length > beersPerPage && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
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
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Volgende
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {filteredBeers.length === 0 && (
          <div className="text-center py-12">
            <Beer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Geen bieren gevonden</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
            >
              Filters wissen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
