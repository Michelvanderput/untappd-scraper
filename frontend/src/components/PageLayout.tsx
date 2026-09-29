import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. "Trends" or "Spel" */
  eyebrow?: string;
  /** Optional slot rendered to the right of the title on wide screens */
  aside?: ReactNode;
  children: ReactNode;
  /** Max width of content: 'default' (max-w-6xl) | 'narrow' (max-w-3xl) | 'compact' (max-w-xl) */
  contentWidth?: 'default' | 'narrow' | 'compact';
}

const widthClass = {
  default: 'max-w-6xl',
  narrow: 'max-w-3xl',
  compact: 'max-w-xl',
};

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Editorial page header: eyebrow, oversized italic serif title (word-by-word reveal), subtitle.
 */
export default function PageLayout({ title, subtitle, eyebrow, aside, children, contentWidth = 'default' }: PageLayoutProps) {
  const words = title.split(' ');

  return (
    <div className={`mx-auto w-full px-4 sm:px-6 pt-6 md:pt-12 pb-10 ${widthClass[contentWidth]}`}>
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <motion.p
              className="eyebrow mb-3 flex items-center gap-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease }}
            >
              <span className="inline-block w-6 h-px bg-gold" aria-hidden />
              {eyebrow}
            </motion.p>
          )}
          <h1 className="font-display italic font-extrabold text-[2.75rem] leading-[0.95] sm:text-6xl md:text-7xl tracking-tight text-balance">
            {words.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, delay: 0.05 + i * 0.07, ease }}
                >
                  {word}
                  {i < words.length - 1 && ' '}
                </motion.span>
              </span>
            ))}
          </h1>
          {subtitle && (
            <motion.p
              className="mt-4 text-base md:text-lg text-muted max-w-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {aside && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="shrink-0"
          >
            {aside}
          </motion.div>
        )}
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
      >
        {children}
      </motion.div>
    </div>
  );
}
