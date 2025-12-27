import { useState, useEffect, useMemo } from 'react';
import { Beer, TrendingUp, TrendingDown, Check, X, Share2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BeerData } from '../types/beer';
import { beerCache } from '../utils/cache';
import { 
  getDailyBeer, 
  getTodayString, 
  loadGameState, 
  saveGameState, 
  compareBeers,
  getShareText,
  type BeerdleGameState
} from '../utils/beerdle';

export default function BeerdlePage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<BeerdleGameState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Load beers and game state
  useEffect(() => {
    const fetchBeers = async () => {
      try {
        // Try cache first for faster loading
        const cached = await beerCache.get<BeerData[]>('beers');
        let data: BeerData[] = [];
        
        if (cached) {
          data = cached;
          setBeers(cached);
        }
        
        // Fetch fresh data
        try {
          const response = await fetch('/api/beers');
          if (response.ok) {
            const freshData = await response.json();
            if (freshData && freshData.length > 0) {
              data = freshData;
              setBeers(freshData);
              await beerCache.set('beers', freshData);
            }
          }
        } catch (fetchError) {
          console.warn('API fetch failed, using cached data:', fetchError);
          // If we have cached data, continue with that
          if (!cached) {
            throw new Error('No beers available');
          }
        }
        
        if (!data || data.length === 0) {
          throw new Error('No beers available');
        }

        // Load or initialize game state
        const saved = loadGameState();
        if (saved && saved.date === getTodayString()) {
          // Check if saved beer still exists
          const savedBeerExists = data.some((b: BeerData) => b.beer_url === saved.targetBeerUrl);
          if (savedBeerExists) {
            setGameState(saved);
            if (saved.completed) {
              setShowResults(true);
            }
          } else {
            // Saved beer doesn't exist anymore, start new game
            const dailyBeer = getDailyBeer(data);
            if (!dailyBeer) {
              throw new Error('Could not select daily beer');
            }
            const newState: BeerdleGameState = {
              date: getTodayString(),
              targetBeerUrl: dailyBeer.beer_url,
              guesses: [],
              completed: false,
              won: false,
            };
            setGameState(newState);
            saveGameState(newState);
          }
        } else {
          // Start new game
          const dailyBeer = getDailyBeer(data);
          if (!dailyBeer) {
            throw new Error('Could not select daily beer');
          }
          const newState: BeerdleGameState = {
            date: getTodayString(),
            targetBeerUrl: dailyBeer.beer_url,
            guesses: [],
            completed: false,
            won: false,
          };
          setGameState(newState);
          saveGameState(newState);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
        setGameState(null);
      }
    };

    fetchBeers();
  }, []);

  // Get target beer
  const targetBeer = useMemo(() => {
    if (!beers.length || !gameState) return null;
    return beers.find(b => b.beer_url === gameState.targetBeerUrl) || null;
  }, [beers, gameState]);

  // Filter beers for dropdown
  const filteredBeers = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return beers
      .filter(beer => 
        beer.name.toLowerCase().includes(term) ||
        (beer.brewery && beer.brewery.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [beers, searchTerm]);

  // Handle guess
  const handleGuess = (beer: BeerData) => {
    if (!gameState || !targetBeer || gameState.completed) return;

    // Check if already guessed
    if (gameState.guesses.some(g => g.beer.beer_url === beer.beer_url)) {
      alert('Je hebt dit bier al geraden!');
      return;
    }

    const guess = compareBeers(beer, targetBeer);
    const isCorrect = beer.beer_url === targetBeer.beer_url;
    const newGuesses = [...gameState.guesses, guess];
    const isGameOver = isCorrect || newGuesses.length >= 6;

    const newState: BeerdleGameState = {
      ...gameState,
      guesses: newGuesses,
      completed: isGameOver,
      won: isCorrect,
    };

    setGameState(newState);
    saveGameState(newState);
    setSearchTerm('');
    setShowDropdown(false);

    if (isGameOver) {
      setTimeout(() => setShowResults(true), 500);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!gameState) return;

    const text = getShareText(gameState);
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Resultaat gekopieerd naar clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700">Beerdle laden...</p>
        </div>
      </div>
    );
  }

  if (!gameState || !targetBeer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <Beer className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oeps!</h2>
          <p className="text-gray-600 mb-4">
            Kon het spel niet laden. Probeer de pagina te verversen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
          >
            Ververs Pagina
          </button>
        </div>
      </div>
    );
  }

  const remainingGuesses = 6 - gameState.guesses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-6xl font-bold text-gray-900 font-heading">
              Beer<span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">dle</span>
            </h1>
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <HelpCircle className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <p className="text-lg text-gray-600">
            Raad het dagelijkse bier in 6 pogingen!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {getTodayString()} • {remainingGuesses} pogingen over
          </p>
        </motion.div>

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-8 max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4">Hoe speel je Beerdle?</h2>
                <div className="space-y-3 text-gray-700">
                  <p>🍺 Raad het dagelijkse bier in 6 pogingen</p>
                  <p>🔍 Type een biernaam in het zoekveld</p>
                  <p>📊 Na elke gok zie je hints:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• <span className="text-green-600 font-semibold">Groen</span> = Correct!</li>
                    <li>• <span className="text-blue-600 font-semibold">↑</span> = Het gezochte bier is hoger</li>
                    <li>• <span className="text-red-600 font-semibold">↓</span> = Het gezochte bier is lager</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-4">
                    Je kan maar 1x per dag spelen per apparaat!
                  </p>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                >
                  Begrepen!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Input */}
        {!gameState.completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type een biernaam..."
              className="w-full px-6 py-4 text-lg border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white shadow-lg"
            />

            {/* Dropdown */}
            {showDropdown && filteredBeers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-200 rounded-xl shadow-xl max-h-96 overflow-y-auto z-10">
                {filteredBeers.map((beer) => (
                  <button
                    key={beer.beer_url}
                    onClick={() => handleGuess(beer)}
                    className="w-full px-6 py-3 text-left hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-b-0"
                  >
                    <p className="font-semibold text-gray-800">{beer.name}</p>
                    <p className="text-sm text-gray-600">{beer.brewery}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Guesses */}
        <div className="space-y-4 mb-8">
          {gameState.guesses.map((guess, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-800">{guess.beer.name}</p>
                  <p className="text-sm text-gray-600">{guess.beer.brewery}</p>
                </div>
                <span className="text-2xl font-bold text-amber-600">#{index + 1}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* ABV */}
                <div className={`p-3 rounded-lg text-center ${
                  guess.abvMatch === 'correct' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">ABV</p>
                  <div className="flex items-center justify-center gap-1">
                    <p className="font-bold">{guess.beer.abv?.toFixed(1)}%</p>
                    {guess.abvMatch === 'higher' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {guess.abvMatch === 'lower' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {guess.abvMatch === 'correct' && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                </div>

                {/* Rating */}
                <div className={`p-3 rounded-lg text-center ${
                  guess.ratingMatch === 'correct' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <p className="font-bold">{guess.beer.rating?.toFixed(2)}</p>
                    {guess.ratingMatch === 'higher' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {guess.ratingMatch === 'lower' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {guess.ratingMatch === 'correct' && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                </div>

                {/* Style */}
                <div className={`p-3 rounded-lg text-center ${
                  guess.styleMatch === 'correct' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Stijl</p>
                  <div className="flex items-center justify-center gap-1">
                    <p className="font-bold text-xs truncate">{guess.beer.style}</p>
                    {guess.styleMatch === 'correct' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Brewery */}
                <div className={`p-3 rounded-lg text-center ${
                  guess.breweryMatch === 'correct' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Brouwerij</p>
                  <div className="flex items-center justify-center gap-1">
                    {guess.breweryMatch === 'correct' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className={`p-3 rounded-lg text-center ${
                  guess.categoryMatch === 'correct' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Categorie</p>
                  <div className="flex items-center justify-center gap-1">
                    {guess.categoryMatch === 'correct' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty slots */}
          {!gameState.completed && Array.from({ length: remainingGuesses }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white/50 border-2 border-dashed border-amber-200 rounded-xl p-4 h-32"
            />
          ))}
        </div>

        {/* Results Modal */}
        <AnimatePresence>
          {showResults && gameState.completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {gameState.won ? '🎉' : '😢'}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {gameState.won ? 'Gefeliciteerd!' : 'Helaas!'}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {gameState.won 
                      ? `Je hebt het bier geraden in ${gameState.guesses.length} ${gameState.guesses.length === 1 ? 'poging' : 'pogingen'}!`
                      : 'Je hebt het bier niet geraden.'
                    }
                  </p>

                  {/* Show target beer */}
                  <div className="bg-amber-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 mb-2">Het bier was:</p>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{targetBeer.name}</p>
                    <p className="text-gray-600">{targetBeer.brewery}</p>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                      <span>ABV: {targetBeer.abv?.toFixed(1)}%</span>
                      <span>Rating: {targetBeer.rating?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      Delen
                    </button>
                    <button
                      onClick={() => setShowResults(false)}
                      className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Sluiten
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Kom morgen terug voor een nieuw bier!
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
