import type { Router } from 'expo-router';

type RouterLike = Pick<Router, 'back' | 'replace' | 'canGoBack'>;

/**
 * Prefer stack back; only use fallback when there is no history (deep link / replace entry).
 */
export function navigateBack(router: RouterLike, fallback: string): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback as never);
}

/** Default fallbacks when stack history is empty */
export const NAV_FALLBACK = {
  clientHome: '/(tabs)/home',
  clientJobs: '/(tabs)/jobs',
  clientRequest: '/(tabs)/categories',
  providerHome: '/provider/home',
  providerJobs: '/provider/jobs',
} as const;

type RouterWithReplace = RouterLike & Pick<Router, 'replace'>;

/** Job details opened right after booking — return to confirmation, not the jobs tab. */
export function navigateBackFromBookingJob(
  router: RouterWithReplace,
  requestId?: string
): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (requestId) {
    router.replace({
      pathname: '/BookingConfirmationScreen',
      params: { requestId },
    } as never);
    return;
  }
  router.replace(NAV_FALLBACK.clientJobs as never);
}
