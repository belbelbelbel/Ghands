import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { extractUserIdFromToken } from '@/utils/tokenUtils';
import { getSecureItem, setSecureItem } from '@/utils/secureStorage';

const CLIENT_DEV_TOKEN_KEY = '@ghands:dev_client_token';
const PROVIDER_DEV_TOKEN_KEY = '@ghands:dev_provider_token';
const AUTH_ROLE_KEY = '@ghands:user_role';

/**
 * Dev-only: keep the last client and provider tokens so both can be logged
 * after switching accounts (the app only stores one active token at a time).
 */
export async function cacheDevAuthTokenForRole(
  role: 'client' | 'provider',
  token: string
): Promise<void> {
  if (!__DEV__ || !token?.trim()) return;
  const key = role === 'client' ? CLIENT_DEV_TOKEN_KEY : PROVIDER_DEV_TOKEN_KEY;
  await setSecureItem(key, token.trim());
}

export async function logDevAuthTokens(context?: string): Promise<void> {
  if (!__DEV__) return;

  const label = context ? `[AuthTokens:${context}]` : '[AuthTokens]';

  try {
    const [activeToken, activeRole, userId, companyId] = await Promise.all([
      authService.getAuthToken(),
      AsyncStorage.getItem(AUTH_ROLE_KEY),
      authService.getUserId(),
      authService.getCompanyId(),
    ]);

    if (activeToken && (activeRole === 'client' || activeRole === 'provider')) {
      await cacheDevAuthTokenForRole(activeRole, activeToken);
    }

    const [clientToken, providerToken] = await Promise.all([
      getSecureItem(CLIENT_DEV_TOKEN_KEY),
      getSecureItem(PROVIDER_DEV_TOKEN_KEY),
    ]);

    console.log(label, {
      activeRole,
      activeUserId: userId,
      activeCompanyId: companyId,
      activeTokenUserId: activeToken ? extractUserIdFromToken(activeToken) : null,
      activeToken,
      clientToken,
      providerToken,
      clientTokenUserId: clientToken ? extractUserIdFromToken(clientToken) : null,
      providerTokenUserId: providerToken ? extractUserIdFromToken(providerToken) : null,
    });
  } catch (error) {
    console.log(label, { error: String(error) });
  }
}
