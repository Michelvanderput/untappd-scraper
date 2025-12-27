import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Gamepad2, Shuffle, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import SurprisePage from './pages/SurprisePage';
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
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 md:hidden">
          <h1 className="text-xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">BeerMenu</span>
          </h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
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
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
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
                        : 'text-gray-700 hover:bg-gray-100'
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
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<BeersPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/menu-builder" element={<MenuBuilderPage />} />
          <Route path="/surprise" element={<SurprisePage />} />
          <Route path="/beerdle" element={<BeerdlePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
