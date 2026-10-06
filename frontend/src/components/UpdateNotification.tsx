import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { usePresence } from '../lib/usePresence';

export default function UpdateNotification() {
  const [onUpdate, setOnUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.onUpdate) setOnUpdate(() => detail.onUpdate);
    };
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    return () => window.removeEventListener('pwa-update-available', handleUpdateAvailable);
  }, []);

  const { mounted, state } = usePresence(!!onUpdate);
  // Keep the last handler around while the exit animation plays
  const [lastUpdate, setLastUpdate] = useState<(() => void) | null>(null);
  if (onUpdate && onUpdate !== lastUpdate) setLastUpdate(() => onUpdate);
  const update = onUpdate ?? lastUpdate;

  return (
    <>
      {mounted && update && (
        <div
          role="status"
          data-state={state}
          className="dock fixed z-[65] inset-x-3 md:inset-x-auto md:right-6 md:w-96 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6"
        >
          <div className="flex items-center gap-3 p-2 pl-4 rounded-full bg-fg text-bg shadow-2xl">
            <Sparkles className="w-5 h-5 shrink-0 text-gold" aria-hidden />
            <p className="flex-1 text-sm font-medium">Nieuwe versie klaar</p>
            <button type="button" onClick={() => update()} className="btn min-h-[40px] h-10 px-4 text-sm bg-gold text-on-gold">
              Updaten
            </button>
            <button
              type="button"
              onClick={() => setOnUpdate(null)}
              className="grid place-items-center w-10 h-10 rounded-full hover:bg-bg/10"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
