import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authService } from '@/services/authService';
import { handleTokenExpiration } from '@/utils/tokenExpirationHandler';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';

/** How often to re-check JWT expiry while the app is open */
const POLL_MS = 60_000;

type RouterLike = { replace: (href: string) => void };

/**
 * Session timeout: when the access token’s JWT `exp` is in the past, clear auth and
 * navigate to the same login/logout screens as other auth failures.
 * Runs on an interval and when the app returns to the foreground.
 */
export function useSessionTimeout(router: RouterLike) {
  const routing = useRef(false);

  useEffect(() => {
    const logoutIfExpired = async () => {
      if (routing.current) return;
      try {
        const token = await authService.getAuthToken();
        if (!token) return;
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

    const id = setInterval(logoutIfExpired, POLL_MS);
    logoutIfExpired();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') logoutIfExpired();
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [router]);
}
