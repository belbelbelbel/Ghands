import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api';

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
    
    // Clear all auth tokens
    await apiClient.clearAuthTokens();
    
    // Clear role
    await AsyncStorage.removeItem(AUTH_ROLE_KEY);
    
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
    console.error('Error handling token expiration:', error);
    // Fallback to account type selection
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
