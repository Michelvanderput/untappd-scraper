import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsap<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    return () => {
      if (ref.current) {
        gsap.killTweensOf(ref.current);
      }
    };
  }, []);

  return ref;
}

export function useGsapTimeline() {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    timelineRef.current = gsap.timeline();

    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  return timelineRef;
}

export function useScrollTrigger<T extends HTMLElement = HTMLElement>(
  animation: (element: T) => gsap.core.Tween | gsap.core.Timeline,
  options?: ScrollTrigger.Vars
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const tween = animation(element);

    ScrollTrigger.create({
      trigger: element,
      start: 'top 85%',
      end: 'top 20%',
      toggleActions: 'play none none reverse',
      ...options,
      animation: tween,
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [animation, options]);

  return ref;
}

export function useStaggerAnimation<T extends HTMLElement = HTMLElement>(
  delay = 0,
  stagger = 0.05
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.children;
    
    const tween = gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger,
        delay,
        ease: 'power3.out',
      }
    );

    return () => {
      tween.kill();
    };
  }, [delay, stagger]);

  return containerRef;
}

export function useHoverAnimation<T extends HTMLElement = HTMLElement>(
  hoverAnimation: (element: T) => gsap.core.Tween,
  hoverOutAnimation: (element: T) => gsap.core.Tween
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      hoverAnimation(element);
    };

    const handleMouseLeave = () => {
      hoverOutAnimation(element);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(element);
    };
  }, [hoverAnimation, hoverOutAnimation]);

  return ref;
}

export function useParallax<T extends HTMLElement = HTMLElement>(speed = 0.5) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const tween = gsap.to(element, {
      y: () => window.scrollY * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [speed]);

  return ref;
}
