import * as Haptics from 'expo-haptics';

export type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';

/**
 * Custom hook for haptic feedback
 * Provides consistent haptic patterns throughout the app
 */
export function useHaptics() {
  const trigger = (type: HapticType) => {
    switch (type) {
      case 'success':
        // Success pattern: medium impact followed by light impact
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 50);
        break;
      case 'warning':
        // Warning pattern: medium impact
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'error':
        // Error pattern: heavy impact
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return { trigger };
}

/**
 * Direct haptic functions for convenience
 */
export const haptics = {
  success: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 50);
  },
  warning: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  error: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => Haptics.selectionAsync(),
};



