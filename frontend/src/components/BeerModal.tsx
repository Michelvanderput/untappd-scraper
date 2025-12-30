import { useEffect, useRef, useState } from 'react';
import { X, Share2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import type { BeerData } from '../types/beer';
import { useSwipe } from '../hooks/useSwipe';

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

      const timeline = gsap.timeline();
      
      timeline
        .fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          contentRef.current,
          { opacity: 0, scale: 0.9, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' },
          '-=0.2'
        );

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [beer]);

  const handleClose = () => {
    if (contentRef.current && overlayRef.current) {
      const timeline = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = '';
          onClose();
        }
      });

      timeline
        .to(contentRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 50,
          duration: 0.3,
          ease: 'power2.in'
        })
        .to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in'
        }, '-=0.1');
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
      // Smooth crossfade transition
      gsap.to(contentRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: 'power1.inOut',
        onComplete: () => {
          callback();
          if (contentRef.current) {
            // Fade in new content
            gsap.fromTo(
              contentRef.current,
              { 
                opacity: 0
              },
              { 
                opacity: 1,
                duration: 0.15,
                ease: 'power1.inOut'
              }
            );
          }
        }
      });
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div
          ref={swipeRef}
          className="relative flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {hasPrevious && (
                  <button
                    onClick={navigatePrevious}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                    aria-label="Vorige bier"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} / {allBeers.length}
                </span>
                {hasNext && (
                  <button
                    onClick={navigateNext}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                    aria-label="Volgende bier"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                  aria-label="Delen"
                >
                  <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                  aria-label="Sluiten"
                >
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Beer Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Beer Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                {beer.image_url ? (
                  <img
                    src={beer.image_url}
                    alt={beer.name}
                    className="w-64 h-64 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg flex items-center justify-center">
                    <Star className="w-32 h-32 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>

              {/* Beer Info */}
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {beer.name}
                </h2>
                
                {beer.brewery && (
                  <p className="text-2xl text-gray-600 dark:text-gray-300 mb-6">
                    {beer.brewery}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  {beer.style && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stijl</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{beer.style}</p>
                    </div>
                  )}
                  
                  {beer.abv !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ABV</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{beer.abv}%</p>
                    </div>
                  )}
                  
                  {beer.ibu !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">IBU</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{beer.ibu}</p>
                    </div>
                  )}
                  
                  {beer.rating !== null && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {beer.rating.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {beer.container && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Verpakking</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{beer.container}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Categorie</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{beer.category}</p>
                  </div>
                </div>

                {beer.subcategory && (
                  <div className="mb-6">
                    <span className="inline-block bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-full text-sm font-medium">
                      {beer.subcategory}
                    </span>
                  </div>
                )}

                {/* Share Button - Mobile */}
                <button
                  onClick={handleShare}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 shadow-lg"
                >
                  <Share2 className="w-5 h-5" />
                  Deel dit bier
                </button>
              </div>
            </div>
          </div>

          {/* Swipe Hint */}
          <div className="text-center pb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>← Swipe om te navigeren →</p>
          </div>
        </div>
      </div>
    </div>
  );
}
