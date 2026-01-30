import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';

const AUTH_ROLE_KEY = '@ghands:user_role';

/**
 * Handles token expiration by clearing auth data and returning the appropriate login route
 * Users with expired tokens should be redirected to login, not signup, since they already have accounts
 * @returns The route to navigate to based on user role, or null if no role found
 */
export async function handleTokenExpiration(): Promise<string | null> {
  try {
    // Get user role before clearing tokens
    const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
    
    // Clear all auth tokens via AuthService.
    // IMPORTANT: We intentionally DO NOT clear the saved role here.
    // The role tells us whether the user is a client or provider so we can
    // send them to the correct login screen. Clearing it would make the app
    // think this is a brand‑new user and send them back to the role selection.
    await authService.clearAuthTokens();
    
    // Return appropriate login route based on role
    // Users with expired tokens should login again, not signup
    if (role === 'provider') {
      return '/ProviderSignInScreen';
    } else if (role === 'client') {
      return '/LoginScreen';
    }
    
    // No role found - go to account type selection
    return '/SelectAccountTypeScreen';
  } catch (error) {
    // Silent error - fallback to account type selection
    return '/SelectAccountTypeScreen';
  }
}

/**
 * Checks if error is a token expiration error (401)
 */
export function isTokenExpirationError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  const message = (error?.message || error?.details?.data?.error || '').toLowerCase();
  
  return (
    status === 401 ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('token expired') ||
    message.includes('not authenticated') ||
    message.includes('no authorization token') ||
    message.includes('authentication required')
  );
}
