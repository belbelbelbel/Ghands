import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { getLoginRouteForStoredRole } from '@/utils/authPublicRoutes';

const AUTH_ROLE_KEY = '@ghands:user_role';

/** Login route for the stored role (does not clear tokens). */
export async function getRoleLoginRoute(): Promise<string> {
  const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
  if (role === 'provider') return '/ProviderSignInScreen';
  if (role === 'client') return '/LoginScreen';
  return '/SelectAccountTypeScreen';
}

/**
 * Clears auth tokens and returns the login route for the user's last role.
 * Keeps `@ghands:user_role` so expired sessions land on the correct login — not role selection.
 */
export async function handleTokenExpiration(): Promise<string> {
  try {
    const route = await getRoleLoginRoute();
    await authService.clearAuthTokens();
    return route;
  } catch {
    return '/SelectAccountTypeScreen';
  }
}

type RouterLike = { replace: (href: any) => void };

/** Clear session and navigate to client or provider login based on stored role. */
export async function logoutExpiredSession(
  router: RouterLike,
  pathname?: string | null
): Promise<void> {
  const { redirectToAuthScreen } = await import('@/utils/authNavigationGuard');
  await redirectToAuthScreen(router, { pathname, clearSession: true });
}

/**
 * Missing or expired token on a protected screen → role login (or account picker if unknown).
 */
export async function redirectUnauthenticated(
  router: RouterLike,
  pathname?: string | null
): Promise<void> {
  const { redirectToAuthScreen } = await import('@/utils/authNavigationGuard');
  const token = await authService.getAuthToken();
  await redirectToAuthScreen(router, {
    pathname,
    clearSession: Boolean(token),
  });
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
