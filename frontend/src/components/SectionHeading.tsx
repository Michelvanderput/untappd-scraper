import type { LucideIcon } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  /** Optional short description under the title */
  description?: string;
  icon?: LucideIcon;
  /** Extra margin bottom (default: mb-6) */
  className?: string;
}

/**
 * Consistent section heading (H2) for clear content hierarchy.
 * Use to separate logical blocks on a page.
 */
export default function SectionHeading({
  title,
  description,
  icon: Icon,
  className = 'mb-6',
}: SectionHeadingProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && (
        <div className="flex-shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" aria-hidden>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-heading">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
