import { useEffect, useRef, useState } from 'react';
import { X, Share2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
        className="relative w-full h-full md:h-auto md:max-w-lg md:max-h-[90vh] bg-white dark:bg-gray-900 md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div
          ref={swipeRef}
          className="relative flex-1 overflow-y-auto overscroll-contain flex flex-col"
        >
          {/* Close Button - Absolute */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-30 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-md rounded-full text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Section - Compact */}
          <div className="relative h-48 shrink-0 bg-gradient-to-b from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
            {/* Navigation Arrows (Absolute) */}
            <button
              onClick={(e) => { e.stopPropagation(); navigatePrevious(); }}
              disabled={!hasPrevious}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-full transition-all hidden md:block ${
                !hasPrevious ? 'opacity-0 pointer-events-none' : 'text-gray-600 dark:text-gray-300 hover:scale-110'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateNext(); }}
              disabled={!hasNext}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-full transition-all hidden md:block ${
                !hasNext ? 'opacity-0 pointer-events-none' : 'text-gray-600 dark:text-gray-300 hover:scale-110'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {beer.image_url ? (
                <img
                  src={beer.image_url}
                  alt={beer.name}
                  className="h-full w-auto object-contain drop-shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center">
                  <Star className="w-10 h-10 text-amber-500" />
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 p-6 bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading leading-tight mb-1">
                {beer.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {beer.brewery}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400 font-mono">
                <span>{currentIndex + 1} / {allBeers.length}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center border border-amber-100 dark:border-amber-900/30">
                <span className="block text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-500 font-bold mb-0.5">ABV</span>
                <span className="block font-bold text-gray-900 dark:text-white text-sm">{beer.abv ? `${beer.abv}%` : '-'}</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2 text-center border border-green-100 dark:border-green-900/30">
                <span className="block text-[10px] uppercase tracking-wider text-green-800 dark:text-green-500 font-bold mb-0.5">IBU</span>
                <span className="block font-bold text-gray-900 dark:text-white text-sm">{beer.ibu || '-'}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-900/30">
                <span className="block text-[10px] uppercase tracking-wider text-blue-800 dark:text-blue-500 font-bold mb-0.5">Stijl</span>
                <span className="block font-bold text-gray-900 dark:text-white text-xs truncate leading-tight">{beer.style || beer.category}</span>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2 text-center border border-yellow-100 dark:border-yellow-900/30">
                <span className="block text-[10px] uppercase tracking-wider text-yellow-800 dark:text-yellow-500 font-bold mb-0.5">Rating</span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{beer.rating?.toFixed(2) || '-'}</span>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-auto">
              <a
                href={beer.beer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#ffc000] hover:bg-[#ffd000] text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <img src="https://untappd.com/assets/images/badges/app-icon.png" alt="" className="w-5 h-5 rounded" />
                <span>Check-in op Untappd</span>
              </a>

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-600 dark:text-gray-300 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Delen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
