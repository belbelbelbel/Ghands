import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authService } from '@/services/authService';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { isPublicUnauthenticatedRoute } from '@/utils/authPublicRoutes';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { logoutExpiredSession, redirectUnauthenticated } from '@/utils/tokenExpirationHandler';

/** How often to re-check JWT expiry while the app is open */
const SESSION_POLL_MS = 60_000;
/** Delay only the first cold-start check so SecureStore can hydrate */
const SESSION_BOOT_DELAY_MS = 1500;

/**
 * - Missing token on a protected screen → redirect to login (by stored role).
 * - Expired JWT → clear session and redirect to role login.
 * Runs on an interval, when the route changes, and when the app returns to foreground.
 */
export function useSessionTimeout(router: any, pathname?: string | null) {
  const routing = useRef(false);
  const pathnameRef = useRef(pathname);
  const isColdStartRef = useRef(true);
  pathnameRef.current = pathname;

  useEffect(() => {
    const enforceAuth = async () => {
      if (routing.current) return;
      try {
        if (await isRoleSwitchInProgress()) return;

        const path = pathnameRef.current;
        if (isPublicUnauthenticatedRoute(path)) return;

        const token = await authService.getAuthToken();

        if (!token) {
          routing.current = true;
          await redirectUnauthenticated(router);
          return;
        }

        if (!isAccessTokenExpired(token)) return;

        routing.current = true;
        await logoutExpiredSession(router);
      } catch {
        /* ignore */
      } finally {
        routing.current = false;
      }
    };

    if (isColdStartRef.current) {
      isColdStartRef.current = false;
      const bootTimer = setTimeout(() => {
        void enforceAuth();
      }, SESSION_BOOT_DELAY_MS);

      const id = setInterval(enforceAuth, SESSION_POLL_MS);
      const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
        if (next === 'active') void enforceAuth();
      });

      return () => {
        clearTimeout(bootTimer);
        clearInterval(id);
        sub.remove();
      };
    }

    void enforceAuth();

    const id = setInterval(enforceAuth, SESSION_POLL_MS);
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void enforceAuth();
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [router, pathname]);
}
