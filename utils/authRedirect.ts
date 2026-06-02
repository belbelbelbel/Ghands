import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { logoutExpiredSession } from '@/utils/tokenExpirationHandler';

/**
 * Auth failure (401 / expired JWT) → clear tokens and send user to their role login screen.
 */
export async function handleAuthErrorRedirect(router: { replace: (href: any) => void }): Promise<void> {
  try {
    if (await isRoleSwitchInProgress()) return;
    await logoutExpiredSession(router);
  } catch {
    try {
      router.replace('/SelectAccountTypeScreen' as never);
    } catch {
      /* navigation unavailable */
    }
  }
}
