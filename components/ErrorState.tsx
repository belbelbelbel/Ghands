import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, SHADOWS } from '@/lib/designSystem';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { Button } from './ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  iconSize?: number;
}

/**
 * Professional Error State Component
 * Use this for consistent error states throughout the app
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
  iconSize = 48,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { width: iconSize + 16, height: iconSize + 16 }]}>
          <AlertCircle size={iconSize} color={Colors.error} />
        </View>
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <View style={styles.actionContainer}>
          <Button
            title={retryLabel}
            onPress={onRetry}
            variant="primary"
            size="medium"
            icon={<RefreshCw size={18} color={Colors.white} />}
            iconPosition="left"
          />
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
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: Spacing.xl,
  },
  actionContainer: {
    marginTop: Spacing.md,
    width: '100%',
    maxWidth: 200,
  },
});

export default ErrorState;
