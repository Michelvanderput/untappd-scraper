import { useComparison } from '../contexts/ComparisonContext';
import { Beer, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ComparePage() {
  const { comparisonBeers, clearComparison } = useComparison();

  if (comparisonBeers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Geen bieren geselecteerd
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Selecteer minimaal 2 bieren om te vergelijken
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug naar bieren
          </Link>
        </div>
      </div>
    );
  }

  const attributes = [
    { key: 'brewery', label: 'Brouwerij' },
    { key: 'style', label: 'Stijl' },
    { key: 'abv', label: 'ABV', suffix: '%' },
    { key: 'ibu', label: 'IBU' },
    { key: 'rating', label: 'Rating' },
    { key: 'container', label: 'Verpakking' },
    { key: 'category', label: 'Categorie' },
    { key: 'subcategory', label: 'Subcategorie' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </Link>
          <button
            onClick={clearComparison}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Wis vergelijking
          </button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center"
        >
          Bier Vergelijking
        </motion.h1>

        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                  Eigenschap
                </th>
                {comparisonBeers.map((beer) => (
                  <th key={beer.beer_url} className="p-4 text-center min-w-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      {beer.image_url ? (
                        <img
                          src={beer.image_url}
                          alt={beer.name}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg flex items-center justify-center">
                          <Beer className="w-10 h-10 text-amber-600" />
                        </div>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {beer.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, index) => {
                const values = comparisonBeers.map(beer => beer[attr.key as keyof typeof beer]);
                const isNumeric = attr.key === 'abv' || attr.key === 'ibu' || attr.key === 'rating';
                
                let maxValue: number | null = null;
                let minValue: number | null = null;
                
                if (isNumeric) {
                  const numericValues = values.filter(v => v !== null && v !== undefined) as number[];
                  if (numericValues.length > 0) {
                    maxValue = Math.max(...numericValues);
                    minValue = Math.min(...numericValues);
                  }
                }

                return (
                  <motion.tr
                    key={attr.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                      {attr.label}
                    </td>
                    {comparisonBeers.map((beer) => {
                      const value = beer[attr.key as keyof typeof beer];
                      const displayValue = value !== null && value !== undefined
                        ? `${value}${attr.suffix || ''}`
                        : '-';
                      
                      const isMax = isNumeric && value === maxValue && maxValue !== minValue;
                      const isMin = isNumeric && value === minValue && maxValue !== minValue;

                      return (
                        <td
                          key={beer.beer_url}
                          className={`p-4 text-center ${
                            isMax ? 'bg-green-50 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400' :
                            isMin ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                            'text-gray-900 dark:text-white'
                          }`}
                        >
                          {attr.key === 'rating' && value ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              {displayValue}
                            </div>
                          ) : (
                            displayValue
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>💚 Groen = Hoogste waarde | ❤️ Rood = Laagste waarde</p>
        </div>
      </div>
    </div>
  );
}
