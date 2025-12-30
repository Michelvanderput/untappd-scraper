import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import gsap from 'gsap';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [onUpdate, setOnUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.onUpdate) {
        setOnUpdate(() => customEvent.detail.onUpdate);
        setShowUpdate(true);
      }
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  useEffect(() => {
    if (showUpdate) {
      const notification = document.getElementById('update-notification');
      if (notification) {
        gsap.fromTo(
          notification,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [showUpdate]);

  const handleUpdate = () => {
    if (onUpdate) {
      const notification = document.getElementById('update-notification');
      if (notification) {
        gsap.to(notification, {
          scale: 0.9,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onUpdate();
          }
        });
      } else {
        onUpdate();
      }
    }
  };

  const handleDismiss = () => {
    const notification = document.getElementById('update-notification');
    if (notification) {
      gsap.to(notification, {
        y: 100,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setShowUpdate(false);
        }
      });
    } else {
      setShowUpdate(false);
    }
  };

  if (!showUpdate) return null;

  return (
    <div
      id="update-notification"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] safe-bottom"
    >
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-lg border border-white/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              🎉 Nieuwe versie beschikbaar!
            </h3>
            <p className="text-sm text-white/90 mb-3">
              Er is een update beschikbaar. Klik op "Updaten" om de nieuwste versie te laden.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-amber-600 font-semibold px-4 py-2 rounded-xl hover:bg-amber-50 transition-all active:scale-95 shadow-md"
              >
                Updaten
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
