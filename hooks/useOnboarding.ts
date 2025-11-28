import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';

export const ONBOARDING_STORAGE_KEY = '@app:onboarding_complete';

interface UseOnboardingReturn {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const TOTAL_SLIDES = 3;

export default function useOnboarding(): UseOnboardingReturn {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsOnboardingComplete(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const nextSlide = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentSlideIndex < TOTAL_SLIDES - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex]);

  const previousSlide = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const completeOnboarding = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsOnboardingComplete(true);
    }
  }, []);

  const skipOnboarding = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
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