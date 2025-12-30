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
  { id: 'high-abv' as RandomizerMode, label: 'Sterk', icon: Flame, color: 'from-red-500 to-orange-500' },
  { id: 'low-abv' as RandomizerMode, label: 'Licht', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
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
    
    // Reset state
    setRevealedSteps(new Set());
    setCurrentBeer(finalBeer);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      setIsRandomizing(true);
      setShowConfetti(false);
    
    const completeRandomization = () => {
      setHistory(prev => {
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
      
      // Reveal each step sequentially
      REVEAL_STEPS.forEach((step, index) => {
        tl.call(() => {
          setRevealedSteps(prev => new Set([...prev, step]));
        }, [], 0.5 + index * 0.8); // Slower steps (0.8s apart instead of 0.4s)
      });
      
      // Dramatic pause before final bounce
      tl.to({}, { duration: 1.0 }); // Longer pause
      
      // Final bounce
      tl.to(randomBeerRef.current, {
        scale: 1,
        duration: 1.2, // Slower bounce
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
    <div className="space-y-8">
      {/* Mode Selection - Scrollable on mobile */}
      <div className="flex flex-wrap md:justify-center gap-3 overflow-x-auto pb-4 md:pb-0 px-2 -mx-2 no-scrollbar touch-pan-x">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode(m.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${m.color} text-white shadow-lg shadow-orange-500/20`
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
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
          className={`relative group flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl font-bold text-xl transition-all shadow-2xl ${
            isRandomizing 
              ? 'opacity-75 cursor-not-allowed animate-pulse' 
              : 'hover:shadow-amber-500/50 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700'
          }`}
        >
          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Shuffle className={`w-7 h-7 ${isRandomizing ? 'animate-spin' : ''}`} />
          <span>{isRandomizing ? 'Aan het zoeken...' : 'Verras Me!'}</span>
          
          {showConfetti && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="absolute -top-3 -right-3 bg-white text-yellow-500 p-2 rounded-full shadow-lg"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
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
            className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden max-w-2xl mx-auto"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/5 pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Beer Image */}
              <div className="flex-shrink-0 relative">
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
                        className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                      />
                    ) : (
                      <motion.div
                        key={`placeholder-${currentBeer.beer_url}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shadow-inner"
                      >
                        <BeerIcon className="w-24 h-24 text-amber-600/50" />
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      key={`hidden-${currentBeer.beer_url}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-48 h-48 md:w-56 md:h-56 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center animate-pulse"
                    >
                      <div className="text-6xl animate-bounce">❓</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Beer Info */}
              <div className="flex-1 w-full text-center md:text-left">
                <AnimatePresence mode="wait">
                  {revealedSteps.has('name') ? (
                    <motion.div
                      key={`name-${currentBeer.beer_url}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <h2 className="text-3xl md:text-4xl font-heading text-gray-900 dark:text-white mb-2 leading-tight">
                        {currentBeer.name}
                      </h2>
                      {currentBeer.brewery && (
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 font-medium">
                          {currentBeer.brewery}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <div key={`name-hidden-${currentBeer.beer_url}`} className="w-full">
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3 animate-pulse w-3/4 mx-auto md:mx-0" />
                      <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8 animate-pulse w-1/2 mx-auto md:mx-0" />
                    </div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Style */}
                  <AnimatePresence mode="wait">
                    {revealedSteps.has('style') ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                        >
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stijl</p>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{currentBeer.style || currentBeer.category}</p>
                        </motion.div>
                    ) : (
                        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </AnimatePresence>

                  {/* Rating */}
                  <AnimatePresence mode="wait">
                    {revealedSteps.has('rating') ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-100 dark:border-yellow-900/30"
                        >
                          <p className="text-xs text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-1">Rating</p>
                          <div className="flex items-center justify-center md:justify-start gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <p className="font-bold text-gray-900 dark:text-white">
                              {currentBeer.rating?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                        </motion.div>
                    ) : (
                        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </AnimatePresence>

                  {/* ABV */}
                  <AnimatePresence mode="wait">
                    {revealedSteps.has('abv') ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30"
                        >
                          <p className="text-xs text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-1">ABV</p>
                          <p className="font-bold text-gray-900 dark:text-white">{currentBeer.abv}%</p>
                        </motion.div>
                    ) : (
                        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </AnimatePresence>

                  {/* IBU */}
                  <AnimatePresence mode="wait">
                    {revealedSteps.has('ibu') ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-900/30"
                        >
                          <p className="text-xs text-green-700 dark:text-green-500 uppercase tracking-wider mb-1">IBU</p>
                          <p className="font-bold text-gray-900 dark:text-white">{currentBeer.ibu || 'N/A'}</p>
                        </motion.div>
                    ) : (
                        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    )}
                  </AnimatePresence>
                </div>

                <motion.a
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  href={currentBeer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold bg-amber-50 dark:bg-amber-900/20 px-6 py-3 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all group"
                >
                  Bekijk op Untappd
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History - Grid Scrollable on mobile */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Eerder Gevonden
          </h3>
          <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-4 md:pb-0 -mx-2 px-2 no-scrollbar snap-x">
            {history.map((beer, index) => (
              <motion.button
                key={`${beer.beer_url}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                   setCurrentBeer(beer);
                   setRevealedSteps(new Set(REVEAL_STEPS));
                }}
                className="flex-shrink-0 w-32 md:w-auto snap-center bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all group"
              >
                {beer.image_url ? (
                  <img
                    src={beer.image_url}
                    alt={beer.name}
                    className="w-full h-24 object-contain mb-3 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                    <BeerIcon className="w-8 h-8 text-amber-600/50" />
                  </div>
                )}
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {beer.name}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {beer.brewery}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
