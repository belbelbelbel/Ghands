import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/api';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { handleTokenExpiration } from '@/utils/tokenExpirationHandler';

const AUTH_TOKEN_KEY = '@ghands:auth_token';
const AUTH_ROLE_KEY = '@ghands:user_role';

/**
 * Hook that checks for token on mount and redirects if missing
 * Prevents unauthorized access to protected screens
 */
export function useTokenGuard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkTokenAndRedirect = async () => {
      try {
        // Check token directly from AsyncStorage for immediate check
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        
        // Also verify with authService for validation (checks format and validity)
        const validToken = await authService.getAuthToken();
        
        // If no token found or token is invalid, redirect immediately
        if (!token || !validToken) {
          if (!isMounted) return;
          
          // Get role to determine redirect destination
          const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
          
          if (role === 'provider') {
            router.replace('/ProviderSignInScreen');
          } else if (role === 'client') {
            router.replace('/LoginScreen');
          } else {
            // No role found - go to account type selection
            router.replace('/SelectAccountTypeScreen');
          }
          // Don't set isChecking to false here - let redirect happen
          return;
        }
        
        // JWT: session timeout — expired access token → same logout routes as API auth failures
        if (validToken && isAccessTokenExpired(validToken)) {
          if (!isMounted) return;
          const route = await handleTokenExpiration();
          if (route) router.replace(route as never);
          else router.replace('/SelectAccountTypeScreen' as never);
          return;
        }
        
        // Token is valid - allow rendering
        if (isMounted) {
          setIsChecking(false);
        }
      } catch (error) {
        // On error, redirect to account type selection
        if (isMounted) {
          router.replace('/SelectAccountTypeScreen');
          setIsChecking(false);
        }
      }
    };

    checkTokenAndRedirect();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [router]);

  return { isChecking };
}
