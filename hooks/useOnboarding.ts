import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';

// Simple storage implementation with fallbacks
const createStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Web fallback
    return {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore storage errors
        }
      }
    };
  }
  
  // Mobile fallback using in-memory storage
  const storage: { [key: string]: string } = {};
  return {
    getItem: async (key: string) => storage[key] || null,
    setItem: async (key: string, value: string) => { storage[key] = value; },
    removeItem: async (key: string) => { delete storage[key]; }
  };
};

const AsyncStorage = createStorage();

const ONBOARDING_STORAGE_KEY = '@app:onboarding_complete';

interface UseOnboardingReturn {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>; // For development/testing
}

const TOTAL_SLIDES = 3;

export default function useOnboarding(): UseOnboardingReturn {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsOnboardingComplete(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to false if there's an error
        setIsOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const nextSlide = useCallback(() => {
    // Haptic feedback for navigation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentSlideIndex < TOTAL_SLIDES - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex]);

  const previousSlide = useCallback(() => {
    // Haptic feedback for navigation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const completeOnboarding = useCallback(async () => {
    try {
      // Haptic feedback for completion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still set as complete in case of storage error
      setIsOnboardingComplete(true);
    }
  }, []);

  const skipOnboarding = useCallback(async () => {
    try {
      // Light haptic feedback for skip
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Still set as complete in case of storage error
      setIsOnboardingComplete(true);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setIsOnboardingComplete(false);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, []);

  return {
    isOnboardingComplete,
    isLoading,
    currentSlideIndex,
    setCurrentSlideIndex,
    nextSlide,
    previousSlide,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}