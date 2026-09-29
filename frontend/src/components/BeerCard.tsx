import { memo, useState } from 'react';
import { Beer, Star } from 'lucide-react';
import type { BeerData } from '../types/beer';

interface BeerCardProps {
  beer: BeerData;
  onClick: () => void;
  /** Larger variant, used in the menu builder reveal */
  size?: 'default' | 'large';
}

function BeerCard({ beer, onClick, size = 'default' }: BeerCardProps) {
  const [broken, setBroken] = useState(false);
  const large = size === 'large';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full h-full text-left surface overflow-hidden flex flex-col transition-[transform,border-color] duration-300 ease-out-expo hover:-translate-y-1 hover:border-gold/30 active:scale-[0.98]"
    >
      <div className={`relative bg-surface-2/60 grid place-items-center ${large ? 'h-64' : 'h-32 sm:h-40'}`}>
        {beer.image_url && !broken ? (
          <img
            src={beer.image_url}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className={`object-contain rounded-xl drop-shadow-xl transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:-rotate-3 ${
              large ? 'h-48 w-48' : 'h-20 w-20 sm:h-28 sm:w-28'
            }`}
          />
        ) : (
          <Beer className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-muted/60`} aria-hidden />
        )}

        {beer.rating != null && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-bg/80 backdrop-blur text-xs font-medium tabular">
            <Star className="w-3 h-3 text-gold fill-gold" aria-hidden />
            {beer.rating.toFixed(1)}
            <span className="sr-only"> sterren</span>
          </span>
        )}
        {beer.abv != null && (
          <span className="absolute top-2.5 right-2.5 h-6 px-2 inline-flex items-center rounded-full bg-bg/80 backdrop-blur text-xs font-medium tabular text-ember">
            {beer.abv}%
          </span>
        )}
      </div>

      <div className={`flex-1 flex flex-col ${large ? 'p-5' : 'p-3 sm:p-4'}`}>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted truncate mb-1">{beer.style || beer.category}</p>
        <h3
          className={`leading-tight line-clamp-2 transition-colors group-hover:text-gold ${
            large ? 'font-display italic font-extrabold text-3xl' : 'font-medium text-[15px]'
          }`}
        >
          {beer.name}
        </h3>
        {beer.brewery && <p className={`text-muted truncate mt-1 ${large ? 'text-base' : 'text-xs'}`}>{beer.brewery}</p>}
      </div>
    </button>
  );
}

export default memo(BeerCard);
