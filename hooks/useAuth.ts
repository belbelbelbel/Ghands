import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_STORAGE_KEY } from './useOnboarding';

export type UserRole = 'consumer' | 'provider';

export const ROLE_STORAGE_KEY = '@app:user_role';

export function useAuthRole() {
  const [role, setRole] = useState<UserRole>('consumer');
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        if (storedRole === 'provider' || storedRole === 'consumer') {
          setRole(storedRole);
        }
      } finally {
        setIsRoleLoading(false);
      }
    };

    loadRole();
  }, []);

  const updateRole = useCallback(async (nextRole: UserRole) => {
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    setRole(nextRole);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([ROLE_STORAGE_KEY, ONBOARDING_STORAGE_KEY]);
    setRole('consumer');
  }, []);

  return {
    role,
    isRoleLoading,
    setRole: updateRole,
    logout,
  };
}



