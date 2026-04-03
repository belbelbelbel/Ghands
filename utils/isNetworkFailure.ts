/**
 * Detects offline / connectivity failures from API client and fetch.
 * Use BEFORE AuthError → logout handling so transient network issues don't sign the user out.
 */
export function isConnectivityOrNetworkError(error: unknown): boolean {
  if (error == null) return false;
  const e = error as Record<string, unknown>;
  if (e.isNetworkError === true) return true;
  const msg = String(
    e.message ?? (error instanceof Error ? error.message : '') ?? ''
  ).toLowerCase();
  return (
    msg.includes('no internet') ||
    msg.includes('internet connection') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('check your internet') ||
    msg.includes('unable to connect') ||
    (msg.includes('network') && msg.includes('connection')) ||
    msg.includes('offline') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  );
}
