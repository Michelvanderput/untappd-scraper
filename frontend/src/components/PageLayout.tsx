import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animatePageHeader, animateFadeIn } from '../utils/animations';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showDivider?: boolean;
}

export default function PageLayout({ title, subtitle, children, showDivider = true }: PageLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      animatePageHeader(headerRef.current);
    }
    if (contentRef.current) {
      animateFadeIn(contentRef.current, 0.3);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12" style={{ opacity: 1 }}>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-heading" style={{ opacity: 1 }}>
            {title}
          </h1>
          {showDivider && (
            <div className="divider w-32 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 mx-auto mb-6 rounded-full" style={{ opacity: 1 }} />
          )}
          {subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-300" style={{ opacity: 1 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ opacity: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
