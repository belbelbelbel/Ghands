import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_STORAGE_KEY } from './useOnboarding';
import { authService } from '@/services/api';

export type UserRole = 'client' | 'provider' | null;

interface UseAuthRoleReturn {
  role: UserRole;
  setRole: (role: UserRole) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AUTH_ROLE_KEY = '@ghands:user_role';
const AUTH_TOKEN_KEY = '@ghands:auth_token';

/**
 * Hook for managing user authentication and role
 */
export function useAuthRole(): UseAuthRoleReturn {
  const router = useRouter();
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load role from storage on mount
  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem(AUTH_ROLE_KEY);
        if (storedRole) {
          setRoleState(storedRole as UserRole);
        }
      } catch (error) {
        console.error('Error loading role:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRole();
  }, []);

  const setRole = useCallback(async (newRole: UserRole) => {
    try {
      if (newRole) {
        await AsyncStorage.setItem(AUTH_ROLE_KEY, newRole);
      } else {
        await AsyncStorage.removeItem(AUTH_ROLE_KEY);
      }
      setRoleState(newRole);
    } catch (error) {
      console.error('Error setting role:', error);
      throw error;
    }
  }, []);

  /**
   * Switch role without going through onboarding
   * Used for demo/testing purposes
   * Navigates to the respective auth screen instead of home
   */
  const switchRole = useCallback(async (newRole: UserRole) => {
    try {
      if (!newRole) {
        throw new Error('Role cannot be null');
      }

      // Clear auth tokens when switching roles (user needs to log in with new role)
      await authService.clearAuthTokens();

      // Clear all provider-related data if switching from provider
      const providerKeys = [
        '@ghands:business_name',
        '@ghands:company_name',
        '@ghands:provider_id',
        '@ghands:provider_name',
        '@ghands:provider_email',
        '@ghands:company_email',
        '@ghands:company_phone',
        '@ghands:profile_complete',
      ];
      await AsyncStorage.multiRemove(providerKeys);

      // Set new role
      await AsyncStorage.setItem(AUTH_ROLE_KEY, newRole);
      setRoleState(newRole);

      // Mark onboarding as complete so user doesn't see it again
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');

      // Navigate to appropriate auth screen (not home)
      if (newRole === 'provider') {
        router.replace('/ProviderSignInScreen');
      } else {
        router.replace('/LoginScreen');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      // Get role BEFORE clearing it so we know where to redirect
      const currentRole = await AsyncStorage.getItem(AUTH_ROLE_KEY);
      
      // Clear all auth data using authService (includes token, refresh token, and user ID)
      await authService.clearAuthTokens();
      
      // Clear all provider-related data
      const providerKeys = [
        '@ghands:business_name',
        '@ghands:company_name',
        '@ghands:provider_id',
        '@ghands:provider_name',
        '@ghands:provider_email',
        '@ghands:company_email',
        '@ghands:company_phone',
        '@ghands:profile_complete', // Provider profile completion status
      ];
     
      // IMPORTANT:
      // Do NOT clear AUTH_ROLE_KEY or ONBOARDING_STORAGE_KEY on logout.
      // - Role tells us whether this user is a client or provider so we can
      //   send them straight to the correct login screen.
      // - Onboarding complete should stay true so they never get bounced back
      //   to the SelectAccountTypeScreen after logging out.
      //
      // We only clear provider-specific cached data here.
      await AsyncStorage.multiRemove(providerKeys);
      
      // Redirect to appropriate login screen based on role
      // User is signing out, so they're not a first-timer - go to login, not role selection
      if (currentRole === 'provider') {
        router.replace('/ProviderSignInScreen');
      } else if (currentRole === 'client') {
        router.replace('/LoginScreen');
      } else {
        // Only go to role selection if no role was found (shouldn't happen on logout)
        router.replace('/SelectAccountTypeScreen');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }, [router]);

  return {
    role,
    setRole,
    switchRole,
    logout,
    isLoading,
  };
}

