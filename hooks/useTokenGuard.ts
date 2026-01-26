import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/api';

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
        
        // Additional check: If token exists but might be expired/invalid on server,
        // we'll let API calls handle it and redirect via AuthError handling
        // But we can also do a quick validation by checking if token looks expired
        // For JWT tokens, we can decode and check expiration
        if (validToken && validToken.includes('.')) {
          try {
            // Try to decode JWT to check expiration
            const parts = validToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const exp = payload.exp;
              if (exp && exp * 1000 < Date.now()) {
                // Token is expired - redirect
                if (!isMounted) return;
                const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
                if (role === 'provider') {
                  router.replace('/ProviderSignInScreen');
                } else if (role === 'client') {
                  router.replace('/LoginScreen');
                } else {
                  router.replace('/SelectAccountTypeScreen');
                }
                return;
              }
            }
          } catch (e) {
            // If we can't decode, assume it's valid and let API handle it
          }
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
