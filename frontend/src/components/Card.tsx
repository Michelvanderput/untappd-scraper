import { forwardRef } from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** Kept for API compatibility; hover lift is now CSS-only */
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '', onClick, hoverable = false }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className={`surface transition-[transform,border-color] duration-300 ease-out-expo ${
      hoverable ? 'hover:-translate-y-0.5 hover:border-line/20' : ''
    } ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

export default Card;
