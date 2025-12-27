import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, Share2, Shuffle, Wine, Map, PartyPopper, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BeerData } from '../types/beer';
import { generateBeerMenu, generatePairingSuggestions, type GeneratedMenu, type MenuGenerationOptions } from '../utils/beerPairing';
import BeerCard from '../components/BeerCard';

const GENERATION_MODES = [
  { 
    id: 'random' as const, 
    label: 'Volledig Random', 
    icon: Shuffle, 
    description: 'Laat het lot beslissen!',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'balanced' as const, 
    label: 'Gebalanceerd', 
    icon: Sparkles, 
    description: 'Mix van alle stijlen',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'journey' as const, 
    label: 'Smaak Reis', 
    icon: Map, 
    description: 'Van licht naar zwaar',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'party' as const, 
    label: 'Party Mode', 
    icon: PartyPopper, 
    description: 'Crowd pleasers!',
    color: 'from-orange-500 to-red-500'
  },
  { 
    id: 'expert' as const, 
    label: 'Expert Level', 
    icon: GraduationCap, 
    description: 'Voor kenners',
    color: 'from-amber-500 to-yellow-500'
  },
];

export default function MenuBuilderPage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [menuSize, setMenuSize] = useState(6);
  const [mode, setMode] = useState<'random' | 'balanced' | 'journey' | 'party' | 'expert'>('balanced');
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [minABV, setMinABV] = useState<number | undefined>(undefined);
  const [maxABV, setMaxABV] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        let response;
        try {
          response = await fetch('/api/beers');
        } catch {
          response = await fetch('/beers.json');
        }
        
        const data = await response.json();
        setBeers(data.beers || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch beers:', error);
        setLoading(false);
      }
    };

    fetchBeers();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    
    // Simulate generation delay for effect
    setTimeout(() => {
      const options: MenuGenerationOptions = {
        size: menuSize,
        mode,
        preferences: {
          minABV,
          maxABV,
          minRating,
        },
      };

      const menu = generateBeerMenu(beers, options);
      setGeneratedMenu(menu);
      setGenerating(false);
    }, 800);
  };

  const handleExport = () => {
    if (!generatedMenu) return;

    const text = `
🍺 ${generatedMenu.theme}
${generatedMenu.description}

Bieren:
${generatedMenu.beers.map((beer, i) => 
  `${i + 1}. ${beer.name} - ${beer.brewery}
   ${beer.abv}% ABV ${beer.ibu ? `| ${beer.ibu} IBU` : ''} | ⭐ ${beer.rating?.toFixed(2)}
   ${beer.style}`
).join('\n\n')}

${generatedMenu.pairingNotes ? '\nTips:\n' + generatedMenu.pairingNotes.join('\n') : ''}

${generatePairingSuggestions(generatedMenu).join('\n')}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beer-menu-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!generatedMenu) return;

    const text = `Check mijn bier menu: ${generatedMenu.theme}\n${generatedMenu.beers.map(b => b.name).join(', ')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Menu gekopieerd naar clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-16 h-16 text-amber-600 animate-bounce mx-auto mb-4" />
          <p className="text-xl text-gray-700">Menu Builder laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4 font-heading">
            🍺 Bier Menu Builder
          </h1>
          <p className="text-xl text-gray-600">
            Stel je perfecte bier menu samen met slimme algoritmes!
          </p>
        </motion.div>

        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-amber-100"
        >
          {/* Menu Size Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Aantal Bieren</h3>
              <span className="text-3xl font-bold text-amber-600">{menuSize}</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              value={menuSize}
              onChange={(e) => setMenuSize(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(249 115 22) ${((menuSize - 3) / 9) * 100}%, rgb(254 215 170) ${((menuSize - 3) / 9) * 100}%, rgb(254 215 170) 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>3 bieren</span>
              <span>12 bieren</span>
            </div>
          </div>

          {/* Generation Mode */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Generatie Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {GENERATION_MODES.map(modeOption => {
                const Icon = modeOption.icon;
                return (
                  <button
                    key={modeOption.id}
                    onClick={() => setMode(modeOption.id)}
                    className={`p-4 rounded-xl transition-all ${
                      mode === modeOption.id
                        ? `bg-gradient-to-r ${modeOption.color} text-white shadow-lg scale-105`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold mb-1">{modeOption.label}</p>
                    <p className="text-xs opacity-90">{modeOption.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-2"
            >
              {showAdvanced ? '▼' : '▶'} Geavanceerde Opties
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid md:grid-cols-3 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min ABV
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={minABV || ''}
                      onChange={(e) => setMinABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Geen limiet"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max ABV
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={maxABV || ''}
                      onChange={(e) => setMaxABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Geen limiet"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Rating
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={minRating || ''}
                      onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Geen limiet"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={generating}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              generating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white'
            }`}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                Menu Genereren...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6" />
                Genereer Menu!
              </span>
            )}
          </motion.button>
        </motion.div>

        {/* Generated Menu */}
        <AnimatePresence mode="wait">
          {generatedMenu && (
            <motion.div
              key={generatedMenu.theme}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Menu Header */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{generatedMenu.theme}</h2>
                    <p className="text-lg opacity-90">{generatedMenu.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      title="Download menu"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      title="Deel menu"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Pairing Notes */}
                {generatedMenu.pairingNotes && (
                  <div className="mt-4 space-y-2">
                    {generatedMenu.pairingNotes.map((note, i) => (
                      <p key={i} className="text-sm opacity-90">💡 {note}</p>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {generatePairingSuggestions(generatedMenu).map((suggestion, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/20 rounded-full text-sm"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>

              {/* Beer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedMenu.beers.map((beer, index) => (
                  <motion.div
                    key={beer.beer_url}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                        {index + 1}
                      </div>
                      <BeerCard
                        beer={beer}
                        onClick={() => window.open(beer.beer_url, '_blank')}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Regenerate Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                className="mt-8 w-full py-4 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl font-semibold text-gray-800 transition-all shadow-lg border border-amber-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Genereer Nieuw Menu
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
