import { useRef, useEffect, forwardRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ANIMATION_CONFIG } from '../utils/animations';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '', onClick, hoverable = false }, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const cardRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

  useEffect(() => {
    if (!hoverable || !cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -4,
        scale: 1.01,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth,
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(card);
    };
  }, [hoverable]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`glass-panel rounded-2xl transition-all ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
