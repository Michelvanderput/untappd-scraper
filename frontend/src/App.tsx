import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Gamepad2, Shuffle, Menu, X, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import SurprisePage from './pages/SurprisePage';
import InstallPage from './pages/InstallPage';
import ComparePage from './pages/ComparePage';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import ThemeToggle from './components/ThemeToggle';
import UpdateNotification from './components/UpdateNotification';
import ComparisonBar from './components/ComparisonBar';
import ChatBot from './components/ChatBot';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const navLinksRef = useRef<HTMLDivElement>(null);
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Beer, label: 'Bieren', color: 'from-amber-500 to-orange-500' },
    { path: '/trends', icon: TrendingUp, label: 'Trends', color: 'from-blue-500 to-cyan-500' },
    { path: '/menu-builder', icon: Sparkles, label: 'Menu', color: 'from-purple-500 to-pink-500' },
    { path: '/surprise', icon: Shuffle, label: 'Surprise', color: 'from-green-500 to-emerald-500' },
    { path: '/beerdle', icon: Gamepad2, label: 'Beerdle', color: 'from-red-500 to-orange-500' },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  // Initial nav animation
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Stagger nav links
    if (navLinksRef.current) {
      gsap.fromTo(
        navLinksRef.current.querySelectorAll('a'),
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <nav 
      ref={navRef} 
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800 shadow-lg shadow-black/5"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={handleNavClick}>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <Beer className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-heading">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Beer</span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Menu</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div ref={navLinksRef} className="hidden md:flex items-center gap-2">
            {navItems.map(({ path, icon: Icon, label, color }) => (
              <Link
                key={path}
                to={path}
                className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 group overflow-hidden ${
                  isActive(path)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {isActive(path) && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-xl`} />
                )}
                <div className="relative flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive(path) ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
            
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />
            
            <Link
              to="/install"
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:scale-105 active:scale-95"
              title="Installeer app"
            >
              <Download className="w-5 h-5" />
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/install"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 text-gray-700 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="p-4 space-y-2">
              {navItems.map(({ path, icon: Icon, label, color }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all active:scale-98 ${
                    isActive(path)
                      ? `bg-gradient-to-r ${color} text-white shadow-lg`
                      : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive(path) ? 'bg-white/20' : 'bg-white dark:bg-gray-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            <div className="min-h-screen bg-amber-50 dark:bg-gray-900 transition-colors pt-20">
              <Navigation />
              
              <Routes>
                <Route path="/" element={<BeersPage />} />
                <Route path="/trends" element={<TrendsPage />} />
                <Route path="/menu-builder" element={<MenuBuilderPage />} />
                <Route path="/surprise" element={<SurprisePage />} />
                <Route path="/beerdle" element={<BeerdlePage />} />
                <Route path="/install" element={<InstallPage />} />
                <Route path="/compare" element={<ComparePage />} />
              </Routes>
              
              <ComparisonBar />
              <ChatBot />
              <UpdateNotification />
            </div>
          </BrowserRouter>
        </ComparisonProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
