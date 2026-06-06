import type { Router } from 'expo-router';

type RouterLike = Pick<Router, 'back' | 'replace' | 'canGoBack'>;
type RouterWithNav = RouterLike & Pick<Router, 'push' | 'replace'>;

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

export type JobDetailsTab = 'updates' | 'quotations';

export function buildJobDetailsParams(opts: {
  requestId: string | number;
  tab?: JobDetailsTab;
  fromBooking?: boolean;
  paymentStatus?: 'success';
}): Record<string, string> {
  const params: Record<string, string> = { requestId: String(opts.requestId) };
  if (opts.tab) params.tab = opts.tab;
  if (opts.fromBooking) params.fromBooking = '1';
  if (opts.paymentStatus) params.paymentStatus = opts.paymentStatus;
  return params;
}

/** Open active job hub — single entry point for job details navigation. */
export function navigateToJob(
  router: RouterWithNav,
  opts: {
    requestId: string | number;
    tab?: JobDetailsTab;
    fromBooking?: boolean;
    paymentStatus?: 'success';
    replace?: boolean;
  }
): void {
  const route = {
    pathname: '/OngoingJobDetails',
    params: buildJobDetailsParams(opts),
  } as const;

  if (opts.replace) {
    router.replace(route as never);
    return;
  }
  router.push(route as never);
}

/** Job details opened right after booking — land on Jobs, not back through the booking stack. */
export function navigateBackFromBookingJob(router: RouterLike & Pick<Router, 'replace'>): void {
  router.replace(NAV_FALLBACK.clientJobs as never);
}

/** After in-flow payment — replace receipt stack with job details. */
export function exitPaymentToJob(router: RouterWithNav, requestId: string | number): void {
  navigateToJob(router, { requestId, tab: 'updates', replace: true });
}
