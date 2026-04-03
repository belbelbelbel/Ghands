import { BorderRadius, Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { RefreshCw } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NO_INTERNET_IMG = require('../assets/images/nointernetimg.png');

type NoInternetScreenProps = {
  onRetry: () => void | Promise<void>;
};

/**
 * Full-screen offline state (provider home & similar). Does not clear auth.
 */
export default function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    haptics.light();
    setBusy(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root} accessibilityRole="none">
      <Image source={NO_INTERNET_IMG} style={styles.illustration} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text style={styles.title}>Whoops!</Text>
      <Text style={styles.body}>
        No internet connection found. Check your internet connection or try again.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        disabled={busy}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        {busy ? (
          <ActivityIndicator size="small" color={Colors.textPrimary} style={{ marginRight: 8 }} />
        ) : (
          <RefreshCw size={20} color={Colors.textPrimary} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const BG = '#F9F9F7';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  illustration: {
    width: 260,
    height: 220,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.white,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textPrimary,
  },
});
