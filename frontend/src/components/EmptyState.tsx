import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable empty state: icon, title, description and primary CTA.
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
    >
      <div className="w-16 h-16 rounded-full border border-dashed border-line/25 grid place-items-center text-gold mb-6">
        <Icon className="w-7 h-7" aria-hidden />
      </div>
      <h2 className="font-display italic font-extrabold text-3xl mb-2">{title}</h2>
      <p className="text-muted max-w-sm mb-8">{description}</p>
      {action}
    </div>
  );
}
