import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

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

  return (
    <AnimatePresence>
      {onUpdate && (
        <motion.div
          role="status"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed z-[65] inset-x-3 md:inset-x-auto md:right-6 md:w-96 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6"
        >
          <div className="flex items-center gap-3 p-2 pl-4 rounded-full bg-fg text-bg shadow-2xl">
            <Sparkles className="w-5 h-5 shrink-0 text-gold" aria-hidden />
            <p className="flex-1 text-sm font-medium">Nieuwe versie klaar</p>
            <button type="button" onClick={() => onUpdate()} className="btn min-h-[40px] h-10 px-4 text-sm bg-gold text-on-gold">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
