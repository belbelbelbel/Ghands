import { DESIGN_TOKENS } from './assets';

/**
 * Comprehensive Design System
 * Use these constants throughout the app for consistency
 */

export const Colors = DESIGN_TOKENS.colors;
export const Spacing = DESIGN_TOKENS.spacing;
export const Fonts = DESIGN_TOKENS.fonts;
export const BorderRadius = DESIGN_TOKENS.borderRadius;

/**
 * Standardized spacing scale
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/**
 * Standardized screen padding
 */
export const SCREEN_PADDING = {
  horizontal: 20,
  vertical: 24,
  top: 24,
  bottom: 24,
} as const;

/**
 * Standardized button heights
 */
export const BUTTON_HEIGHTS = {
  small: 40,
  medium: 48,
  large: 56,
} as const;

/**
 * Standardized input heights
 */
export const INPUT_HEIGHTS = {
  small: 44,
  medium: 52,
  large: 60,
} as const;

/**
 * Standardized shadow styles
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

/**
 * Standardized opacity values
 */
export const OPACITY = {
  disabled: 0.5,
  pressed: 0.8,
  overlay: 0.5,
  subtle: 0.1,
} as const;

/**
 * Standardized border widths
 */
export const BORDER_WIDTH = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

/**
 * Standardized icon sizes
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/**
 * Standardized animation durations
 */
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

/**
 * Helper function to get consistent spacing
 */
export function getSpacing(multiplier: number = 1): number {
  return SPACING.md * multiplier;
}

/**
 * Helper function to get screen padding
 */
export function getScreenPadding(side: 'horizontal' | 'vertical' | 'top' | 'bottom' = 'horizontal'): number {
  return SCREEN_PADDING[side];
}
