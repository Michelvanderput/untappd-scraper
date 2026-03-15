import type { LucideIcon } from 'lucide-react';

interface PageIntroProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** Optional class for the container */
  className?: string;
}

/**
 * Consistent page intro: title + short description.
 * Use at the top of page content so users immediately understand what the page is for.
 */
export default function PageIntro({ title, description, icon: Icon, className = '' }: PageIntroProps) {
  return (
    <header className={`text-center mb-10 md:mb-12 ${className}`}>
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4" aria-hidden>
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-heading tracking-tight mb-3">
        {title}
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </header>
  );
}
