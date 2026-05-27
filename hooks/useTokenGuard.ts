import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { authService } from '@/services/api';
import { isAccessTokenExpired } from '@/utils/jwtExpiry';
import { handleTokenExpiration } from '@/utils/tokenExpirationHandler';
import { isPublicUnauthenticatedRoute, getLoginRouteForStoredRole } from '@/utils/authPublicRoutes';
import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { usePathname } from 'expo-router';

/**
 * Hook that checks for token on mount and redirects if missing
 * Prevents unauthorized access to protected screens
 */
export function useTokenGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const finish = () => {
      if (isMounted) setIsChecking(false);
    };

    const checkTokenAndRedirect = async () => {
      try {
        if (isPublicUnauthenticatedRoute(pathname)) {
          finish();
          return;
        }

        if (await isRoleSwitchInProgress()) {
          finish();
          return;
        }

        const token = await authService.getAuthToken();
        const validToken = await authService.getAuthToken();

        if (!token || !validToken) {
          if (!isMounted) return;

          const route = await getLoginRouteForStoredRole();
          router.replace(route as never);
          finish();
          return;
        }

        if (validToken && isAccessTokenExpired(validToken)) {
          if (!isMounted) return;
          const route = await handleTokenExpiration();
          if (route) router.replace(route as never);
          else router.replace('/SelectAccountTypeScreen' as never);
          finish();
          return;
        }

        finish();
      } catch {
        if (isMounted) {
          router.replace('/SelectAccountTypeScreen');
          finish();
        }
      }
    };

    checkTokenAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  return { isChecking };
}
