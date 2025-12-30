import gsap from 'gsap';

// Consistent animation configuration
export const ANIMATION_CONFIG = {
  // Durations
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  // Easing functions
  ease: {
    smooth: 'power2.out',
    snappy: 'power2.inOut',
    bounce: 'back.out(1.4)',
  },
  // Stagger timing
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.1,
  },
};

// Page header animation - subtle, no layout shift
export const animatePageHeader = (element: HTMLElement) => {
  const timeline = gsap.timeline();
  
  const title = element.querySelector('h1');
  const divider = element.querySelector('.divider');
  const subtitle = element.querySelector('p');
  
  // Subtle fade in only, no position changes to prevent layout shift
  if (title) {
    timeline.fromTo(
      title,
      { opacity: 0.8 },
      { opacity: 1, duration: ANIMATION_CONFIG.duration.normal, ease: ANIMATION_CONFIG.ease.smooth }
    );
  }
  
  if (divider) {
    timeline.fromTo(
      divider,
      { scaleX: 0 },
      { scaleX: 1, duration: ANIMATION_CONFIG.duration.normal, ease: ANIMATION_CONFIG.ease.smooth },
      '-=0.2'
    );
  }
  
  if (subtitle) {
    timeline.fromTo(
      subtitle,
      { opacity: 0.8 },
      { opacity: 1, duration: ANIMATION_CONFIG.duration.normal, ease: ANIMATION_CONFIG.ease.smooth },
      '-=0.15'
    );
  }
  
  return timeline;
};

// Fade in animation - subtle, no layout shift
export const animateFadeIn = (element: HTMLElement, delay = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0.8 },
    { 
      opacity: 1, 
      duration: ANIMATION_CONFIG.duration.normal, 
      delay,
      ease: ANIMATION_CONFIG.ease.smooth 
    }
  );
};

// Grid stagger animation - subtle, no layout shift
export const animateGrid = (container: HTMLElement) => {
  const items = container.children;
  
  return gsap.fromTo(
    items,
    { opacity: 0.5 },
    { 
      opacity: 1, 
      duration: ANIMATION_CONFIG.duration.normal,
      stagger: ANIMATION_CONFIG.stagger.fast,
      ease: ANIMATION_CONFIG.ease.smooth,
      clearProps: 'all'
    }
  );
};

// Card hover animation
export const animateCardHover = (card: HTMLElement, isEntering: boolean) => {
  if (isEntering) {
    gsap.to(card, {
      y: -8,
      scale: 1.02,
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.ease.smooth,
    });
  } else {
    gsap.to(card, {
      y: 0,
      scale: 1,
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.ease.smooth,
    });
  }
};

// Modal animations
export const animateModalOpen = (overlay: HTMLElement, content: HTMLElement) => {
  const timeline = gsap.timeline();
  
  timeline
    .fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: ANIMATION_CONFIG.duration.normal, ease: ANIMATION_CONFIG.ease.smooth }
    )
    .fromTo(
      content,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: ANIMATION_CONFIG.duration.normal, ease: ANIMATION_CONFIG.ease.smooth },
      '-=0.1'
    );
  
  return timeline;
};

export const animateModalClose = (overlay: HTMLElement, content: HTMLElement, onComplete: () => void) => {
  const timeline = gsap.timeline({ onComplete });
  
  timeline
    .to(content, {
      opacity: 0,
      scale: 0.95,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: ANIMATION_CONFIG.ease.smooth
    })
    .to(overlay, {
      opacity: 0,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: ANIMATION_CONFIG.ease.smooth
    }, '-=0.1');
  
  return timeline;
};

// Crossfade transition
export const animateCrossfade = (element: HTMLElement, callback: () => void) => {
  return gsap.to(element, {
    opacity: 0,
    duration: ANIMATION_CONFIG.duration.fast,
    ease: ANIMATION_CONFIG.ease.snappy,
    onComplete: () => {
      callback();
      gsap.fromTo(
        element,
        { opacity: 0 },
        { opacity: 1, duration: ANIMATION_CONFIG.duration.fast, ease: ANIMATION_CONFIG.ease.snappy }
      );
    }
  });
};
