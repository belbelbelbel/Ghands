import { authService } from '@/services/authService';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';

/**
 * Handles AuthError by clearing tokens and redirecting to login
 * Use this in catch blocks when AuthError is caught
 */
export async function handleAuthErrorRedirect(router: any): Promise<void> {
  try {
    // Get role BEFORE clearing tokens (so we know where to redirect)
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    if (await isRoleSwitchInProgress()) return;

    const role = await AsyncStorage.getItem('@ghands:user_role');
    
    // Clear auth tokens
    await authService.clearAuthTokens();
    
    // Determine redirect route based on role (same rule as manual logout in useAuth)
    let redirectRoute = '/SelectAccountTypeScreen';
    if (role === 'provider') {
      redirectRoute = '/ProviderSignInScreen';
    } else if (role === 'client') {
      redirectRoute = '/LoginScreen';
    }

    // Keep @ghands:user_role — do not clear it here. Clearing it lets app/index.tsx treat the
    // user as brand-new and replace() to SelectAccountTypeScreen, racing past login navigation.

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
