import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import useOnboarding from '../hooks/useOnboarding';

export default function EntryPoint() {
  const router = useRouter();
  const { isOnboardingComplete, isLoading } = useOnboarding();

  useEffect(() => {
    if (!isLoading) {
      const destination = isOnboardingComplete ? '/(tabs)/home' : '/onboarding';
      router.replace(destination);
    }
  }, [isLoading, isOnboardingComplete, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
      }}
    >
      <ActivityIndicator size="large" color="#D8FF2E" />
    </View>
  );
}