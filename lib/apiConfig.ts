/**
 * Single source of truth for API base URL across the app.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://bamibuildit-backend-v1.onrender.com';

/** Bank transfer details for wallet top-up (set in EAS env for production). */
export function getBankTransferAccount(): { number: string; name: string } | null {
  const number = process.env.EXPO_PUBLIC_BANK_ACCOUNT_NUMBER?.trim();
  const name = process.env.EXPO_PUBLIC_BANK_ACCOUNT_NAME?.trim();
  if (!number || !name) return null;
  return { number, name };
}
