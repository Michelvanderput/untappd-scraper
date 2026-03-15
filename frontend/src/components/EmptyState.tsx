import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: ReactNode;
  className?: string;
}

/**
 * Reusable empty state: icon, title, description and primary CTA.
 * Use when a page or section has no data (e.g. Compare with 0 beers).
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 md:py-20 px-6 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
        <Icon className="w-10 h-10" aria-hidden />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-heading mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {description}
      </p>
      {action}
    </div>
  );
}
