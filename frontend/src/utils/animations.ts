import gsap from 'gsap';

// Next-level animation configuration
export const ANIMATION_CONFIG = {
  // Durations
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    dramatic: 0.8,
  },
  // Easing functions - premium feel
  ease: {
    smooth: 'power2.out',
    snappy: 'power3.inOut',
    bounce: 'back.out(1.7)',
    elastic: 'elastic.out(1, 0.5)',
    expo: 'expo.out',
    circ: 'circ.out',
  },
  // Stagger timing
  stagger: {
    fast: 0.02,
    normal: 0.04,
    slow: 0.08,
  },
};

// Magnetic button effect
export const createMagneticEffect = (element: HTMLElement, strength: number = 0.3) => {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

// Glow pulse effect for special elements
export const animateGlowPulse = (element: HTMLElement) => {
  return gsap.to(element, {
    boxShadow: '0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3)',
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

// Floating animation for decorative elements
export const animateFloat = (element: HTMLElement, amplitude: number = 10) => {
  return gsap.to(element, {
    y: amplitude,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

// Shimmer effect for loading states
export const animateShimmer = (element: HTMLElement) => {
  return gsap.fromTo(
    element,
    { backgroundPosition: '-200% 0' },
    { 
      backgroundPosition: '200% 0', 
      duration: 1.5, 
      repeat: -1, 
      ease: 'none' 
    }
  );
};

// Stagger reveal for lists/grids with scale
export const animateStaggerReveal = (elements: HTMLElement[] | NodeListOf<Element>, options?: { delay?: number }) => {
  return gsap.fromTo(
    elements,
    { 
      opacity: 0, 
      y: 30,
      scale: 0.9,
    },
    { 
      opacity: 1, 
      y: 0,
      scale: 1,
      duration: ANIMATION_CONFIG.duration.normal,
      stagger: ANIMATION_CONFIG.stagger.fast,
      ease: ANIMATION_CONFIG.ease.bounce,
      delay: options?.delay || 0,
    }
  );
};

// Button press effect
export const animateButtonPress = (button: HTMLElement) => {
  gsap.to(button, {
    scale: 0.95,
    duration: ANIMATION_CONFIG.duration.instant,
    ease: ANIMATION_CONFIG.ease.snappy,
  });
};

export const animateButtonRelease = (button: HTMLElement) => {
  gsap.to(button, {
    scale: 1,
    duration: ANIMATION_CONFIG.duration.fast,
    ease: ANIMATION_CONFIG.ease.bounce,
  });
};

// Counter animation for numbers
export const animateCounter = (element: HTMLElement, endValue: number, duration: number = 1) => {
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: ANIMATION_CONFIG.ease.expo,
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toString();
    },
  });
};

// Shake animation for errors/attention
export const animateShake = (element: HTMLElement) => {
  const timeline = gsap.timeline();
  timeline
    .to(element, { x: -10, duration: 0.05 })
    .to(element, { x: 10, duration: 0.05 })
    .to(element, { x: -8, duration: 0.05 })
    .to(element, { x: 8, duration: 0.05 })
    .to(element, { x: -5, duration: 0.05 })
    .to(element, { x: 5, duration: 0.05 })
    .to(element, { x: 0, duration: 0.05 });
  return timeline;
};

// Success checkmark animation
export const animateSuccess = (element: HTMLElement) => {
  const timeline = gsap.timeline();
  timeline
    .fromTo(element, 
      { scale: 0, rotation: -180 },
      { scale: 1.2, rotation: 0, duration: 0.4, ease: ANIMATION_CONFIG.ease.bounce }
    )
    .to(element, { scale: 1, duration: 0.2, ease: ANIMATION_CONFIG.ease.smooth });
  return timeline;
};

// Confetti burst effect
export const createConfetti = (container: HTMLElement, count: number = 50) => {
  const colors = ['#f59e0b', '#ea580c', '#fbbf24', '#f97316', '#fcd34d'];
  const confettiElements: HTMLElement[] = [];
  
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      pointer-events: none;
      left: 50%;
      top: 50%;
    `;
    container.appendChild(confetti);
    confettiElements.push(confetti);
    
    gsap.to(confetti, {
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      rotation: Math.random() * 720 - 360,
      opacity: 0,
      duration: 1 + Math.random() * 0.5,
      ease: 'power2.out',
      onComplete: () => confetti.remove(),
    });
  }
  
  return confettiElements;
};

// Ripple effect on click
export const createRipple = (event: MouseEvent, element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    left: ${event.clientX - rect.left - size / 2}px;
    top: ${event.clientY - rect.top - size / 2}px;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  gsap.to(ripple, {
    scale: 2,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => ripple.remove(),
  });
};

// Text reveal animation
export const animateTextReveal = (element: HTMLElement) => {
  const text = element.textContent || '';
  element.textContent = '';
  
  const chars = text.split('').map(char => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    element.appendChild(span);
    return span;
  });
  
  return gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.05,
    stagger: 0.02,
    ease: ANIMATION_CONFIG.ease.smooth,
  });
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
