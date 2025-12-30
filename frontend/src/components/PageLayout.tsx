import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ANIMATION_CONFIG } from '../utils/animations';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showDivider?: boolean;
}

export default function PageLayout({ title, subtitle, children, showDivider = true }: PageLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const timeline = gsap.timeline();

    // Title animation - scale up with bounce
    if (titleRef.current) {
      timeline.fromTo(
        titleRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: ANIMATION_CONFIG.ease.bounce }
      );
    }

    // Divider animation - expand from center
    if (dividerRef.current) {
      timeline.fromTo(
        dividerRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.5, ease: ANIMATION_CONFIG.ease.expo },
        '-=0.3'
      );
    }

    // Subtitle animation
    if (subtitleRef.current) {
      timeline.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: ANIMATION_CONFIG.ease.smooth },
        '-=0.2'
      );
    }

    // Content fade in
    if (contentRef.current) {
      timeline.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: ANIMATION_CONFIG.ease.smooth },
        '-=0.2'
      );
    }

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <h1 
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 font-heading tracking-tight"
            style={{ opacity: 0 }}
          >
            {title}
          </h1>
          {showDivider && (
            <div 
              ref={dividerRef}
              className="divider w-32 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 mx-auto mb-6 rounded-full origin-center shadow-lg shadow-amber-500/20" 
              style={{ opacity: 0 }}
            />
          )}
          {subtitle && (
            <p 
              ref={subtitleRef}
              className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto"
              style={{ opacity: 0 }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ opacity: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
