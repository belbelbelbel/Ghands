import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthRole } from '../hooks/useAuth';
import useOnboarding from '../hooks/useOnboarding';

export default function EntryPoint() {
  const router = useRouter();
  const { isOnboardingComplete, isLoading } = useOnboarding();
  const { role, isRoleLoading } = useAuthRole();

  useEffect(() => {
    if (isLoading || isRoleLoading) {
      return;
    }

    if (!isOnboardingComplete) {
      router.replace('/onboarding');
      return;
    }

    const destination = role === 'provider' ? '/provider/home' : '/(tabs)/home';
    router.replace(destination);
  }, [isLoading, isRoleLoading, isOnboardingComplete, role, router]);

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