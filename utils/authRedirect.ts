import { isRoleSwitchInProgress } from '@/hooks/useRoleSwitching';
import { redirectToAuthScreen } from '@/utils/authNavigationGuard';

/**
 * Auth failure (401 / expired JWT) → clear tokens and send user to their role login screen.
 */
export async function handleAuthErrorRedirect(
  router: { replace: (href: any) => void },
  pathname?: string | null
): Promise<void> {
  try {
    if (await isRoleSwitchInProgress()) return;
    await redirectToAuthScreen(router, { pathname, clearSession: true });
  } catch {
    /* redirectToAuthScreen already falls back */
  }
}
