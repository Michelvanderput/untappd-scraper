import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beer, TrendingUp, Sparkles, Gamepad2 } from 'lucide-react';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import './App.css';

type Tab = 'beers' | 'trends' | 'menu-builder' | 'beerdle';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('beers');

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('beers')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'beers'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Beer className="w-5 h-5" />
              Bieren
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Trends
            </button>
            <button
              onClick={() => setActiveTab('menu-builder')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'menu-builder'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Menu Builder
            </button>
            <button
              onClick={() => setActiveTab('beerdle')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'beerdle'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
              Beerdle
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'beers' && <BeersPage />}
        {activeTab === 'trends' && <TrendsPage />}
        {activeTab === 'menu-builder' && <MenuBuilderPage />}
        {activeTab === 'beerdle' && <BeerdlePage />}
      </motion.div>
    </div>
  );
}

export default App;
