import { X, Scale } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComparisonBar() {
  const { comparisonBeers, removeFromComparison, clearComparison } = useComparison();

  if (comparisonBeers.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-amber-100 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] z-50 safe-bottom"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white hidden md:inline">
              {comparisonBeers.length} bieren
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-[calc(100vw-200px)] md:max-w-2xl no-scrollbar mask-gradient-x">
            <AnimatePresence>
              {comparisonBeers.map((beer) => (
                <motion.div
                  key={beer.beer_url}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full shadow-sm flex-shrink-0"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap max-w-[100px] truncate">
                    {beer.name}
                  </span>
                  <button
                    onClick={() => removeFromComparison(beer.beer_url)}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearComparison}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors hidden sm:block"
            >
              Wis alles
            </button>
            <Link
              to="/compare"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Scale className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Vergelijk Nu</span>
              <span className="md:hidden">Vergelijk</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
