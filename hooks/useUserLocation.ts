import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, authService, SavedLocation } from '@/services/api';

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

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try to load from API first
      const userId = await authService.getUserId();
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
          // Location not set in API, fallback to local storage
          console.log('No saved location in API, using local storage');
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
