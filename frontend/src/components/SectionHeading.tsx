import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionHeadingProps {
  title: string;
  /** Optional short description under the title */
  description?: string;
  icon?: LucideIcon;
  /** Optional right-aligned slot (e.g. a link or count) */
  action?: ReactNode;
  /** Extra margin bottom (default: mb-5) */
  className?: string;
}

/**
 * Section heading (H2) with a thin rule, for clear content hierarchy.
 */
export default function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
  className = 'mb-5',
}: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b border-line/10 pb-3 ${className}`}>
      <div className="min-w-0 flex items-center gap-3">
        {Icon && (
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-gold/15 text-gold" aria-hidden>
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display italic font-extrabold text-2xl md:text-3xl leading-none">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
