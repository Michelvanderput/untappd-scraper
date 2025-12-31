import { useState, useRef } from 'react';
import { Shuffle, Sparkles, TrendingUp, Flame, Zap, Star, ExternalLink, Beer as BeerIcon, X } from 'lucide-react';
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
  { id: 'high-abv' as RandomizerMode, label: 'Sterk', icon: Flame, color: 'from-red-500 to-orange-500' },
  { id: 'low-abv' as RandomizerMode, label: 'Licht', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { id: 'high-ibu' as RandomizerMode, label: 'Bitter', icon: Zap, color: 'from-green-500 to-emerald-500' },
];

export default function BeerRandomizer({ beers, onBeerSelect }: BeerRandomizerProps) {
  const [currentBeer, setCurrentBeer] = useState<BeerData | null>(null);
  const [history, setHistory] = useState<BeerData[]>([]);
  const [mode, setMode] = useState<RandomizerMode>('all');
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        opacity: 0,
        duration: 1.5 + Math.random(),
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
    setCurrentBeer(finalBeer);
    setShowModal(true);
    setIsRandomizing(true);
    
    // Small delay to allow modal to render
    setTimeout(() => {
        runRevealAnimation(finalBeer);
    }, 100);
  };

  const runRevealAnimation = (beer: BeerData) => {
    if (!modalRef.current) return;
    
    // Reset elements for animation
    gsap.set('.reveal-item', { opacity: 0, y: 20, scale: 0.9 });
    
    const tl = gsap.timeline({
      onComplete: () => {
        setHistory(prev => {
            if (prev.some(b => b.beer_url === beer.beer_url)) return prev;
            return [beer, ...prev.slice(0, 4)];
        });
        setIsRandomizing(false);
        createConfetti();
        if (onBeerSelect) onBeerSelect(beer);
      }
    });
    
    // Reveal each step sequentially
    // Style -> Rating -> ABV -> IBU -> Image -> Name
    const steps = [
        '.reveal-style', 
        '.reveal-rating', 
        '.reveal-abv', 
        '.reveal-ibu', 
        '.reveal-image', 
        '.reveal-name'
    ];
    
    steps.forEach((selector, index) => {
        // Slower animation: 0.8s duration, staggered by 1.2s
        tl.to(selector, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.2)'
        }, index * 1.2); 
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentBeer(null);
    setIsRandomizing(false);
  };

  return (
    <div className="space-y-8" ref={containerRef}>
      {/* Mode Selection */}
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
        </motion.button>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showModal && currentBeer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!isRandomizing ? closeModal : undefined}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                
                {/* Modal Content */}
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header with Close Button */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 text-amber-500 font-bold">
                            <Sparkles className="w-5 h-5" />
                            <span>Surprise!</span>
                        </div>
                        <button 
                            onClick={closeModal}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                        {/* 1. Stats Grid (Top-Left to Bottom-Right) */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {/* Style (Top-Left) */}
                            <div className="reveal-item reveal-style bg-gray-800/90 dark:bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500 shadow-lg opacity-0 transform translate-y-4">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Stijl</p>
                                <p className="text-white font-bold text-sm leading-tight">{currentBeer.style || currentBeer.category}</p>
                            </div>

                            {/* Rating (Top-Right) */}
                            <div className="reveal-item reveal-rating bg-gray-800/90 dark:bg-gray-800 p-4 rounded-xl border-l-4 border-yellow-500 shadow-lg opacity-0 transform translate-y-4">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Rating</p>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-white font-bold text-lg">{currentBeer.rating?.toFixed(2) || 'N/A'}</span>
                                </div>
                            </div>

                            {/* ABV (Bottom-Left) */}
                            <div className="reveal-item reveal-abv bg-gray-800/90 dark:bg-gray-800 p-4 rounded-xl border-l-4 border-red-500 shadow-lg opacity-0 transform translate-y-4">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">ABV</p>
                                <p className="text-white font-bold text-lg">{currentBeer.abv}%</p>
                            </div>

                            {/* IBU (Bottom-Right) */}
                            <div className="reveal-item reveal-ibu bg-gray-800/90 dark:bg-gray-800 p-4 rounded-xl border-l-4 border-green-500 shadow-lg opacity-0 transform translate-y-4">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">IBU</p>
                                <p className="text-white font-bold text-lg">{currentBeer.ibu || 'N/A'}</p>
                            </div>
                        </div>

                        {/* 2. Beer Image (Center) */}
                        <div className="reveal-item reveal-image flex justify-center mb-6 opacity-0 transform translate-y-4 scale-90">
                            {currentBeer.image_url ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                                    <img 
                                        src={currentBeer.image_url} 
                                        alt={currentBeer.name}
                                        className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl"
                                    />
                                </div>
                            ) : (
                                <div className="w-40 h-40 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center relative z-10">
                                    <BeerIcon className="w-20 h-20 text-gray-300 dark:text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* 3. Name & Brewery (Bottom) */}
                        <div className="reveal-item reveal-name text-center opacity-0 transform translate-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">{currentBeer.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">{currentBeer.brewery}</p>
                            
                            <a
                                href={currentBeer.beer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-amber-500/30"
                            >
                                Bekijk op Untappd
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                    
                    {/* Confetti Container inside Modal */}
                    <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />
                </motion.div>
            </div>
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
                   setShowModal(true);
                   // Immediate reveal for history items
                   setTimeout(() => {
                        gsap.set('.reveal-item', { opacity: 1, y: 0, scale: 1 });
                   }, 50);
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
