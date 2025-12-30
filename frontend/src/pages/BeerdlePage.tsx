import { useState, useEffect, useMemo } from 'react';
import { Beer, Check, X, Share2, HelpCircle, BarChart3, Sparkles, ExternalLink } from 'lucide-react';
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
      setTimeout(() => setShowResults(true), 1500);
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300 font-heading">Beerdle laden...</p>
        </div>
      </div>
    );
  }

  if (!gameState || !targetBeer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="glass-panel text-center rounded-2xl p-8 max-w-md w-full">
          <Beer className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-2 font-heading">Oeps!</h2>
          <p className="text-gray-600 dark:text-amber-200/70 mb-4">
            Kon het spel niet laden. Probeer de pagina te verversen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Ververs Pagina
          </button>
        </div>
      </div>
    );
  }

  const remainingGuesses = 6 - gameState.guesses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      {/* Abstract Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 font-heading tracking-tight">
              Beer<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">dle</span>
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Help"
              >
                <HelpCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              {gameState.completed && (
                <button
                  onClick={() => setShowResults(true)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors"
                  title="Statistieken"
                >
                  <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Raad het dagelijkse bier in 6 pogingen
          </p>
          <div className="mt-4 flex justify-center items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-500">
            <span>{getTodayString()}</span>
            <span>•</span>
            <span className={remainingGuesses <= 2 ? 'text-red-500' : 'text-green-500'}>
              {remainingGuesses} {remainingGuesses === 1 ? 'poging' : 'pogingen'} over
            </span>
          </div>
        </motion.div>

        {/* Beer Card with Progressive Hints */}
        {targetBeer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Blurred Image */}
                <div className="relative flex-shrink-0">
                  <div className={`relative w-48 h-48 rounded-2xl overflow-hidden transition-all duration-1000 ${
                    gameState.completed ? '' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {targetBeer.image_url ? (
                      <img
                        src={targetBeer.image_url}
                        alt="Mystery beer"
                        className="w-full h-full object-contain"
                        style={{
                          filter: gameState.completed ? 'blur(0px)' : 'blur(15px)',
                          transition: 'filter 1s ease-in-out',
                          opacity: gameState.completed ? 1 : 0.8
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Beer className="w-24 h-24 text-amber-600/50" />
                      </div>
                    )}
                    {!gameState.completed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl animate-bounce">❓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progressive Hints Grid */}
                <div className="flex-1 w-full grid grid-cols-2 gap-3">
                  {/* Hint 1: ABV */}
                  <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                    gameState.guesses.length >= 1
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">ABV</span>
                    {gameState.guesses.length >= 1 ? (
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{targetBeer.abv?.toFixed(1)}%</span>
                    ) : (
                      <span className="text-xl font-bold text-gray-300 dark:text-gray-600">???</span>
                    )}
                  </div>

                  {/* Hint 2: Rating */}
                  <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                    gameState.guesses.length >= 2
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Rating</span>
                    {gameState.guesses.length >= 2 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{targetBeer.rating?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-gray-300 dark:text-gray-600">???</span>
                    )}
                  </div>

                  {/* Hint 3: Category */}
                  <div className={`p-4 rounded-2xl border transition-all duration-500 col-span-2 ${
                    gameState.guesses.length >= 3
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Categorie</span>
                    {gameState.guesses.length >= 3 ? (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{targetBeer.category}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600">???</span>
                    )}
                  </div>

                  {/* Hint 4: Style */}
                  <div className={`p-4 rounded-2xl border transition-all duration-500 col-span-2 ${
                    gameState.guesses.length >= 4
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Stijl</span>
                    {gameState.guesses.length >= 4 ? (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{targetBeer.style}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600">???</span>
                    )}
                  </div>

                  {/* Hint 5: Brewery */}
                  <div className={`p-4 rounded-2xl border transition-all duration-500 col-span-2 ${
                    gameState.guesses.length >= 5
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Brouwerij</span>
                    {gameState.guesses.length >= 5 ? (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{targetBeer.brewery}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600">???</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel rounded-3xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-heading">Hoe speel je Beerdle?</h2>
                  <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Beer className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Raad het bier</p>
                      <p className="text-sm">Elke dag een nieuw bier om te raden in 6 pogingen.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Krijg hints</p>
                      <p className="text-sm">Na elke gok krijg je een nieuwe hint over het bier.</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-2 mt-4">
                    <p>🎯 Gok 1: <span className="font-bold text-gray-900 dark:text-white">ABV</span></p>
                    <p>🎯 Gok 2: <span className="font-bold text-gray-900 dark:text-white">Rating</span></p>
                    <p>🎯 Gok 3: <span className="font-bold text-gray-900 dark:text-white">Categorie</span></p>
                    <p>🎯 Gok 4: <span className="font-bold text-gray-900 dark:text-white">Stijl</span></p>
                    <p>🎯 Gok 5: <span className="font-bold text-gray-900 dark:text-white">Brouwerij</span></p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-8 w-full btn-primary"
                >
                  Ik snap het!
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
            className="mb-8 relative z-20"
          >
            <div className="relative group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type een biernaam..."
                className="w-full px-6 py-5 text-lg rounded-2xl border-2 border-transparent bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-gray-400"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
                <Beer className="w-6 h-6" />
              </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && filteredBeers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 overflow-hidden"
                >
                  {filteredBeers.map((beer) => (
                    <button
                      key={beer.beer_url}
                      onClick={() => handleGuess(beer)}
                      className="w-full px-6 py-4 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{beer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{beer.brewery}</p>
                        </div>
                        {beer.image_url && (
                          <img src={beer.image_url} alt="" className="w-10 h-10 object-contain" />
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Guesses */}
        <div className="space-y-3 mb-8">
          {gameState.guesses.map((guess, index) => {
            const isCorrect = guess.beer.beer_url === targetBeer.beer_url;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl shadow-sm p-4 border-l-4 transition-all ${
                  isCorrect 
                    ? 'bg-white dark:bg-gray-800 border-green-500 shadow-green-500/10'
                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-bold font-mono ${
                    isCorrect ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  
                  {/* Beer Image */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 p-1">
                    {guess.beer.image_url ? (
                      <img
                        src={guess.beer.image_url}
                        alt={guess.beer.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Beer className="w-full h-full text-gray-300" />
                    )}
                  </div>

                  {/* Beer Name */}
                  <div className="flex-1 min-w-0">
                    <a 
                      href={guess.beer.beer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/name block"
                    >
                      <p className="font-bold text-gray-900 dark:text-white truncate group-hover/name:text-amber-600 dark:group-hover/name:text-amber-400 transition-colors flex items-center gap-1">
                        {guess.beer.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                      </p>
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{guess.beer.brewery}</p>
                  </div>

                  {/* Result Icon */}
                  {isCorrect ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.div>
                  ) : (
                    <X className="w-6 h-6 text-red-400" />
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Empty slots */}
          {!gameState.completed && Array.from({ length: remainingGuesses }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white/30 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 h-20 flex items-center justify-center"
            >
              <span className="text-gray-400 dark:text-gray-600 font-medium text-sm">
                Poging {gameState.guesses.length + index + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Results Modal */}
        <AnimatePresence>
          {showResults && gameState.completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
              >
                {/* Confetti / Sad bg effects */}
                <div className={`absolute inset-0 opacity-10 ${
                  gameState.won ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-orange-600'
                }`} />

                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl"
                  >
                    {gameState.won ? '🏆' : '😢'}
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-2 font-heading">
                    {gameState.won ? 'Gefeliciteerd!' : 'Helaas!'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    {gameState.won 
                      ? `Je hebt het bier geraden in ${gameState.guesses.length} ${gameState.guesses.length === 1 ? 'poging' : 'pogingen'}!`
                      : 'Volgende keer beter!'
                    }
                  </p>

                  {/* Target Beer Reveal */}
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 border border-white/50 dark:border-gray-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Het bier was</p>
                    <div className="flex flex-col items-center">
                        {targetBeer.image_url && (
                            <img src={targetBeer.image_url} alt="" className="w-24 h-24 object-contain mb-3" />
                        )}
                        <a 
                          href={targetBeer.beer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                        >
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:underline decoration-amber-500/50 underline-offset-4">{targetBeer.name}</h3>
                          <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <p className="text-gray-600 dark:text-gray-400">{targetBeer.brewery}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      Delen
                    </button>
                    <button
                      onClick={() => setShowResults(false)}
                      className="flex-1 btn-secondary"
                    >
                      Sluiten
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mt-6">
                    Nieuw bier beschikbaar om 00:00
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
