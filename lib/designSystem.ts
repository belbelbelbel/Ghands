import { DESIGN_TOKENS } from './assets';

/**
 * Design System Utilities
 * Provides consistent styling helpers for the entire application
 */

export const Colors = DESIGN_TOKENS.colors;
export const Spacing = DESIGN_TOKENS.spacing;
export const BorderRadius = DESIGN_TOKENS.borderRadius;
export const Fonts = DESIGN_TOKENS.fonts;

/**
 * Common style presets for consistent UI components
 */
export const CommonStyles = {
  // Card styles
  card: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.default,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: Colors.black,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  buttonDanger: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorLight,
  },
  
  // Text styles
  textPrimary: {
    ...Fonts.bodyMedium,
    color: Colors.textPrimary,
  },
  
  textSecondary: {
    ...Fonts.bodySmall,
    color: Colors.textSecondaryDark,
  },
  
  textTertiary: {
    ...Fonts.bodyTiny,
    color: Colors.textTertiary,
  },
  
  // Badge styles
  badgeSuccess: {
    backgroundColor: Colors.successLight,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  
  // Container styles
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 1,
    paddingBottom: Spacing.md,
  },
  
  // Section header
  sectionHeader: {
    ...Fonts.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
};

