/**
 * Client-side JWT expiration check (access token `exp` claim).
 * Non-JWT tokens (e.g. opaque UUID) return false — rely on API 401 for those.
 */
export function isAccessTokenExpired(token: string, skewMs = 0): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    if (typeof atob === 'undefined') return false;
    const json = atob(padded);
    const obj = JSON.parse(json) as { exp?: number };
    if (obj.exp == null || typeof obj.exp !== 'number') return false;
    return obj.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return false;
  }
}
