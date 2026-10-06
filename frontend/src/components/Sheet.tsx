import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
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
 * Native-feeling bottom drawer (Vaul): drag the handle down to close, focus is trapped,
 * Escape closes. Capped to a centred column on wide screens.
 */
export default function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[71] mx-auto flex w-full max-h-[88dvh] flex-col rounded-t-4xl border border-b-0 border-line/10 bg-surface shadow-2xl outline-none sm:max-w-lg"
        >
          <div className="grid place-items-center pt-3 pb-1" aria-hidden>
            <span className="h-1.5 w-10 rounded-full bg-line/20" />
          </div>
          <div className="flex items-center justify-between gap-4 px-5 pt-2 pb-3">
            <Drawer.Title className="font-display italic font-extrabold text-2xl">{title}</Drawer.Title>
            <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Sluiten">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5" data-vaul-no-drag data-lenis-prevent>
            {children}
          </div>
          {footer && (
            <div className="border-t border-line/10 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
