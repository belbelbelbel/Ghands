import { useRouter, usePathname } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import useOnboarding from '../hooks/useOnboarding';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ROLE_KEY = '@ghands:user_role';

// List of screens that should NOT be redirected away from
const ALLOWED_UNAUTHENTICATED_ROUTES = [
  '/LoginScreen',
  '/ProviderSignInScreen',
  '/SignupScreen',
  '/ProviderSignupScreen',
  '/SelectAccountTypeScreen',
  '/ResetPassword',
  '/CreatePINScreen',
  '/provider-onboarding',
  '/onboarding',
];

export default function EntryPoint() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboarding();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      try {
        // Get current route - normalize it
        const currentRoute = pathname || '/';
        const normalizedRoute = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;
        
        // If user is already on a login/signup screen, don't redirect
        // This prevents redirect loops after logout
        const isOnAllowedRoute = ALLOWED_UNAUTHENTICATED_ROUTES.some(route => 
          normalizedRoute.includes(route) || normalizedRoute === route
        );
        
        if (isOnAllowedRoute) {
          setIsCheckingAuth(false);
          hasRedirectedRef.current = false; // Reset so we can redirect again if needed
          return;
        }

        // Check if user is authenticated
        const token = await authService.getAuthToken();
        const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
        
        if (token && role) {
          // User is authenticated - go directly to their home screen based on role
          // Skip onboarding check for authenticated users
          // Only redirect if not already on the target screen
          const targetRoute = role === 'provider' ? '/provider/home' : '/(tabs)/home';
          if (normalizedRoute !== targetRoute && !normalizedRoute.includes(targetRoute)) {
            hasRedirectedRef.current = true;
            if (role === 'provider') {
              router.replace('/provider/home');
            } else {
              router.replace('/(tabs)/home');
            }
          }
          setIsCheckingAuth(false);
          return;
        }

        // User is not authenticated - check onboarding status
        // Only redirect if not already on a login/signup screen
        if (!onboardingLoading && !isOnAllowedRoute) {
          hasRedirectedRef.current = true;
          if (isOnboardingComplete) {
            // Onboarding complete but not authenticated - go to account selection
            router.replace('/SelectAccountTypeScreen');
          } else {
            // First time user - show onboarding/account selection
            router.replace('/SelectAccountTypeScreen');
          }
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking auth:', error);
        }
        // On error, only redirect if not already on a login/signup screen
        const currentRoute = pathname || '/';
        const normalizedRoute = currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`;
        const isOnAllowedRoute = ALLOWED_UNAUTHENTICATED_ROUTES.some(route => 
          normalizedRoute.includes(route) || normalizedRoute === route
        );
        
        if (!isOnAllowedRoute) {
          hasRedirectedRef.current = true;
          router.replace('/SelectAccountTypeScreen');
        } else {
          setIsCheckingAuth(false);
        }
      }
    };

    // Small delay to ensure pathname is set
    const timer = setTimeout(() => {
      checkAuthAndRoute();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [onboardingLoading, isOnboardingComplete, router, pathname]);

  // Return null - we redirect immediately, no splash screen here
  return null;
}
