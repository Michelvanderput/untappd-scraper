import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Gamepad2, Shuffle, Menu, X, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import SurprisePage from './pages/SurprisePage';
import InstallPage from './pages/InstallPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import ThemeToggle from './components/ThemeToggle';
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
    { path: '/beerdle', icon: Gamepad2, label: 'Beerdle' },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-brand-white dark:bg-brand-black border-b border-brand-cream dark:border-brand-gray-dark sticky top-0 z-50 transition-colors backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 md:hidden">
          <h1 className="text-2xl font-display tracking-tighter text-brand-black dark:text-brand-text-primary">
            BEERMENU
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/install"
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Installeer app"
            >
              <Download className="w-5 h-5 text-brand-black dark:text-brand-text-primary" />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-brand-black dark:text-brand-text-primary" /> : <Menu className="w-6 h-6 text-brand-black dark:text-brand-text-primary" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center items-center h-20 gap-1 px-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-4 lg:px-6 py-3 font-sans font-medium text-sm tracking-tight transition-all whitespace-nowrap border-b-2 ${
                isActive(path)
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-text-secondary dark:text-brand-text-secondary hover:text-brand-black dark:hover:text-brand-text-primary hover:border-brand-border'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden lg:inline uppercase tracking-wider text-xs">{label}</span>
            </Link>
          ))}
          <Link
            to="/install"
            className="p-2 hover:opacity-70 transition-opacity"
            aria-label="Installeer app"
          >
            <Download className="w-5 h-5 text-brand-text-secondary dark:text-brand-text-secondary" />
          </Link>
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
              className="md:hidden overflow-hidden border-t border-brand-border dark:border-brand-border bg-brand-white dark:bg-brand-black"
            >
              <div className="py-2 px-4 space-y-1">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-3 font-sans font-medium transition-all border-l-2 ${
                      isActive(path)
                        ? 'border-brand-accent text-brand-accent bg-brand-cream dark:bg-brand-gray-dark'
                        : 'border-transparent text-brand-text-secondary dark:text-brand-text-secondary hover:border-brand-border hover:bg-brand-cream dark:hover:bg-brand-gray-dark'
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
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
            <Navigation />
            
            <Routes>
              <Route path="/" element={<BeersPage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/menu-builder" element={<MenuBuilderPage />} />
              <Route path="/surprise" element={<SurprisePage />} />
              <Route path="/beerdle" element={<BeerdlePage />} />
              <Route path="/install" element={<InstallPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
