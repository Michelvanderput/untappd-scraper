import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, Share2, Shuffle, Wine, Map, PartyPopper, GraduationCap, ChevronDown, Zap, Beer, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BeerData } from '../types/beer';
import { generateBeerMenu, generatePairingSuggestions, type GeneratedMenu, type MenuGenerationOptions } from '../utils/beerPairing';
import BeerCard from '../components/BeerCard';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import BeerModal from '../components/BeerModal';
import { beerCache } from '../utils/cache';

const GENERATION_MODES = [
  { 
    id: 'random' as const, 
    label: 'Random', 
    icon: Shuffle, 
    description: 'Het lot beslist',
    color: 'from-purple-500 to-pink-500',
    emoji: '🎲'
  },
  { 
    id: 'balanced' as const, 
    label: 'Balans', 
    icon: Sparkles, 
    description: 'Mooie mix',
    color: 'from-blue-500 to-cyan-500',
    emoji: '⚖️'
  },
  { 
    id: 'journey' as const, 
    label: 'Reis', 
    icon: Map, 
    description: 'Opbouwende smaak',
    color: 'from-green-500 to-emerald-500',
    emoji: '🗺️'
  },
  { 
    id: 'party' as const, 
    label: 'Party', 
    icon: PartyPopper, 
    description: 'Crowd pleasers',
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
  
  // Setup State
  const [menuSize, setMenuSize] = useState(4);
  const [mode, setMode] = useState<'random' | 'balanced' | 'journey' | 'party' | 'expert'>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minABV, setMinABV] = useState<number | undefined>(undefined);
  const [maxABV, setMaxABV] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Flow State
  const [viewState, setViewState] = useState<'setup' | 'revealing' | 'summary'>('setup');
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  
  const [selectedBeer, setSelectedBeer] = useState<BeerData | null>(null);

  useEffect(() => {
    const fetchBeers = async () => {
      try {
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
      setRevealIndex(0);
      setViewState('revealing');
      setGenerating(false);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
  };

  const handleNextReveal = () => {
    if (!generatedMenu) return;
    if (revealIndex < generatedMenu.beers.length - 1) {
        setRevealIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        setViewState('summary');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setViewState('setup');
    setGeneratedMenu(null);
    setRevealIndex(0);
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
    <PageLayout title="Menu Builder" subtitle={viewState === 'setup' ? "Stel je perfecte bier menu samen" : generatedMenu?.theme || "Menu"}>
      
      {/* SETUP VIEW */}
      {viewState === 'setup' && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
        >
            <Card className="p-6 relative overflow-hidden" hoverable={false}>
                {/* Mode Selection - Compact */}
                <div className="mb-6">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Kies een sfeer</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {GENERATION_MODES.map(modeOption => {
                        const isSelected = mode === modeOption.id;
                        return (
                            <button
                            key={modeOption.id}
                            onClick={() => setMode(modeOption.id)}
                            className={`relative p-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-center border-2 ${
                                isSelected
                                ? `bg-gradient-to-br ${modeOption.color} text-white border-transparent shadow-md scale-105`
                                : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            >
                            <span className="text-2xl mb-1">{modeOption.emoji}</span>
                            <span className="text-[10px] font-bold leading-tight text-center">{modeOption.label}</span>
                            </button>
                        );
                        })}
                    </div>
                    {selectedMode && (
                        <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 italic">
                            "{selectedMode.description}"
                        </p>
                    )}
                </div>

                {/* Size Selection - Compact */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aantal Gangen</label>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-500">{menuSize}</span>
                    </div>
                    <input
                        type="range"
                        min="3"
                        max="8"
                        value={menuSize}
                        onChange={(e) => setMenuSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>3 (Klein)</span>
                        <span>8 (Groot)</span>
                    </div>
                </div>

                {/* Advanced Options Toggle */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 hover:underline"
                    >
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        Meer opties
                    </button>
                    
                    <div className={`grid grid-cols-3 gap-3 overflow-hidden transition-all duration-300 ${showAdvanced ? 'mt-3 opacity-100 max-h-24' : 'mt-0 opacity-0 max-h-0'}`}>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Min ABV</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={minABV || ''}
                                onChange={(e) => setMinABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Max ABV</label>
                            <input
                                type="number"
                                placeholder="15"
                                value={maxABV || ''}
                                onChange={(e) => setMaxABV(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Min Rating</label>
                            <input
                                type="number"
                                placeholder="0"
                                step="0.1"
                                value={minRating || ''}
                                onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        generating 
                        ? 'bg-gray-400 cursor-wait' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/30'
                    }`}
                >
                    {generating ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Menu Samenstellen...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            Start Menu
                        </>
                    )}
                </button>
            </Card>
        </motion.div>
      )}

      {/* REVEALING VIEW - Step by Step */}
      {viewState === 'revealing' && generatedMenu && (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    Gang {revealIndex + 1} van {generatedMenu.beers.length}
                </span>
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-amber-500"
                        initial={{ width: `${(revealIndex / generatedMenu.beers.length) * 100}%` }}
                        animate={{ width: `${((revealIndex + 1) / generatedMenu.beers.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={revealIndex}
                    initial={{ opacity: 0, x: 50, rotateY: -10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: -50, rotateY: 10 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="perspective-1000"
                >
                    <div className="transform transition-transform duration-500 hover:scale-[1.02]">
                        <BeerCard
                            beer={generatedMenu.beers[revealIndex]}
                            onClick={() => setSelectedBeer(generatedMenu.beers[revealIndex])}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextReveal}
                className="w-full mt-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 hover:border-amber-500 dark:hover:border-amber-500 transition-colors"
            >
                {revealIndex < generatedMenu.beers.length - 1 ? (
                    <>
                        Volgende Gang <ArrowRight className="w-5 h-5" />
                    </>
                ) : (
                    <>
                        Naar Overzicht <Check className="w-5 h-5" />
                    </>
                )}
            </motion.button>
        </div>
      )}

      {/* SUMMARY VIEW */}
      {viewState === 'summary' && generatedMenu && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
        >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none p-6 md:p-8 relative overflow-hidden mb-8" hoverable={false}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 text-center">
                    <div className="inline-block p-3 bg-white/10 rounded-full mb-4">
                        <span className="text-4xl">{selectedMode?.emoji}</span>
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-100 mb-2">
                        {generatedMenu.theme}
                    </h2>
                    <p className="text-gray-300 mb-6">{generatedMenu.description}</p>

                    <div className="flex justify-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-medium text-sm"
                        >
                            <Download className="w-4 h-4" /> Opslaan
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-amber-500/20"
                        >
                            <Share2 className="w-4 h-4" /> Delen
                        </button>
                    </div>
                </div>
            </Card>

            <div className="space-y-3 mb-8">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white px-2">Jouw Menu</h3>
                {generatedMenu.beers.map((beer, index) => (
                    <motion.div 
                        key={beer.beer_url}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 cursor-pointer hover:border-amber-500/50 transition-colors"
                        onClick={() => setSelectedBeer(beer)}
                    >
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-500 font-bold text-sm shrink-0">
                            {index + 1}
                        </div>
                        {beer.image_url ? (
                            <img src={beer.image_url} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                            <Beer className="w-8 h-8 text-gray-300" />
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{beer.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{beer.brewery}</p>
                        </div>
                        <div className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                            {beer.abv}%
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleReset}
                    className="text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-500 font-medium flex items-center gap-2 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Nieuw Menu Maken
                </button>
            </div>
        </motion.div>
      )}
      
      <BeerModal
        beer={selectedBeer}
        allBeers={generatedMenu?.beers || []}
        onClose={() => setSelectedBeer(null)}
        onNavigate={setSelectedBeer}
      />
    </PageLayout>
  );
}
