import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_STORAGE_KEY } from './useOnboarding';
import { apiClient } from '@/services/api';

export type UserRole = 'client' | 'provider' | null;

interface UseAuthRoleReturn {
  role: UserRole;
  setRole: (role: UserRole) => Promise<void>;
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

  const logout = useCallback(async () => {
    try {
      // Clear all auth data using apiClient (includes token, refresh token, and user ID)
      await apiClient.clearAuthTokens();
      
      // Clear role and onboarding status
      await AsyncStorage.multiRemove([AUTH_ROLE_KEY, ONBOARDING_STORAGE_KEY]);
      
      setRoleState(null);
      
      if (__DEV__) {
        console.log('✅ Logout successful - All auth data cleared');
      }
      
      // Navigate to index which will check onboarding status and route appropriately
      // Since we cleared onboarding, it will route to /onboarding
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }, [router]);

  return {
    role,
    setRole,
    logout,
    isLoading,
  };
}

