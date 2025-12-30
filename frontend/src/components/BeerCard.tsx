import { useRef, useEffect } from 'react';
import { Beer, Star, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import type { BeerData } from '../types/beer';
import { ANIMATION_CONFIG, createRipple } from '../utils/animations';

interface BeerCardProps {
  beer: BeerData;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function BeerCard({ beer, onClick, isFavorite, onToggleFavorite }: BeerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      // Card lift and scale
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2), 0 10px 20px rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
      
      // Image zoom and rotation
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          scale: 1.1,
          rotation: 5,
          duration: ANIMATION_CONFIG.duration.slow,
          ease: ANIMATION_CONFIG.ease.elastic,
        });
      }

      // Glow effect
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          opacity: 1,
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.ease.smooth,
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderColor: 'rgba(254, 243, 199, 0.5)', // amber-100/50
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
      
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          scale: 1,
          rotation: 0,
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.ease.smooth,
        });
      }

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          opacity: 0,
          duration: ANIMATION_CONFIG.duration.normal,
          ease: ANIMATION_CONFIG.ease.smooth,
        });
      }
    };

    const handleTouchStart = () => {
      gsap.to(card, {
        scale: 0.97,
        duration: ANIMATION_CONFIG.duration.instant,
        ease: ANIMATION_CONFIG.ease.snappy,
      });
    };

    const handleTouchEnd = () => {
      gsap.to(card, {
        scale: 1,
        duration: ANIMATION_CONFIG.duration.fast,
        ease: ANIMATION_CONFIG.ease.bounce,
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
      if (imageRef.current) gsap.killTweensOf(imageRef.current);
      if (glowRef.current) gsap.killTweensOf(glowRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (cardRef.current) {
      createRipple(e.nativeEvent, cardRef.current);
    }
    onClick();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite && starRef.current) {
      // Animate star
      gsap.to(starRef.current, {
        scale: 1.5,
        rotation: isFavorite ? 0 : 360,
        duration: 0.4,
        ease: ANIMATION_CONFIG.ease.bounce,
        onComplete: () => {
          gsap.to(starRef.current, {
            scale: 1,
            rotation: 0,
            duration: 0.2,
            ease: ANIMATION_CONFIG.ease.smooth,
          });
        }
      });
      onToggleFavorite();
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="glass-panel group relative flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer transition-colors border border-amber-100/50 dark:border-amber-800/30"
    >
      {/* Glow effect overlay */}
      <div 
        ref={glowRef}
        className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-transparent opacity-0 pointer-events-none z-0"
      />

      {/* Top Section with Image and Badges */}
      <div className="relative p-4 flex-grow z-10">
        <div className="flex justify-between items-start mb-2">
            {/* Badges Container */}
            <div className="flex flex-wrap gap-1.5 max-w-[calc(100%-70px)]">
                {beer.abv !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-md backdrop-blur-sm">
                    {beer.abv}%
                </span>
                )}
                {beer.ibu !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-md backdrop-blur-sm">
                    {beer.ibu} IBU
                </span>
                )}
            </div>

            <div className="flex items-center -mr-1 -mt-1">
                {/* Untappd Link */}
                <a
                    href={beer.beer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20 group/link"
                    title="Bekijk op Untappd"
                >
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover/link:text-amber-600 dark:group-hover/link:text-amber-400 transition-colors" />
                </a>

                {/* Favorite Button */}
                {onToggleFavorite && (
                <button
                    ref={starRef}
                    onClick={handleFavoriteClick}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20"
                >
                    <Star
                    className={`w-4 h-4 transition-all duration-300 ${
                        isFavorite 
                        ? 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500'
                    }`}
                    />
                </button>
                )}
            </div>
        </div>

        <div className="flex flex-col items-center text-center">
            {beer.image_url ? (
            <div className="relative w-24 h-24 mb-3 filter drop-shadow-lg">
                <img
                ref={imageRef as React.RefObject<HTMLImageElement>}
                src={beer.image_url}
                alt={beer.name}
                loading="lazy"
                className="w-full h-full object-contain"
                />
            </div>
            ) : (
            <div
                ref={imageRef as React.RefObject<HTMLDivElement>}
                className="w-24 h-24 mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-xl flex items-center justify-center shadow-inner"
            >
                <Beer className="w-10 h-10 text-amber-600 dark:text-amber-500 opacity-80" />
            </div>
            )}

            <h3 className="font-heading text-lg leading-tight text-gray-900 dark:text-amber-50 mb-1 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {beer.name}
            </h3>
            
            {beer.brewery && (
            <p className="text-xs font-medium text-gray-500 dark:text-amber-200/60 mb-2 line-clamp-1">
                {beer.brewery}
            </p>
            )}

            <div className="flex items-center justify-center gap-2 mt-auto">
                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full truncate max-w-[120px]">
                    {beer.style || beer.category}
                </span>
                
                {beer.rating !== null && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-yellow-200">
                        {beer.rating.toFixed(1)}
                    </span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Bottom Action Hint */}
      <div className="relative px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/10 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
        <span>Bekijk details</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-4px] group-hover:translate-x-0" />
      </div>
    </div>
  );
}
