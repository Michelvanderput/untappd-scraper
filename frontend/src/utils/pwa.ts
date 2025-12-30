export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Never use cached service worker
      });
      console.log('Service Worker registered:', registration);

      // Check for updates immediately on page load
      registration.update();

      // Check for updates every 1 minute (aggressive for immediate deploy visibility)
      setInterval(() => {
        registration.update();
        console.log('[PWA] Checking for updates...');
      }, 60 * 1000);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New service worker found!');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available!');
              
              // Show update notification
              showUpdateNotification(() => {
                // User clicked update - skip waiting and reload
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                
                // Clear all caches
                clearAllCaches().then(() => {
                  window.location.reload();
                });
              });
            }
          });
        }
      });

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Controller changed, reloading...');
          window.location.reload();
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_CLEARED') {
          console.log('[PWA] Cache cleared by service worker');
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Clear all caches manually
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('[PWA] Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
    console.log('[PWA] All caches cleared');
  }

  // Also send message to service worker to clear its caches
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }
}

// Show update notification to user
function showUpdateNotification(onUpdate: () => void) {
  // Create a custom event that components can listen to
  const event = new CustomEvent('pwa-update-available', {
    detail: { onUpdate }
  });
  window.dispatchEvent(event);

  // Fallback to browser notification if no component handles it
  setTimeout(() => {
    if (confirm('🎉 Nieuwe versie beschikbaar! Klik OK om te updaten.')) {
      onUpdate();
    }
  }, 1000);
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Dispatch custom event to notify app
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('PWA was installed');
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Force reload and clear cache (for manual refresh)
export async function forceReload(): Promise<void> {
  console.log('[PWA] Force reloading...');
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  }
  
  // Clear all caches
  await clearAllCaches();
  
  // Hard reload
  window.location.reload();
}

// Get service worker version
export async function getServiceWorkerVersion(): Promise<string | null> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };
      
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      } else {
        resolve(null);
      }
      
      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  }
  return null;
}
