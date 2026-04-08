import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/lib/designSystem';

/**
 * Korapay / deposit deep-link target (expo-linking createURL path).
 * If the user lands here outside an auth session, send them back to Top Up to verify.
 */
export default function WalletDepositReturnScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/TopUpScreen' as any);
    }, 100);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundLight }}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}
