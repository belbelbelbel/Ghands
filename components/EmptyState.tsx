import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, SHADOWS } from '@/lib/designSystem';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  iconName?: keyof typeof require('lucide-react-native');
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
}

/**
 * Professional Empty State Component
 * Use this for consistent empty states throughout the app
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
  iconSize = 64,
  iconColor = Colors.textTertiary,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon || (
          <View
            style={[
              styles.iconCircle,
              {
                width: iconSize + 24,
                height: iconSize + 24,
              },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                {
                  width: iconSize,
                  height: iconSize,
                },
              ]}
            />
          </View>
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Text style={styles.actionText} onPress={onAction}>
            {actionLabel}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.xxxl * 2,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  iconInner: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundGray,
    opacity: 0.3,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.accent,
    textAlign: 'center',
  },
});

export default EmptyState;
