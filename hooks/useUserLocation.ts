import { useCallback, useEffect, useState } from 'react';

const createStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: async (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
        }
      },
      removeItem: async (key: string) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
        }
      },
    };
  }

  const storage: Record<string, string> = {};
  return {
    getItem: async (key: string) => storage[key] || null,
    setItem: async (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: async (key: string) => {
      delete storage[key];
    },
  };
};

const storage = createStorage();
const USER_LOCATION_STORAGE_KEY = '@app:user_location';

interface UseUserLocationReturn {
  location: string | null;
  isLoading: boolean;
  setLocation: (value: string) => Promise<void>;
  clearLocation: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocationState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredLocation = async () => {
      try {
        const storedLocation = await storage.getItem(USER_LOCATION_STORAGE_KEY);
        setLocationState(storedLocation);
      } catch (error) {
        console.error('Error loading stored location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredLocation();
  }, []);

  const setLocation = useCallback(async (value: string) => {
    try {
      await storage.setItem(USER_LOCATION_STORAGE_KEY, value);
      setLocationState(value);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, []);

  const clearLocation = useCallback(async () => {
    try {
      await storage.removeItem(USER_LOCATION_STORAGE_KEY);
      setLocationState(null);
    } catch (error) {
      console.error('Error clearing location:', error);
    }
  }, []);

  return {
    location,
    isLoading,
    setLocation,
    clearLocation,
  };
}


