import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Gamepad2, Shuffle, Menu, X, Scale } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import SurprisePage from './pages/SurprisePage';
import ComparePage from './pages/ComparePage';
import { ThemeProvider } from './contexts/ThemeContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import ThemeToggle from './components/ThemeToggle';
import ComparisonBar from './components/ComparisonBar';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Beer, label: 'Bieren' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/menu-builder', icon: Sparkles, label: 'Menu' },
    { path: '/surprise', icon: Shuffle, label: 'Surprise' },
    { path: '/compare', icon: Scale, label: 'Vergelijk' },
    { path: '/beerdle', icon: Gamepad2, label: 'Beerdle' },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors">
      <div className="w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 md:hidden">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">BeerMenu</span>
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center items-center h-20 gap-2 px-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-4 lg:px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200"
            >
              <div className="py-2 px-4 space-y-1">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive(path)
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function App() {
  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker();
    setupInstallPrompt();
  }, []);

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <ComparisonProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
              <Navigation />
              
              <Routes>
                <Route path="/" element={<BeersPage />} />
                <Route path="/trends" element={<TrendsPage />} />
                <Route path="/menu-builder" element={<MenuBuilderPage />} />
                <Route path="/surprise" element={<SurprisePage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/beerdle" element={<BeerdlePage />} />
              </Routes>
              
              <ComparisonBar />
            </div>
          </BrowserRouter>
        </ComparisonProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
