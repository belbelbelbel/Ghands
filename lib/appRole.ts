import Constants from 'expo-constants';

export type BundledAppRole = 'client' | 'provider';

/** Which app binary is running (set in each app’s app.config.js `extra.appRole`). */
export function getBundledAppRole(): BundledAppRole {
  const role = Constants.expoConfig?.extra?.appRole;
  return role === 'provider' ? 'provider' : 'client';
}
