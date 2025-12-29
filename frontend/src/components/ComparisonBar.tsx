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
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {comparisonBeers.length} bieren geselecteerd
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl">
            <AnimatePresence>
              {comparisonBeers.map((beer) => (
                <motion.div
                  key={beer.beer_url}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {beer.name}
                  </span>
                  <button
                    onClick={() => removeFromComparison(beer.beer_url)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/compare"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Vergelijk
            </Link>
            <button
              onClick={clearComparison}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Wis alles
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
