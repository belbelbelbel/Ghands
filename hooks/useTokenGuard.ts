import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { authService } from '@/services/api';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { isPublicUnauthenticatedRoute } from '@/utils/authPublicRoutes';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { redirectToAuthScreen } from '@/utils/authNavigationGuard';

/**
 * On protected screens: missing token or expired JWT → role login (client or provider).
 */
export function useTokenGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const enforce = async () => {
      try {
        if (isPublicUnauthenticatedRoute(pathname)) return;
        if (await isRoleSwitchInProgress()) return;
        if (!isMounted) return;

        const token = await authService.getAuthToken();

        if (!token) {
          await redirectToAuthScreen(router, { pathname, clearSession: false });
          return;
        }

        if (isAccessTokenExpired(token)) {
          await redirectToAuthScreen(router, { pathname, clearSession: true });
        }
      } catch {
        if (isMounted) {
          await redirectToAuthScreen(router, { pathname, clearSession: true });
        }
      }
    };

    void enforce();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);
}
