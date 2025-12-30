import { useEffect, useRef, useState } from 'react';
import { X, Share2, Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { BeerData } from '../types/beer';
import { useSwipe } from '../hooks/useSwipe';
import { animateModalOpen, animateModalClose, animateCrossfade } from '../utils/animations';

interface BeerModalProps {
  beer: BeerData | null;
  allBeers: BeerData[];
  onClose: () => void;
  onNavigate: (beer: BeerData) => void;
}

export default function BeerModal({ beer, allBeers, onClose, onNavigate }: BeerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current beer index
  useEffect(() => {
    if (beer) {
      const index = allBeers.findIndex(b => b.beer_url === beer.beer_url);
      setCurrentIndex(index);
    }
  }, [beer, allBeers]);

  // Swipe gestures
  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => navigateNext(),
    onSwipeRight: () => navigatePrevious(),
  }, { threshold: 50 });

  // Open animation
  useEffect(() => {
    if (beer && modalRef.current && contentRef.current && overlayRef.current) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      animateModalOpen(overlayRef.current, contentRef.current);

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [beer]);

  const handleClose = () => {
    if (contentRef.current && overlayRef.current) {
      animateModalClose(overlayRef.current, contentRef.current, () => {
        document.body.style.overflow = '';
        onClose();
      });
    }
  };

  const navigateNext = () => {
    if (currentIndex < allBeers.length - 1) {
      const nextBeer = allBeers[currentIndex + 1];
      animateTransition('left', () => onNavigate(nextBeer));
    }
  };

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      const prevBeer = allBeers[currentIndex - 1];
      animateTransition('right', () => onNavigate(prevBeer));
    }
  };

  const animateTransition = (_direction: 'left' | 'right', callback: () => void) => {
    if (contentRef.current) {
      animateCrossfade(contentRef.current, callback);
    }
  };

  const handleShare = async () => {
    if (!beer) return;

    const shareData = {
      title: `${beer.name} - BeerMenu`,
      text: `Check out ${beer.name} by ${beer.brewery || 'Unknown'} - ${beer.style || ''} (${beer.abv}% ABV)`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert('Link gekopieerd naar klembord!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!beer) return null;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allBeers.length - 1;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] bg-amber-50 dark:bg-gray-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div
          ref={swipeRef}
          className="relative flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Header - Sticky */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={navigatePrevious}
                  disabled={!hasPrevious}
                  className={`p-2 rounded-xl transition-all ${
                    hasPrevious 
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
                      : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                  }`}
                  aria-label="Vorige bier"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-mono">
                  {currentIndex + 1} / {allBeers.length}
                </span>
                <button
                  onClick={navigateNext}
                  disabled={!hasNext}
                  className={`p-2 rounded-xl transition-all ${
                    hasNext 
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
                      : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                  }`}
                  aria-label="Volgende bier"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                  aria-label="Delen"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors"
                  aria-label="Sluiten"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
          </div>

          {/* Beer Content */}
          <div className="p-6 md:p-10 pb-24 md:pb-10">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Beer Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
                {beer.image_url ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <img
                      src={beer.image_url}
                      alt={beer.name}
                      className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl z-10 transform transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center shadow-inner">
                    <Star className="w-32 h-32 text-amber-600/40 dark:text-amber-400/40" />
                  </div>
                )}
              </div>

              {/* Beer Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-8">
                    <h2 className="text-4xl md:text-5xl font-heading text-gray-900 dark:text-white mb-2 leading-tight">
                    {beer.name}
                    </h2>
                    
                    {beer.brewery && (
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
                        {beer.brewery}
                    </p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {beer.style && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Stijl</p>
                      <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{beer.style}</p>
                    </div>
                  )}
                  
                  {beer.abv !== null && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/20">
                      <p className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">ABV</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{beer.abv}%</p>
                    </div>
                  )}
                  
                  {beer.ibu !== null && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/20">
                      <p className="text-xs text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">IBU</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{beer.ibu}</p>
                    </div>
                  )}
                  
                  {beer.rating !== null && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl shadow-sm border border-yellow-100 dark:border-yellow-900/20 col-span-2 md:col-span-1">
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-1">Rating</p>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {beer.rating.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                        {beer.category}
                    </span>
                    {beer.subcategory && (
                        <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
                        {beer.subcategory}
                        </span>
                    )}
                    {beer.container && (
                        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                            {beer.container}
                        </span>
                    )}
                </div>

                <a 
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full md:w-auto items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/30 active:scale-95"
                >
                    Bekijk op Untappd
                    <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Swipe Hint Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none md:hidden" />
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-medium text-gray-400 dark:text-gray-500 pointer-events-none md:hidden">
            ← Swipe om te navigeren →
        </div>
      </div>
    </div>
  );
}
