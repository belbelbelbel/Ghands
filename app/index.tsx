import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import useOnboarding from '../hooks/useOnboarding';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ROLE_KEY = '@ghands:user_role';

export default function EntryPoint() {
  const router = useRouter();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboarding();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      try {
        // Check if user is authenticated
        const token = await authService.getAuthToken();
        const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
        
        if (token && role) {
          // User is authenticated - go directly to their home screen based on role
          // Skip onboarding check for authenticated users
          if (role === 'provider') {
            router.replace('/provider/home');
          } else {
            router.replace('/(tabs)/home');
          }
          return;
        }

        // User is not authenticated - check onboarding status
        if (!onboardingLoading) {
          if (isOnboardingComplete) {
            // Onboarding complete but not authenticated - go to account selection
            router.replace('/SelectAccountTypeScreen');
          } else {
            // First time user - show onboarding/account selection
            router.replace('/SelectAccountTypeScreen');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking auth:', error);
        }
        // On error, go to account selection
        router.replace('/SelectAccountTypeScreen');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndRoute();
  }, [onboardingLoading, isOnboardingComplete, router]);

  // Return null - we redirect immediately, no splash screen here
  return null;
}
