// Haptic feedback utility for better mobile UX

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback on supported devices
 * Works on iOS Safari and Android Chrome
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  // Check if device supports haptic feedback
  if (!('vibrate' in navigator)) {
    return;
  }

  // Different vibration patterns for different feedback types
  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30]
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug('Haptic feedback not supported:', error);
  }
}

/**
 * Haptic feedback for common actions
 */
export const haptics = {
  // UI interactions
  light: () => triggerHaptic('light'),
  tap: () => triggerHaptic('light'),
  select: () => triggerHaptic('medium'),
  toggle: () => triggerHaptic('medium'),
  
  // Feedback
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  
  // Specific actions
  favorite: () => triggerHaptic('success'),
  unfavorite: () => triggerHaptic('light'),
  filter: () => triggerHaptic('medium'),
  scroll: () => triggerHaptic('light'),
  swipe: () => triggerHaptic('light'),
};
