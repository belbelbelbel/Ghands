import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, SavedLocation, authService } from '@/services/api';
import { AuthError } from '@/utils/errors';
import { useRouter } from 'expo-router';

const USER_LOCATION_STORAGE_KEY = '@app:user_location';
const USER_LOCATION_PLACE_ID_KEY = '@app:user_location_place_id';

interface UseUserLocationReturn {
  location: string | null;
  isLoading: boolean;
  setLocation: (value: string) => Promise<void>;
  clearLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  loadSavedLocation: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocationState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user is a provider (providers have company ID, not user ID for location)
      // Providers should NOT call user location endpoint - they use provider location endpoint
      const companyId = await authService.getCompanyId();
      const userId = await authService.getUserId();
      
      // For providers: Skip API call to user location endpoint (providers use provider location endpoint)
      if (companyId) {
        // Provider: Only load from local storage, don't call user location API
        const storedLocation = await AsyncStorage.getItem(USER_LOCATION_STORAGE_KEY);
        setLocationState(storedLocation);
        setIsLoading(false);
        if (__DEV__) {
          console.log('✅ Provider detected - skipping user location API call (will use provider endpoint)');
        }
        return;
      }
      
      // Try to load from API first (only for regular users, not providers)
      if (userId) {
        try {
          const savedLocation = await locationService.getUserLocation(userId);
          if (savedLocation) {
            await AsyncStorage.setItem(USER_LOCATION_STORAGE_KEY, savedLocation.fullAddress);
            await AsyncStorage.setItem(USER_LOCATION_PLACE_ID_KEY, savedLocation.placeId);
            setLocationState(savedLocation.fullAddress);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // If AuthError, redirect immediately
          if (error instanceof AuthError) {
            const { handleAuthErrorRedirect } = await import('@/utils/authRedirect');
            await handleAuthErrorRedirect(router);
            return;
          }
          // Location not set in API, fallback to local storage
          if (__DEV__) {
            console.log('No saved location in API, using local storage');
          }
        }
      }

      // Fallback to local storage
      const storedLocation = await AsyncStorage.getItem(USER_LOCATION_STORAGE_KEY);
      setLocationState(storedLocation);
    } catch (error) {
      console.error('Error loading stored location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setLocation = useCallback(async (value: string) => {
    try {
      await AsyncStorage.setItem(USER_LOCATION_STORAGE_KEY, value);
      setLocationState(value);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, []);

  const clearLocation = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([USER_LOCATION_STORAGE_KEY, USER_LOCATION_PLACE_ID_KEY]);
      setLocationState(null);
    } catch (error) {
      console.error('Error clearing location:', error);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    await loadSavedLocation();
  }, [loadSavedLocation]);

  return {
    location,
    isLoading,
    setLocation,
    clearLocation,
    refreshLocation,
    loadSavedLocation,
  };
}
