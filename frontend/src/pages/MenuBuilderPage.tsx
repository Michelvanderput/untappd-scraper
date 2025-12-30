import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, Share2, Shuffle, Wine, Map, PartyPopper, GraduationCap, ChevronDown, Zap, Beer } from 'lucide-react';
import type { BeerData } from '../types/beer';
import { generateBeerMenu, generatePairingSuggestions, type GeneratedMenu, type MenuGenerationOptions } from '../utils/beerPairing';
import BeerCard from '../components/BeerCard';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import { beerCache } from '../utils/cache';

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
        // Try cache first
        const cached = await beerCache.get<BeerData[]>('beers');
        if (cached) {
          setBeers(cached);
          setLoading(false);
        }

        let response;
        try {
          response = await fetch('/api/beers');
        } catch {
          response = await fetch('/beers.json');
        }
        
        if (response.ok) {
            const data = await response.json();
            const freshBeers = data.beers || [];
            setBeers(freshBeers);
            await beerCache.set('beers', freshBeers);
        }
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
    
    // Simulate thinking time for effect
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
      
      // Scroll to result
      const resultElement = document.getElementById('menu-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 600);
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
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageLayout>
    );
  }

  const selectedMode = GENERATION_MODES.find(m => m.id === mode);

  return (
    <PageLayout title="Menu Builder" subtitle="Stel je perfecte bier menu samen met AI-algoritmes">
      {/* Configuration Card */}
      <Card className="p-6 md:p-8 mb-8 relative overflow-hidden" hoverable={false}>
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Menu Size with Visual Indicator */}
        <div className="mb-10 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-amber-100 flex items-center gap-2">
              <Beer className="w-5 h-5 text-amber-500" />
              Aantal Bieren
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-heading">
                {menuSize}
              </span>
            </div>
          </div>
          
          <div className="px-2">
            <input
              type="range"
              min="3"
              max="12"
              value={menuSize}
              onChange={(e) => setMenuSize(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
              style={{
                backgroundImage: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(249 115 22) ${((menuSize - 3) / 9) * 100}%, transparent ${((menuSize - 3) / 9) * 100}%)`
              }}
            />
            <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mt-3">
              <span>Klein (3)</span>
              <span>Gemiddeld (7-8)</span>
              <span>Groot (12)</span>
            </div>
          </div>
        </div>

        {/* Generation Mode - Compact Grid */}
        <div className="mb-10 relative z-10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-amber-100 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Generatie Mode
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {GENERATION_MODES.map(modeOption => {
              const isSelected = mode === modeOption.id;
              return (
                <button
                  key={modeOption.id}
                  onClick={() => setMode(modeOption.id)}
                  className={`relative p-4 rounded-2xl transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center border-2 group ${
                    isSelected
                      ? `bg-gradient-to-br ${modeOption.color} text-white shadow-lg scale-105 border-transparent`
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800'
                  }`}
                >
                  <span className="text-4xl mb-3 transform transition-transform group-hover:scale-110 duration-300">{modeOption.emoji}</span>
                  <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                    {modeOption.label}
                  </p>
                  <p className={`text-[10px] text-center leading-tight ${isSelected ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                    {modeOption.description}
                  </p>
                  
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-white text-amber-600 rounded-full p-1 shadow-md">
                        <Zap className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <div className="mb-8 relative z-10">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-bold flex items-center gap-2 transition-colors bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg text-sm"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
            Geavanceerde Opties
          </button>
          
          <div className={`grid md:grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? 'mt-4 opacity-100 max-h-48' : 'mt-0 opacity-0 max-h-0'}`}>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
        </div>

        {/* Generate Button - Eye-catching */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`relative w-full py-5 rounded-xl font-bold text-lg transition-all shadow-xl min-h-[64px] group overflow-hidden ${
            generating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="animate-pulse">Menu samenstellen...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <Zap className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              Genereer {selectedMode?.emoji} Menu!
            </span>
          )}
          {!generating && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
          )}
        </button>
      </Card>

      {/* Generated Menu */}
      {generatedMenu && (
        <div id="menu-result" className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-center my-8">
            <div className="h-1 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Menu Header - Compact & Exciting */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none p-8 relative overflow-hidden" hoverable={false}>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                        {selectedMode?.label} Mode
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-5xl filter drop-shadow-lg">{selectedMode?.emoji}</span>
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-100">
                            {generatedMenu.theme}
                        </h2>
                    </div>
                    <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">{generatedMenu.description}</p>
                </div>
                <div className="flex gap-3">
                    <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 border border-white/10 font-medium"
                    title="Download menu"
                    >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">Opslaan</span>
                    </button>
                    <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all active:scale-95 font-medium shadow-lg shadow-amber-500/20"
                    title="Deel menu"
                    >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden md:inline">Delen</span>
                    </button>
                </div>
                </div>

                {/* Pairing Notes & Suggestions */}
                <div className="grid md:grid-cols-2 gap-6 bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div>
                        <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                            <Wine className="w-4 h-4" />
                            Proefnotities
                        </h4>
                        {generatedMenu.pairingNotes && generatedMenu.pairingNotes.length > 0 ? (
                            <ul className="space-y-2">
                                {generatedMenu.pairingNotes.map((note, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-amber-500/50 mt-1">•</span>
                                    {note}
                                </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Geen specifieke notities.</p>
                        )}
                    </div>
                    <div>
                        <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Food Pairing
                        </h4>
                        <div className="flex flex-wrap gap-2">
                        {generatePairingSuggestions(generatedMenu).map((suggestion, i) => (
                            <span
                            key={i}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-sm text-gray-200 transition-colors cursor-default"
                            >
                            {suggestion}
                            </span>
                        ))}
                        </div>
                    </div>
                </div>
            </div>
          </Card>

          {/* Beer Grid - Optimized for large menus */}
          <div className={`grid gap-6 ${
            menuSize <= 6 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {generatedMenu.beers.map((beer, index) => (
              <div key={beer.beer_url} className="relative group">
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-amber-500 dark:to-orange-500 rounded-xl rotate-3 flex items-center justify-center text-white text-lg font-bold shadow-lg z-10 border-2 border-white dark:border-gray-800 group-hover:-rotate-3 transition-transform duration-300">
                  {index + 1}
                </div>
                <div className="h-full transform transition-transform duration-300 group-hover:-translate-y-1">
                    <BeerCard
                    beer={beer}
                    onClick={() => window.open(beer.beer_url, '_blank')}
                    />
                </div>
              </div>
            ))}
          </div>

          {/* Regenerate Button - Subtle */}
          <div className="flex justify-center pt-8">
            <button
                onClick={handleGenerate}
                className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full font-bold text-gray-600 dark:text-gray-300 transition-all shadow-sm border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700"
            >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Niet tevreden? Genereer opnieuw
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
