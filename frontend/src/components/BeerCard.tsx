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
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer p-6 border border-amber-100/50 relative group"
    >
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'
            }`}
          />
        </button>
      )}

      <div className="flex gap-4">
        {beer.image_url ? (
          <img
            src={beer.image_url}
            alt={beer.name}
            className="w-20 h-20 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Beer className="w-10 h-10 text-amber-600" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 mb-1 truncate group-hover:text-amber-600 transition-colors">
            {beer.name}
          </h3>
          {beer.brewery && (
            <p className="text-sm text-gray-600 mb-2 truncate">
              {beer.brewery}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {beer.abv !== null && (
              <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md font-medium">
                {beer.abv}%
              </span>
            )}
            {beer.rating !== null && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-md">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-gray-700 font-medium">
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
