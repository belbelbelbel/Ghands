import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, SHADOWS } from '@/lib/designSystem';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors.backgroundLight,
          ...SHADOWS.md,
        };
      case 'outlined':
        return {
          backgroundColor: Colors.backgroundLight,
          borderWidth: 1,
          borderColor: Colors.border,
        };
      case 'flat':
        return {
          backgroundColor: Colors.backgroundLight,
        };
      default:
        return {
          backgroundColor: Colors.backgroundLight,
          ...SHADOWS.sm,
        };
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.md;
      case 'md':
        return Spacing.lg;
      case 'lg':
        return Spacing.xl;
      default:
        return Spacing.lg;
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: BorderRadius.lg,
          padding: getPadding(),
          ...getVariantStyles(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

