import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';

interface AnimatedStatusChipProps {
  status: string;
  statusColor: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

/**
 * Animated status chip with smooth color and scale transitions
 * Used for job states, booking status, etc.
 */
export default function AnimatedStatusChip({
  status,
  statusColor,
  textColor,
  size = 'medium',
  animated = true,
}: AnimatedStatusChipProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();

      // Color fade animation
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      scaleAnim.setValue(1);
      colorAnim.setValue(1);
    }
  }, [animated, scaleAnim, colorAnim]);

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const sizeStyles = {
    small: {
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: Spacing.xs,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs + 2,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          backgroundColor: statusColor,
          transform: [{ scale }],
          borderRadius: BorderRadius.default,
        },
        currentSize,
      ]}
    >
      <Text
        style={[
          Fonts.label,
          {
            color: textColor || Colors.textPrimary,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {status}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
});



