import { X, Scale } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useComparison } from '../contexts/ComparisonContext';
import { usePresence } from '../lib/usePresence';

/**
 * Floating tray with the beers picked for comparison. Sits above the mobile tab bar.
 */
export default function ComparisonBar() {
  const { comparisonBeers, removeFromComparison } = useComparison();
  const location = useLocation();
  const visible = comparisonBeers.length > 0 && location.pathname !== '/compare';
  const { mounted, state } = usePresence(visible);

  return (
    <>
      {mounted && (
        <div
          data-state={state}
          className="dock fixed z-40 inset-x-3 md:inset-x-auto md:right-6 md:w-[420px] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6"
        >
          <div className="flex items-center gap-2 p-2 pl-3 rounded-full bg-surface/90 backdrop-blur-xl border border-line/10 shadow-2xl">
            <Scale className="w-4 h-4 text-gold shrink-0" aria-hidden />
            <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar mask-fade-x">
              {comparisonBeers.map((beer) => (
                  <span
                    key={beer.beer_url}
                    className="enter-pop shrink-0 inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full bg-line/10 text-sm"
                  >
                    <span className="max-w-[90px] truncate">{beer.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFromComparison(beer.beer_url)}
                      className="grid place-items-center w-7 h-7 rounded-full hover:bg-line/10"
                      aria-label={`${beer.name} uit vergelijking halen`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
              ))}
            </div>
            <Link to="/compare" className="btn-primary min-h-[40px] h-10 px-4 text-sm shrink-0">
              Vergelijk <span className="tabular">{comparisonBeers.length}</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
