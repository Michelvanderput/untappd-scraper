import { useState, useRef } from 'react';
import { Shuffle, Sparkles, TrendingUp, Flame, Zap, Star, ExternalLink, Beer as BeerIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import type { BeerData, RandomizerMode } from '../types/beer';

interface BeerRandomizerProps {
  beers: BeerData[];
  onBeerSelect?: (beer: BeerData) => void;
}

type RevealStep = 'style' | 'abv' | 'ibu' | 'rating' | 'category' | 'image' | 'name';

const REVEAL_STEPS: RevealStep[] = ['style', 'abv', 'ibu', 'rating', 'category', 'image', 'name'];

const MODES = [
  { id: 'all' as RandomizerMode, label: 'Alles', icon: Shuffle, color: 'from-amber-500 to-orange-500' },
  { id: 'top-rated' as RandomizerMode, label: 'Top Rated', icon: Star, color: 'from-yellow-500 to-amber-500' },
  { id: 'high-abv' as RandomizerMode, label: 'High ABV', icon: Flame, color: 'from-red-500 to-orange-500' },
  { id: 'low-abv' as RandomizerMode, label: 'Session', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { id: 'high-ibu' as RandomizerMode, label: 'Bitter', icon: Zap, color: 'from-green-500 to-emerald-500' },
];

export default function BeerRandomizer({ beers, onBeerSelect }: BeerRandomizerProps) {
  const [currentBeer, setCurrentBeer] = useState<BeerData | null>(null);
  const [history, setHistory] = useState<BeerData[]>([]);
  const [mode, setMode] = useState<RandomizerMode>('all');
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<Set<RevealStep>>(new Set());
  const randomBeerRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  const getFilteredBeers = (selectedMode: RandomizerMode): BeerData[] => {
    let filtered = [...beers];
    
    switch (selectedMode) {
      case 'high-abv':
        filtered = filtered.filter(b => b.abv && b.abv >= 7);
        break;
      case 'low-abv':
        filtered = filtered.filter(b => b.abv && b.abv <= 5);
        break;
      case 'top-rated':
        filtered = filtered.filter(b => b.rating && b.rating >= 3.75);
        break;
      case 'high-ibu':
        filtered = filtered.filter(b => b.ibu && b.ibu >= 60);
        break;
    }
    
    return filtered.length > 0 ? filtered : beers;
  };

  const createConfetti = () => {
    if (!confettiRef.current) return;
    
    const colors = ['#f59e0b', '#f97316', '#eab308', '#ef4444', '#ec4899'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute w-2 h-2 rounded-full';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = '50%';
      confetti.style.top = '50%';
      confettiRef.current.appendChild(confetti);
      
      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        opacity: 0,
        duration: 1 + Math.random(),
        ease: 'power2.out',
        onComplete: () => confetti.remove()
      });
    }
  };

  const randomizeBeer = () => {
    const filteredBeers = getFilteredBeers(mode);
    
    if (filteredBeers.length === 0 || isRandomizing) return;
    
    const finalIndex = Math.floor(Math.random() * filteredBeers.length);
    const finalBeer = filteredBeers[finalIndex];
    
    // Reset state and set beer FIRST
    setRevealedSteps(new Set());
    setCurrentBeer(finalBeer);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      setIsRandomizing(true);
      setShowConfetti(false);
    
    const completeRandomization = () => {
      setHistory(prev => {
        // Ensure we add the correct final beer to history
        const newHistory = [finalBeer, ...prev.filter(b => b.beer_url !== finalBeer.beer_url).slice(0, 4)];
        return newHistory;
      });
      setIsRandomizing(false);
      setShowConfetti(true);
      createConfetti();
      if (onBeerSelect) onBeerSelect(finalBeer);
      
      setTimeout(() => setShowConfetti(false), 3000);
    };
    
    if (randomBeerRef.current) {
      const tl = gsap.timeline({
        onComplete: completeRandomization
      });
      
      // Scale up animation at start
      tl.to(randomBeerRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Reveal each step sequentially with MAXIMUM suspense
      REVEAL_STEPS.forEach((step, index) => {
        tl.call(() => {
          setRevealedSteps(prev => new Set([...prev, step]));
        }, [], 1.0 + index * 0.8);
      });
      
      // Dramatic pause before final bounce
      tl.to({}, { duration: 0.5 });
      
      // Final bounce
      tl.to(randomBeerRef.current, {
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)'
      });
    } else {
      // Fallback without animation
      setRevealedSteps(new Set(REVEAL_STEPS));
      completeRandomization();
    }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex flex-wrap gap-3 justify-center">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${m.color} text-white shadow-lg`
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {m.label}
            </motion.button>
          );
        })}
      </div>

      {/* Main Randomizer Button */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: isRandomizing ? 1 : 1.05 }}
          whileTap={{ scale: isRandomizing ? 1 : 0.95 }}
          onClick={randomizeBeer}
          disabled={isRandomizing}
          className={`relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl ${
            isRandomizing 
              ? 'opacity-75 cursor-not-allowed animate-pulse' 
              : 'hover:shadow-amber-500/50 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700'
          }`}
        >
          <Shuffle className={`w-6 h-6 ${isRandomizing ? 'animate-spin' : ''}`} />
          {isRandomizing ? '🎲 Aan het randomizen...' : '🎰 Verras Me!'}
          {showConfetti && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Confetti Container */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Current Beer Display */}
      <AnimatePresence mode="wait">
        {currentBeer && (
          <motion.div
            key={currentBeer.beer_url}
            ref={randomBeerRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-white to-amber-50/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-4 border-amber-400 relative overflow-hidden"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row gap-8">
              {/* Beer Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <AnimatePresence mode="wait">
                  {revealedSteps.has('image') ? (
                    currentBeer.image_url ? (
                      <motion.img
                        key={`image-${currentBeer.beer_url}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        src={currentBeer.image_url}
                        alt={currentBeer.name}
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    ) : (
                      <motion.div
                        key={`placeholder-${currentBeer.beer_url}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-48 h-48 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center"
                      >
                        <BeerIcon className="w-24 h-24 text-amber-600" />
                      </motion.div>
                    )
                  ) : (
                    <div
                      key={`hidden-${currentBeer.beer_url}`}
                      className="w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center"
                    >
                      <div className="text-6xl">❓</div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Beer Info */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {revealedSteps.has('name') ? (
                    <motion.div
                      key={`name-${currentBeer.beer_url}`}
                      initial={{ x: -20, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <h2 className="text-4xl font-bold text-gray-800 mb-2 font-heading">
                        {currentBeer.name}
                      </h2>
                      {currentBeer.brewery && (
                        <p className="text-xl text-gray-600 mb-6">
                          {currentBeer.brewery}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <div key={`name-hidden-${currentBeer.beer_url}`}>
                      <div className="h-12 bg-gray-200 rounded-lg mb-2 animate-pulse" />
                      <div className="h-7 bg-gray-200 rounded-lg mb-6 animate-pulse w-3/4" />
                    </div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {/* Style */}
                  {currentBeer.style && (
                    <AnimatePresence mode="wait">
                      {revealedSteps.has('style') ? (
                        <motion.div
                          key={`style-${currentBeer.beer_url}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100"
                        >
                          <p className="text-xs text-gray-500 mb-1">Stijl</p>
                          <p className="font-semibold text-gray-800 text-sm">{currentBeer.style}</p>
                        </motion.div>
                      ) : (
                        <div
                          key={`style-hidden-${currentBeer.beer_url}`}
                          className="bg-gray-200 rounded-xl p-3 animate-pulse"
                        >
                          <p className="text-xs text-gray-400 mb-1">Stijl</p>
                          <div className="h-5 bg-gray-300 rounded" />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                  
                  {/* ABV */}
                  {currentBeer.abv !== null && (
                    <AnimatePresence mode="wait">
                      {revealedSteps.has('abv') ? (
                        <motion.div
                          key={`abv-${currentBeer.beer_url}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-3 border border-amber-200"
                        >
                          <p className="text-xs text-amber-700 mb-1">ABV</p>
                          <p className="font-bold text-amber-900 text-lg">{currentBeer.abv}%</p>
                        </motion.div>
                      ) : (
                        <div
                          key={`abv-hidden-${currentBeer.beer_url}`}
                          className="bg-gray-200 rounded-xl p-3 animate-pulse"
                        >
                          <p className="text-xs text-gray-400 mb-1">ABV</p>
                          <div className="h-7 bg-gray-300 rounded" />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                  
                  {/* IBU */}
                  {currentBeer.ibu !== null && (
                    <AnimatePresence mode="wait">
                      {revealedSteps.has('ibu') ? (
                        <motion.div
                          key={`ibu-${currentBeer.beer_url}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-3 border border-green-200"
                        >
                          <p className="text-xs text-green-700 mb-1">IBU</p>
                          <p className="font-bold text-green-900 text-lg">{currentBeer.ibu}</p>
                        </motion.div>
                      ) : (
                        <div
                          key={`ibu-hidden-${currentBeer.beer_url}`}
                          className="bg-gray-200 rounded-xl p-3 animate-pulse"
                        >
                          <p className="text-xs text-gray-400 mb-1">IBU</p>
                          <div className="h-7 bg-gray-300 rounded" />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                  
                  {/* Rating */}
                  {currentBeer.rating !== null && (
                    <AnimatePresence mode="wait">
                      {revealedSteps.has('rating') ? (
                        <motion.div
                          key={`rating-${currentBeer.beer_url}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl p-3 border border-yellow-200"
                        >
                          <p className="text-xs text-yellow-700 mb-1">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                            <p className="font-bold text-yellow-900 text-lg">
                              {currentBeer.rating.toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <div
                          key={`rating-hidden-${currentBeer.beer_url}`}
                          className="bg-gray-200 rounded-xl p-3 animate-pulse"
                        >
                          <p className="text-xs text-gray-400 mb-1">Rating</p>
                          <div className="h-7 bg-gray-300 rounded" />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                  
                  {/* Category */}
                  {currentBeer.category && (
                    <AnimatePresence mode="wait">
                      {revealedSteps.has('category') ? (
                        <motion.div
                          key={`category-${currentBeer.beer_url}`}
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-200"
                        >
                          <p className="text-xs text-purple-700 mb-1">Categorie</p>
                          <p className="font-bold text-purple-900 text-sm">{currentBeer.category}</p>
                        </motion.div>
                      ) : (
                        <div
                          key={`category-hidden-${currentBeer.beer_url}`}
                          className="bg-gray-200 rounded-xl p-3 animate-pulse"
                        >
                          <p className="text-xs text-gray-400 mb-1">Categorie</p>
                          <div className="h-5 bg-gray-300 rounded" />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                {currentBeer.subcategory && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4"
                  >
                    <span className="inline-block bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
                      {currentBeer.subcategory}
                    </span>
                  </motion.div>
                )}

                <motion.a
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  href={currentBeer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium bg-white/80 px-4 py-2 rounded-lg hover:bg-white transition-all"
                >
                  Bekijk op Untappd
                  <ExternalLink className="w-4 h-4" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Recent Gerandomized
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {history.map((beer, index) => (
              <motion.button
                key={`${beer.beer_url}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setCurrentBeer(beer)}
                className="group relative bg-white rounded-lg p-3 border border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                {beer.image_url ? (
                  <img
                    src={beer.image_url}
                    alt={beer.name}
                    className="w-full h-20 object-contain mb-2"
                  />
                ) : (
                  <div className="w-full h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded flex items-center justify-center mb-2">
                    <BeerIcon className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                <p className="text-xs font-medium text-gray-800 truncate group-hover:text-amber-600 transition-colors">
                  {beer.name}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
