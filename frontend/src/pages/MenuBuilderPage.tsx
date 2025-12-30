import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, Share2, Shuffle, Wine, Map, PartyPopper, GraduationCap, ChevronDown, Zap } from 'lucide-react';
import type { BeerData } from '../types/beer';
import { generateBeerMenu, generatePairingSuggestions, type GeneratedMenu, type MenuGenerationOptions } from '../utils/beerPairing';
import BeerCard from '../components/BeerCard';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';

const GENERATION_MODES = [
  { 
    id: 'random' as const, 
    label: 'Random', 
    icon: Shuffle, 
    description: 'Laat het lot beslissen!',
    color: 'from-purple-500 to-pink-500',
    emoji: '🎲'
  },
  { 
    id: 'balanced' as const, 
    label: 'Gebalanceerd', 
    icon: Sparkles, 
    description: 'Mix van alle stijlen',
    color: 'from-blue-500 to-cyan-500',
    emoji: '⚖️'
  },
  { 
    id: 'journey' as const, 
    label: 'Smaak Reis', 
    icon: Map, 
    description: 'Van licht naar zwaar',
    color: 'from-green-500 to-emerald-500',
    emoji: '🗺️'
  },
  { 
    id: 'party' as const, 
    label: 'Party', 
    icon: PartyPopper, 
    description: 'Crowd pleasers!',
    color: 'from-orange-500 to-red-500',
    emoji: '🎉'
  },
  { 
    id: 'expert' as const, 
    label: 'Expert', 
    icon: GraduationCap, 
    description: 'Voor kenners',
    color: 'from-amber-500 to-yellow-500',
    emoji: '🎓'
  },
];

export default function MenuBuilderPage() {
  const [beers, setBeers] = useState<BeerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSize, setMenuSize] = useState(6);
  const [mode, setMode] = useState<'random' | 'balanced' | 'journey' | 'party' | 'expert'>('balanced');
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    }, 300);
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
      <PageLayout title="Menu Builder" subtitle="Laden...">
        <div className="flex justify-center items-center py-20">
          <Wine className="w-16 h-16 text-amber-600 animate-bounce" />
        </div>
      </PageLayout>
    );
  }

  const selectedMode = GENERATION_MODES.find(m => m.id === mode);

  return (
    <PageLayout title="Menu Builder" subtitle="Stel je perfecte bier menu samen met AI-algoritmes">
      {/* Configuration Card */}
      <Card className="p-6 md:p-8 mb-8">
        {/* Menu Size with Visual Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-amber-100">Aantal Bieren</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: menuSize }).map((_, i) => (
                  <div key={i} className="w-2 h-8 bg-gradient-to-t from-amber-500 to-orange-400 rounded-full" />
                ))}
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{menuSize}</span>
            </div>
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
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Klein (3)</span>
            <span>Groot (12)</span>
          </div>
        </div>

        {/* Generation Mode - Compact Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-amber-100 mb-4">Generatie Mode</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {GENERATION_MODES.map(modeOption => {
              const isSelected = mode === modeOption.id;
              return (
                <button
                  key={modeOption.id}
                  onClick={() => setMode(modeOption.id)}
                  className={`p-4 rounded-xl transition-all min-h-[100px] flex flex-col items-center justify-center ${
                    isSelected
                      ? `bg-gradient-to-br ${modeOption.color} text-white shadow-xl scale-105 border-2 border-white/30`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95'
                  }`}
                >
                  <span className="text-3xl mb-2">{modeOption.emoji}</span>
                  <p className="font-bold text-sm mb-1">{modeOption.label}</p>
                  <p className="text-xs opacity-80 text-center">{modeOption.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium flex items-center gap-2 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Geavanceerde Opties
          </button>
          
          {showAdvanced && (
            <div className="grid md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-amber-100 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min ABV %
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="15"
                  value={minABV || ''}
                  onChange={(e) => setMinABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Geen limiet"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max ABV %
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="15"
                  value={maxABV || ''}
                  onChange={(e) => setMaxABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Geen limiet"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Rating ⭐
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={minRating || ''}
                  onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Geen limiet"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button - Eye-catching */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full py-5 rounded-xl font-bold text-lg transition-all shadow-xl min-h-[64px] ${
            generating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-95'
          }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="animate-pulse">Genereren...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <Zap className="w-6 h-6" />
              Genereer {selectedMode?.emoji} Menu!
            </span>
          )}
        </button>
      </Card>

      {/* Generated Menu */}
      {generatedMenu && (
        <div className="space-y-6">
          {/* Menu Header - Compact & Exciting */}
          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white border-none p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selectedMode?.emoji}</span>
                  <h2 className="text-3xl md:text-4xl font-bold">{generatedMenu.theme}</h2>
                </div>
                <p className="text-lg opacity-90">{generatedMenu.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95"
                  title="Download menu"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95"
                  title="Deel menu"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pairing Notes - Compact */}
            {generatedMenu.pairingNotes && generatedMenu.pairingNotes.length > 0 && (
              <div className="mb-4 space-y-1">
                {generatedMenu.pairingNotes.map((note, i) => (
                  <p key={i} className="text-sm opacity-90">💡 {note}</p>
                ))}
              </div>
            )}

            {/* Suggestions - Pills */}
            <div className="flex flex-wrap gap-2">
              {generatePairingSuggestions(generatedMenu).map((suggestion, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </Card>

          {/* Beer Grid - Optimized for large menus */}
          <div className={`grid gap-4 ${
            menuSize <= 6 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {generatedMenu.beers.map((beer, index) => (
              <div key={beer.beer_url} className="relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg z-10">
                  {index + 1}
                </div>
                <BeerCard
                  beer={beer}
                  onClick={() => window.open(beer.beer_url, '_blank')}
                />
              </div>
            ))}
          </div>

          {/* Regenerate Button - Subtle */}
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl font-semibold text-gray-800 dark:text-amber-100 transition-all shadow-lg border border-amber-200 dark:border-gray-700 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Genereer Nieuw Menu
          </button>
        </div>
      )}
    </PageLayout>
  );
}
