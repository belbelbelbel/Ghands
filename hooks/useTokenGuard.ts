import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { authService } from '@/services/api';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { isPublicUnauthenticatedRoute } from '@/utils/authPublicRoutes';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { logoutExpiredSession, redirectUnauthenticated } from '@/utils/tokenExpirationHandler';

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
          await redirectUnauthenticated(router);
          return;
        }

        if (isAccessTokenExpired(token)) {
          await logoutExpiredSession(router);
        }
      } catch {
        if (isMounted) {
          await logoutExpiredSession(router);
        }
      }
    };

    void enforce();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);
}
