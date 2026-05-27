import { useRouter, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import useOnboarding from '../hooks/useOnboarding';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAppEntryRoute } from '@/utils/authPublicRoutes';
import { ScreenBootLoader } from '@/components/ScreenBootLoader';

const AUTH_ROLE_KEY = '@ghands:user_role';

export default function EntryPoint() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: onboardingLoading } = useOnboarding();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      try {
        // Get current route - normalize it
        const currentRoute = pathname || '/';
        const normalizedRoute = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;

        // Only run entry routing from `/` — never hijack stack/deep-link screens.
        if (!isAppEntryRoute(normalizedRoute)) {
          return;
        }

        // Check if user is authenticated
        const token = await authService.getAuthToken();
        const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
        
        if (token && role) {
          hasRedirectedRef.current = true;
          const targetRoute = role === 'provider' ? '/provider/home' : '/(tabs)/home';
          router.replace(targetRoute);
          return;
        }

        if (!token && (role === 'client' || role === 'provider')) {
          hasRedirectedRef.current = true;
          const loginRoute = role === 'provider' ? '/ProviderSignInScreen' : '/LoginScreen';
          router.replace(loginRoute as never);
          return;
        }

        if (!onboardingLoading) {
          hasRedirectedRef.current = true;
          router.replace('/SelectAccountTypeScreen');
          return;
        }
      } catch {
        const currentRoute = pathname || '/';
        const normalizedRoute = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;

        if (!isAppEntryRoute(normalizedRoute)) {
          return;
        }

        hasRedirectedRef.current = true;
        router.replace('/SelectAccountTypeScreen');
      }
    };

    // Small delay to ensure pathname is set
    const timer = setTimeout(() => {
      checkAuthAndRoute();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [onboardingLoading, router, pathname]);

  return <ScreenBootLoader />;
}
