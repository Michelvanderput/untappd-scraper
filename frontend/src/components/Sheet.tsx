import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Sticky footer, e.g. a primary action */
  footer?: ReactNode;
}

/**
 * Bottom sheet on mobile (drag down to close), centred dialog on larger screens.
 */
export default function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const titleId = useId();
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full sm:max-w-lg max-h-[88dvh] flex flex-col bg-surface border border-line/10 rounded-t-4xl sm:rounded-4xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="sm:hidden pt-3 pb-1 grid place-items-center cursor-grab" aria-hidden>
                <span className="w-10 h-1.5 rounded-full bg-line/20" />
              </div>
              <div className="flex items-center justify-between gap-4 px-5 pt-2 sm:pt-5 pb-3">
                <h2 id={titleId} className="font-display italic font-extrabold text-2xl">{title}</h2>
                <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Sluiten">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
            {footer && (
              <div className="px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5 border-t border-line/10">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
