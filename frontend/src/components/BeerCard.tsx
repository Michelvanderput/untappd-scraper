import { Beer, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BeerData } from '../types/beer';

interface BeerCardProps {
  beer: BeerData;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function BeerCard({ beer, onClick, isFavorite, onToggleFavorite }: BeerCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-brand-white dark:bg-brand-gray-dark border-2 border-brand-border dark:border-brand-border hover:border-brand-accent dark:hover:border-brand-accent transition-all cursor-pointer p-6 relative group"
    >
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-brand-white dark:bg-brand-gray-dark border border-brand-border dark:border-brand-border hover:border-brand-accent transition-colors"
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
            src={beer.image_url}
            alt={beer.name}
            loading="lazy"
            className="w-20 h-20 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-brand-cream dark:bg-brand-gray-dark border border-brand-border dark:border-brand-border flex items-center justify-center flex-shrink-0">
            <Beer className="w-10 h-10 text-amber-600 dark:text-amber-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-bold text-brand-black dark:text-brand-text-primary mb-1 truncate group-hover:text-brand-accent transition-colors text-wrap uppercase tracking-tight text-sm">
            {beer.name}
          </h3>
          {beer.brewery && (
            <p className="text-sm text-brand-text-secondary dark:text-brand-text-secondary mb-2 truncate">
              {beer.brewery}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {beer.abv !== null && (
              <span className="px-2 py-1 bg-brand-cream dark:bg-brand-gray-dark text-brand-black dark:text-brand-text-primary border border-brand-border dark:border-brand-border font-medium text-xs">
                {beer.abv}%
              </span>
            )}
            {beer.rating !== null && (
              <div className="flex items-center gap-1 px-2 py-1 bg-brand-cream dark:bg-brand-gray-dark border border-brand-border dark:border-brand-border">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-gray-700 dark:text-yellow-200 font-medium">
                  {beer.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
