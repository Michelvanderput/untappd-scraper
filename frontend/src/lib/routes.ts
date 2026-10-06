/**
 * Route chunk loaders, shared by the lazy() pages in App.tsx and the prefetching below.
 * Calling a loader twice is free: the module is fetched once.
 */
export const routeLoaders = {
  '/': () => import('../pages/BeersPage'),
  '/trends': () => import('../pages/TrendsPage'),
  '/menu-builder': () => import('../pages/MenuBuilderPage'),
  '/surprise': () => import('../pages/SurprisePage'),
  '/toepen': () => import('../pages/ToepenPage'),
  '/install': () => import('../pages/InstallPage'),
  '/compare': () => import('../pages/ComparePage'),
  '*': () => import('../pages/NotFoundPage'),
} as const;

type RoutePath = keyof typeof routeLoaders;

/** Start loading one page's code (e.g. on hover/touch of its tab) so navigating feels instant */
export function prefetchRoute(path: string) {
  const loader = routeLoaders[path as RoutePath];
  if (loader) void loader().catch(() => {});
}

/** After the first paint, quietly fetch every page in the background (skipped on Data Saver) */
export function prefetchAllRoutes() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;
  const run = () => (Object.keys(routeLoaders) as RoutePath[]).forEach((p) => prefetchRoute(p));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}
