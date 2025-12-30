import { useRef, useEffect } from 'react';
import { Beer, Star } from 'lucide-react';
import gsap from 'gsap';
import type { BeerData } from '../types/beer';
import { ANIMATION_CONFIG } from '../utils/animations';

interface BeerCardProps {
  beer: BeerData;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function BeerCard({ beer, onClick, isFavorite, onToggleFavorite }: BeerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -4,
        scale: 1.01,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
      
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          scale: 1.05,
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.ease.smooth,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
      
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          scale: 1,
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.ease.smooth,
        });
      }
    };

    const handleTouchStart = () => {
      gsap.to(card, {
        scale: 0.98,
        duration: ANIMATION_CONFIG.duration.fast,
        ease: ANIMATION_CONFIG.ease.snappy,
      });
    };

    const handleTouchEnd = () => {
      gsap.to(card, {
        scale: 1,
        duration: ANIMATION_CONFIG.duration.fast,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchend', handleTouchEnd);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchend', handleTouchEnd);
      gsap.killTweensOf(card);
      if (imageRef.current) {
        gsap.killTweensOf(imageRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    onClick();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer p-6 border border-amber-100/50 dark:border-amber-900/30 relative group"
    >
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 dark:bg-amber-950/60 hover:bg-white dark:hover:bg-amber-950/80 transition-all active:scale-90"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 dark:text-gray-500'
            }`}
          />
        </button>
      )}

      <div className="flex gap-4">
        {beer.image_url ? (
          <img
            ref={imageRef as React.RefObject<HTMLImageElement>}
            src={beer.image_url}
            alt={beer.name}
            loading="lazy"
            className="w-20 h-20 object-contain flex-shrink-0 transition-transform"
          />
        ) : (
          <div
            ref={imageRef as React.RefObject<HTMLDivElement>}
            className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform"
          >
            <Beer className="w-10 h-10 text-amber-600 dark:text-amber-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 dark:text-amber-100 mb-1 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-wrap">
            {beer.name}
          </h3>
          {beer.brewery && (
            <p className="text-sm text-gray-600 dark:text-amber-200/70 mb-2 truncate">
              {beer.brewery}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {beer.abv !== null && (
              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-md font-medium">
                {beer.abv}%
              </span>
            )}
            {beer.rating !== null && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-gray-700 dark:text-yellow-200 font-medium">
                  {beer.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
