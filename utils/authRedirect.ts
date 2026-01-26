import { authService } from '@/services/authService';
import { handleTokenExpiration } from './tokenExpirationHandler';

/**
 * Handles AuthError by clearing tokens and redirecting to login
 * Use this in catch blocks when AuthError is caught
 */
export async function handleAuthErrorRedirect(router: any): Promise<void> {
  try {
    // Get role BEFORE clearing tokens (so we know where to redirect)
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const role = await AsyncStorage.getItem('@ghands:user_role');
    
    // Clear auth tokens
    await authService.clearAuthTokens();
    
    // Determine redirect route based on role
    let redirectRoute = '/SelectAccountTypeScreen';
    if (role === 'provider') {
      redirectRoute = '/ProviderSignInScreen';
    } else if (role === 'client') {
      redirectRoute = '/LoginScreen';
    }
    
    // Clear role after determining route
    await AsyncStorage.removeItem('@ghands:user_role');
    
    // Navigate immediately
    router.replace(redirectRoute as any);
  } catch (redirectError) {
    // On any error, try to redirect to provider login (most common case)
    try {
      router.replace('/ProviderSignInScreen' as any);
    } catch {
      // Last resort - account selection
      try {
        router.replace('/SelectAccountTypeScreen' as any);
      } catch {
        // Silent fail
      }
    }
  }
}
