import { useComparison } from '../contexts/ComparisonContext';
import { Beer, Star, ArrowLeft, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';

export default function ComparePage() {
  const { comparisonBeers, clearComparison, removeFromComparison } = useComparison();

  if (comparisonBeers.length === 0) {
    return (
      <PageLayout title="Vergelijken" subtitle="Vergelijk je favoriete bieren">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
            <Beer className="w-12 h-12 text-amber-600 dark:text-amber-500 opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
            Geen bieren geselecteerd
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Selecteer minimaal 2 bieren uit de lijst om ze naast elkaar te vergelijken.
          </p>
          <Link
            to="/"
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug naar bieren
          </Link>
        </div>
      </PageLayout>
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
    <PageLayout title="Bier Vergelijking" subtitle={`Je vergelijkt ${comparisonBeers.length} bieren`}>
      <div className="mb-8 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Meer bieren toevoegen
        </Link>
        <button
          onClick={clearComparison}
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Alles wissen
        </button>
      </div>

      <Card className="overflow-hidden border-none shadow-xl" hoverable={false}>
        <div className="overflow-x-auto relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="p-6 text-left font-bold text-gray-900 dark:text-white sticky left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm min-w-[150px] z-20 shadow-[2px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_10px_rgba(0,0,0,0.2)]">
                  Eigenschap
                </th>
                {comparisonBeers.map((beer) => (
                  <th key={beer.beer_url} className="p-6 min-w-[240px] relative group">
                    <button
                      onClick={() => removeFromComparison(beer.beer_url)}
                      className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      title="Verwijder uit vergelijking"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center gap-4">
                      {beer.image_url ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <img
                            src={beer.image_url}
                            alt={beer.name}
                            className="w-24 h-24 object-contain relative z-10 transition-transform group-hover:scale-110 duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-2xl flex items-center justify-center">
                          <Beer className="w-10 h-10 text-amber-600/50" />
                        </div>
                      )}
                      <div className="text-center">
                        <a 
                          href={beer.beer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group/link"
                        >
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1 group-hover/link:underline decoration-amber-500/50 underline-offset-4">
                            {beer.name}
                          </h3>
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {beer.brewery}
                        </p>
                      </div>
                    </div>
                  </th>
                ))}
                {comparisonBeers.length < 4 && (
                  <th className="p-6 min-w-[200px] border-l border-dashed border-gray-200 dark:border-gray-700/50">
                    <Link 
                      to="/"
                      className="flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-amber-500 transition-colors h-full min-h-[160px] group"
                    >
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                        <Plus className="w-8 h-8" />
                      </div>
                      <span className="font-medium">Voeg toe</span>
                    </Link>
                  </th>
                )}
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
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-6 font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10 shadow-[2px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_10px_rgba(0,0,0,0.2)]">
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
                          className="p-6 text-center"
                        >
                          <div className={`
                            inline-flex items-center justify-center px-4 py-2 rounded-xl transition-all
                            ${isMax ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold shadow-sm' : ''}
                            ${isMin ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : ''}
                            ${!isMax && !isMin ? 'text-gray-700 dark:text-gray-300' : ''}
                          `}>
                            {attr.key === 'rating' && value ? (
                              <div className="flex items-center gap-1.5">
                                <Star className={`w-4 h-4 ${isMax ? 'fill-green-600 text-green-600' : 'fill-yellow-400 text-yellow-400'}`} />
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </div>
                            ) : (
                              displayValue
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {comparisonBeers.length < 4 && <td className="border-l border-dashed border-gray-200 dark:border-gray-700/50" />}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-8 flex justify-center gap-6 text-sm font-medium">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          Hoogste waarde
        </div>
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Laagste waarde
        </div>
      </div>
    </PageLayout>
  );
}
