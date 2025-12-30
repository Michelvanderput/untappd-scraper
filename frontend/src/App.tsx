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
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import ThemeToggle from './components/ThemeToggle';
import UpdateNotification from './components/UpdateNotification';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
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

    // Logo animation
    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' }
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

  // Mobile menu animation
  useEffect(() => {
    if (menuRef.current && isMenuOpen) {
      gsap.fromTo(
        menuRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo(
        menuRef.current.querySelectorAll('a'),
        { x: -30, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.4)' }
      );
    }
  }, [isMenuOpen]);

  return (
    <nav ref={navRef} className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl sticky top-0 z-50 transition-colors border-b border-amber-100/50 dark:border-gray-800">
      <div className="w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 md:hidden">
          <h1 ref={logoRef} className="text-xl font-bold text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent font-heading">BeerMenu</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/install"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Installeer app"
            >
              <Download className="w-5 h-5 text-gray-900 dark:text-white" />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div ref={navLinksRef} className="hidden md:flex justify-center items-center h-20 gap-3 px-4">
          {navItems.map(({ path, icon: Icon, label, color }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-5 lg:px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap hover:scale-105 active:scale-95 ${
                isActive(path)
                  ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-amber-500/25`
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(path) ? '' : 'group-hover:scale-110'}`} />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
          <Link
            to="/install"
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110 active:scale-95"
            aria-label="Installeer app"
          >
            <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden border-t border-amber-100/50 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
            >
              <div className="py-3 px-4 space-y-2">
                {navItems.map(({ path, icon: Icon, label, color }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition-all active:scale-95 ${
                      isActive(path)
                        ? `bg-gradient-to-r ${color} text-white shadow-lg`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isActive(path) ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
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
            
            <UpdateNotification />
          </div>
        </BrowserRouter>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
