import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authService } from '@/services/authService';
import { handleTokenExpiration } from '@/utils/tokenExpirationHandler';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { getLoginRouteForStoredRole, isPublicUnauthenticatedRoute } from '@/utils/authPublicRoutes';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';

/** How often to re-check JWT expiry while the app is open */
const SESSION_POLL_MS = 60_000;
/** Delay first auth check so SecureStore / AsyncStorage can finish hydrating */
const SESSION_BOOT_DELAY_MS = 1500;

/**
 * - Missing token on a protected screen → redirect to login (by stored role).
 * - Expired JWT → clear session and redirect like other auth failures.
 * Runs on an interval, when the route changes, and when the app returns to foreground.
 */
export function useSessionTimeout(router: any, pathname?: string | null) {
  const routing = useRef(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const enforceAuth = async () => {
      if (routing.current) return;
      try {
        const token = await authService.getAuthToken();
        const path = pathnameRef.current;

        if (!token) {
          if (await isRoleSwitchInProgress()) return;
          if (isPublicUnauthenticatedRoute(path)) return;
          routing.current = true;
          const route = await getLoginRouteForStoredRole();
          router.replace(route as never);
          return;
        }

        if (!isAccessTokenExpired(token)) return;
        routing.current = true;
        const route = await handleTokenExpiration();
        if (route) router.replace(route as never);
        else router.replace('/SelectAccountTypeScreen' as never);
      } catch {
        /* ignore */
      } finally {
        routing.current = false;
      }
    };

    const id = setInterval(enforceAuth, SESSION_POLL_MS);

    const bootTimer = setTimeout(() => {
      void enforceAuth();
    }, SESSION_BOOT_DELAY_MS);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') enforceAuth();
    });

    return () => {
      clearTimeout(bootTimer);
      clearInterval(id);
      sub.remove();
    };
  }, [router, pathname]);
}
