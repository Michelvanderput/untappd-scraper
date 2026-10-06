import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Spade, Download, Instagram, Dices, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { useSlidingPill } from './lib/useSlidingPill';
import { prefetchAllRoutes, prefetchRoute, routeLoaders } from './lib/routes';
import { scrollToTop } from './lib/lenis';
import SmoothScroll from './components/SmoothScroll';
import CommandPalette from './components/CommandPalette';
import { openCommandPalette } from './lib/command';
import Intro from './components/Intro';

// Lazy load pages
const BeersPage = lazy(routeLoaders['/']);
const TrendsPage = lazy(routeLoaders['/trends']);
const MenuBuilderPage = lazy(routeLoaders['/menu-builder']);
const SurprisePage = lazy(routeLoaders['/surprise']);
const ToepenPage = lazy(routeLoaders['/toepen']);
const InstallPage = lazy(routeLoaders['/install']);
const ComparePage = lazy(routeLoaders['/compare']);
const NotFoundPage = lazy(routeLoaders['*']);

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
    <Link to="/" viewTransition className="flex items-center gap-2.5 min-h-[44px] group" aria-label="BeerMenu – naar bieren">
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
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useSlidingPill(nav, pill, 'a[aria-current="page"]', useLocation().pathname);

  return (
    <header className="header-edge sticky top-0 z-40 pt-safe bg-bg/75 backdrop-blur-xl border-b border-line/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav ref={nav} className="relative hidden md:flex items-center gap-1" aria-label="Hoofdnavigatie">
          <span ref={pill} className="absolute left-0 top-0 rounded-full bg-fg opacity-0 invisible pointer-events-none" aria-hidden />
          {NAV_ITEMS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              viewTransition
              onPointerEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              className={({ isActive }) =>
                `relative z-10 px-4 min-h-[40px] inline-flex items-center rounded-full text-sm font-medium transition-colors duration-300 ${
                  isActive ? 'text-bg' : 'text-muted hover:text-fg'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden sm:inline-flex items-center gap-2 h-10 pl-3 pr-2 rounded-full border border-line/10 bg-surface-2/60 text-sm text-muted hover:text-fg hover:border-line/25 transition-colors"
            aria-label="Zoek in alles (Ctrl of ⌘ + K)"
          >
            <Search className="w-4 h-4" aria-hidden />
            Zoeken
            <kbd className="ml-1 rounded-md border border-line/15 px-1.5 py-0.5 text-[11px] font-sans text-muted">⌘K</kbd>
          </button>
          <button type="button" onClick={openCommandPalette} className="sm:hidden icon-btn" aria-label="Zoek in alles">
            <Search className="w-5 h-5" />
          </button>
          <Link to="/install" viewTransition className="icon-btn" aria-label="Installeer de app">
            <Download className="w-5 h-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function TabBar() {
  const bar = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  // Pressed feedback via pointer events: iOS Safari only applies :active when a touch listener exists
  const [pressed, setPressed] = useState<string | null>(null);
  useSlidingPill(bar, pill, 'a[aria-current="page"]:not([data-no-pill])', useLocation().pathname);

  return (
    <nav
      className="md:hidden fixed inset-x-3 z-50 bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label="Hoofdnavigatie"
    >
      <div
        ref={bar}
        className="relative flex items-stretch justify-between h-16 px-1.5 rounded-full bg-surface/85 backdrop-blur-2xl border border-line/10 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]"
      >
        <span ref={pill} className="absolute left-0 top-0 rounded-full bg-line/10 opacity-0 invisible pointer-events-none" aria-hidden />
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isCenter = path === '/surprise';
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              viewTransition
              data-no-pill={isCenter ? '' : undefined}
              data-pressed={pressed === path ? '' : undefined}
              onPointerDown={() => {
                prefetchRoute(path);
                setPressed(path);
              }}
              onPointerUp={() => setPressed(null)}
              onPointerCancel={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onClick={() => haptics.tap()}
              aria-label={label}
              className="group relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 min-w-[44px] my-1.5 touch-manipulation"
            >
              {({ isActive }) =>
                isCenter ? (
                  <span className="-mt-8 flex flex-col items-center gap-1 transition-transform duration-150 ease-out-expo group-data-[pressed]:scale-90">
                    <BottleCap className={`w-[60px] h-[60px] drop-shadow-[0_10px_18px_rgba(242,179,61,0.35)] ${isActive ? 'cap-pop' : 'saturate-[0.85]'}`}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </BottleCap>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-gold' : 'text-muted'}`}>{label}</span>
                  </span>
                ) : (
                  <>
                    <Icon className={`w-5 h-5 transition-[color,transform] duration-150 group-data-[pressed]:scale-90 ${isActive ? 'text-gold' : 'text-muted'}`} />
                    <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-fg' : 'text-muted'}`}>
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

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);

  return (
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
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker();
    setupInstallPrompt();
    prefetchAllRoutes();
  }, []);

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <ComparisonProvider>
          <BrowserRouter>
            <SmoothScroll />
            <Intro />
            <CommandPalette />
            <div className="min-h-[100dvh] flex flex-col">
              {/* Ambient tap-light glow */}
              <div
                className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] -z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(var(--gold)/0.10),transparent_70%)]"
                aria-hidden
              />

              <TopBar />

              <main className="relative flex-1">
                <AppRoutes />
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
        </ComparisonProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
