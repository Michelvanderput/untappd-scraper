import { useState, useRef } from 'react';
import { Shuffle, Sparkles, TrendingUp, Flame, Zap, Star, ExternalLink, Beer as BeerIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import type { BeerData, RandomizerMode } from '../types/beer';

interface BeerRandomizerProps {
  beers: BeerData[];
  onBeerSelect?: (beer: BeerData) => void;
}

const MODES = [
  { id: 'all' as RandomizerMode, label: 'Alles', icon: Shuffle, color: 'from-amber-500 to-orange-500' },
  { id: 'top-rated' as RandomizerMode, label: 'Top Rated', icon: Star, color: 'from-yellow-500 to-amber-500' },
  { id: 'high-abv' as RandomizerMode, label: 'High ABV', icon: Flame, color: 'from-red-500 to-orange-500' },
  { id: 'low-abv' as RandomizerMode, label: 'Session', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { id: 'high-ibu' as RandomizerMode, label: 'Bitter', icon: Zap, color: 'from-green-500 to-emerald-500' },
];

export default function BeerRandomizer({ beers, onBeerSelect }: BeerRandomizerProps) {
  const [currentBeer, setCurrentBeer] = useState<BeerData | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [mode, setMode] = useState<RandomizerMode>('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory] = useState<BeerData[]>([]);
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
    
    setIsRandomizing(true);
    setShowConfetti(false);
    
    const shuffledBeers: BeerData[] = [];
    for (let i = 0; i < 30; i++) {
      const randomIndex = Math.floor(Math.random() * filteredBeers.length);
      shuffledBeers.push(filteredBeers[randomIndex]);
    }
    
    const finalIndex = Math.floor(Math.random() * filteredBeers.length);
    const finalBeer = filteredBeers[finalIndex];
    
    const completeRandomization = () => {
      setCurrentBeer(finalBeer);
      setHistory(prev => [finalBeer, ...prev.slice(0, 4)]);
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
      
      tl.to(randomBeerRef.current, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out'
      });
      
      for (let i = 0; i < 15; i++) {
        tl.call(() => setCurrentBeer(shuffledBeers[i]), [], i * 0.06);
      }
      
      for (let i = 15; i < 25; i++) {
        tl.call(() => setCurrentBeer(shuffledBeers[i]), [], 0.9 + (i - 15) * 0.12);
      }
      
      for (let i = 25; i < 30; i++) {
        tl.call(() => setCurrentBeer(shuffledBeers[i]), [], 2.1 + (i - 25) * 0.25);
      }
      
      tl.to({}, { duration: 0.3 });
      
      tl.to(randomBeerRef.current, {
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)'
      });
    } else {
      // Fallback without animation if ref not available
      completeRandomization();
    }
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
              ? 'opacity-75 cursor-not-allowed' 
              : 'hover:shadow-amber-500/50 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700'
          }`}
        >
          <Shuffle className={`w-6 h-6 ${isRandomizing ? 'animate-spin' : ''}`} />
          {isRandomizing ? 'Aan het randomizen...' : 'Verras Me!'}
          {showConfetti && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-300" />
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
                {currentBeer.image_url ? (
                  <motion.img
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    src={currentBeer.image_url}
                    alt={currentBeer.name}
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center">
                    <BeerIcon className="w-24 h-24 text-amber-600" />
                  </div>
                )}
              </div>

              {/* Beer Info */}
              <div className="flex-1">
                <motion.h2
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold text-gray-800 mb-2 font-heading"
                >
                  {currentBeer.name}
                </motion.h2>
                
                {currentBeer.brewery && (
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-gray-600 mb-6"
                  >
                    {currentBeer.brewery}
                  </motion.p>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
                >
                  {currentBeer.style && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-1">Stijl</p>
                      <p className="font-semibold text-gray-800 text-sm">{currentBeer.style}</p>
                    </div>
                  )}
                  
                  {currentBeer.abv !== null && (
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-3 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">ABV</p>
                      <p className="font-bold text-amber-900 text-lg">{currentBeer.abv}%</p>
                    </div>
                  )}
                  
                  {currentBeer.ibu !== null && (
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-green-700 mb-1">IBU</p>
                      <p className="font-bold text-green-900 text-lg">{currentBeer.ibu}</p>
                    </div>
                  )}
                  
                  {currentBeer.rating !== null && (
                    <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl p-3 border border-yellow-200">
                      <p className="text-xs text-yellow-700 mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                        <p className="font-bold text-yellow-900 text-lg">
                          {currentBeer.rating.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentBeer.container && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100">
                      <p className="text-xs text-gray-500 mb-1">Verpakking</p>
                      <p className="font-semibold text-gray-800 text-sm">{currentBeer.container}</p>
                    </div>
                  )}
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-gray-500 mb-1">Categorie</p>
                    <p className="font-semibold text-gray-800 text-sm">{currentBeer.category}</p>
                  </div>
                </motion.div>

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
