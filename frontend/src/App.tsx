import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Gamepad2 } from 'lucide-react';
import BeersPage from './pages/BeersPage';
import TrendsPage from './pages/TrendsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import BeerdlePage from './pages/BeerdlePage';
import './App.css';

function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-20 gap-2 overflow-x-auto">
          <Link
            to="/"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Beer className="w-5 h-5" />
            Bieren
          </Link>
          <Link
            to="/trends"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/trends')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Trends
          </Link>
          <Link
            to="/menu-builder"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/menu-builder')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Menu Builder
          </Link>
          <Link
            to="/beerdle"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              isActive('/beerdle')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            Beerdle
          </Link>
        </div>
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
          <Route path="/beerdle" element={<BeerdlePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
