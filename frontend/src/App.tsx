import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Spade, Download, Instagram, Dices } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import ThemeToggle from './components/ThemeToggle';
import UpdateNotification from './components/UpdateNotification';
import ComparisonBar from './components/ComparisonBar';
import ErrorBoundary from './components/ErrorBoundary';
import BottleCap from './components/BottleCap';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';
import { haptics } from './utils/haptic';

// Lazy load pages
const BeersPage = lazy(() => import('./pages/BeersPage'));
const TrendsPage = lazy(() => import('./pages/TrendsPage'));
const MenuBuilderPage = lazy(() => import('./pages/MenuBuilderPage'));
const SurprisePage = lazy(() => import('./pages/SurprisePage'));
const ToepenPage = lazy(() => import('./pages/ToepenPage'));
const InstallPage = lazy(() => import('./pages/InstallPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: Beer, label: 'Bieren' },
  { path: '/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/surprise', icon: Dices, label: 'Verras me' },
  { path: '/menu-builder', icon: Sparkles, label: 'Menu' },
  { path: '/toepen', icon: Spade, label: 'Toepen' },
];

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Laden">
      <BottleCap className="w-12 h-12" spinning />
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-h-[44px] group" aria-label="BeerMenu – naar bieren">
      <BottleCap className="w-9 h-9 transition-transform duration-500 ease-out-expo group-hover:rotate-[30deg]">
        <span className="font-display italic font-extrabold text-sm">B</span>
      </BottleCap>
      <span className="font-display italic font-extrabold text-xl tracking-tight">
        Beer<span className="text-gold">Menu</span>
      </span>
    </Link>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 pt-safe bg-bg/75 backdrop-blur-xl border-b border-line/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1" aria-label="Hoofdnavigatie">
          {NAV_ITEMS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `relative px-4 min-h-[40px] inline-flex items-center rounded-full text-sm font-medium transition-colors ${
                  isActive ? 'text-bg' : 'text-muted hover:text-fg'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-pill"
                      className="absolute inset-0 rounded-full bg-fg"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/install" className="icon-btn" aria-label="Installeer de app">
            <Download className="w-5 h-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function TabBar() {
  return (
    <nav
      className="md:hidden fixed inset-x-3 z-50 bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label="Hoofdnavigatie"
    >
      <div className="relative flex items-stretch justify-between h-16 px-1.5 rounded-full bg-surface/85 backdrop-blur-2xl border border-line/10 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isCenter = path === '/surprise';
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => haptics.tap()}
              aria-label={label}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 min-w-[44px]"
            >
              {({ isActive }) =>
                isCenter ? (
                  <motion.span
                    className="-mt-7 flex flex-col items-center gap-1"
                    whileTap={{ scale: 0.9, rotate: -20 }}
                  >
                    <BottleCap className={`w-[60px] h-[60px] drop-shadow-[0_10px_18px_rgba(242,179,61,0.35)] ${isActive ? '' : 'saturate-[0.85]'}`}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </BottleCap>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-gold' : 'text-muted'}`}>{label}</span>
                  </motion.span>
                ) : (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-x-1 inset-y-1.5 rounded-full bg-line/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      />
                    )}
                    <Icon className={`relative w-5 h-5 transition-colors ${isActive ? 'text-gold' : 'text-muted'}`} />
                    <span className={`relative text-[10px] font-medium transition-colors ${isActive ? 'text-fg' : 'text-muted'}`}>
                      {label}
                    </span>
                  </>
                )
              }
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<PageFallback />}>
          <ErrorBoundary>
            <Routes location={location}>
              <Route path="/" element={<BeersPage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/menu-builder" element={<MenuBuilderPage />} />
              <Route path="/surprise" element={<SurprisePage />} />
              <Route path="/toepen" element={<ToepenPage />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker();
    setupInstallPrompt();
  }, []);

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <ComparisonProvider>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <div className="min-h-[100dvh] flex flex-col">
                {/* Ambient tap-light glow */}
                <div
                  className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(var(--gold)/0.10),transparent_70%)]"
                  aria-hidden
                />

                <TopBar />

                <main className="relative flex-1">
                  <AnimatedRoutes />
                </main>

                <footer className="border-t border-line/5 pt-6 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-6">
                  <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted">
                    <span className="font-display italic">Biertaverne De Gouverneur</span>
                    <a
                      href="https://instagram.com/michelvdput"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-fg transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      @michelvdput
                    </a>
                  </div>
                </footer>

                <TabBar />
                <ComparisonBar />
                <UpdateNotification />
                <Analytics />
              </div>
            </BrowserRouter>
          </MotionConfig>
        </ComparisonProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
