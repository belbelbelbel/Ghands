/** True when the failure is offline / transport (not auth or HTTP 4xx/5xx from server). */
export function isConnectivityError(error: unknown): boolean {
  const e = error as {
    isNetworkError?: boolean;
    name?: string;
    message?: string;
  };
  if (!e) return false;
  if (e.isNetworkError === true) return true;
  if (e.name === 'NetworkError' || e.name === 'TypeError') return true;
  const msg = String(e.message || error || '').toLowerCase();
  if (msg.includes('network request failed')) return true;
  if (msg.includes('failed to fetch')) return true;
  if (msg.includes('internet connection')) return true;
  if (msg.includes('no internet')) return true;
  if (msg.includes('network error')) return true;
  if (msg.includes('could not connect')) return true;
  return false;
}
