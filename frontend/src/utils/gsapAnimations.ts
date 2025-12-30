import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const gsapAnimations = {
  // Page transition animations
  pageEnter: (element: HTMLElement) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      }
    );
  },

  pageExit: (element: HTMLElement) => {
    return gsap.to(element, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power3.in',
    });
  },

  // Card animations
  cardHover: (element: HTMLElement) => {
    return gsap.to(element, {
      y: -8,
      scale: 1.02,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      duration: 0.3,
      ease: 'power2.out',
    });
  },

  cardHoverOut: (element: HTMLElement) => {
    return gsap.to(element, {
      y: 0,
      scale: 1,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
    });
  },

  // Stagger animations for lists
  staggerIn: (elements: HTMLElement[] | NodeListOf<Element>, delay = 0) => {
    return gsap.fromTo(
      elements,
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
        stagger: 0.05,
        delay,
        ease: 'power3.out',
      }
    );
  },

  // Scroll-triggered animations
  scrollReveal: (element: HTMLElement, options = {}) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
          ...options,
        },
      }
    );
  },

  // Header animations
  headerEnter: (element: HTMLElement) => {
    const timeline = gsap.timeline();
    
    timeline
      .fromTo(
        element.querySelector('h1'),
        { opacity: 0, y: -30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }
      )
      .fromTo(
        element.querySelector('.divider'),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      )
      .fromTo(
        element.querySelector('p'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );

    return timeline;
  },

  // Filter panel animations
  filterExpand: (element: HTMLElement) => {
    return gsap.fromTo(
      element,
      {
        height: 0,
        opacity: 0,
      },
      {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      }
    );
  },

  filterCollapse: (element: HTMLElement) => {
    return gsap.to(element, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    });
  },

  // Button press animation
  buttonPress: (element: HTMLElement) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(element, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.in',
      })
      .to(element, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)',
      });

    return timeline;
  },

  // Floating animation for icons
  float: (element: HTMLElement) => {
    return gsap.to(element, {
      y: -10,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  },

  // Pulse animation
  pulse: (element: HTMLElement) => {
    return gsap.to(element, {
      scale: 1.1,
      duration: 0.8,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true,
    });
  },

  // Shake animation for errors
  shake: (element: HTMLElement) => {
    return gsap.fromTo(
      element,
      { x: -5 },
      {
        x: 5,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: 'power2.inOut',
      }
    );
  },

  // Mobile swipe animation
  swipeOut: (element: HTMLElement, direction: 'left' | 'right' = 'left') => {
    return gsap.to(element, {
      x: direction === 'left' ? -window.innerWidth : window.innerWidth,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
    });
  },

  // Loading spinner
  spin: (element: HTMLElement) => {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      ease: 'none',
      repeat: -1,
    });
  },

  // Number counter animation
  countUp: (element: HTMLElement, from: number, to: number, duration = 1) => {
    const obj = { value: from };
    return gsap.to(obj, {
      value: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString();
      },
    });
  },

  // Parallax effect
  parallax: (element: HTMLElement, speed = 0.5) => {
    return gsap.to(element, {
      y: () => window.scrollY * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  },

  // Cleanup function
  cleanup: () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  },
};

export default gsapAnimations;
