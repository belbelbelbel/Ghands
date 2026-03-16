import { useState, useEffect, useCallback } from 'react';
import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_COMPLETE_KEY = '@ghands:profile_complete';

/**
 * Tracks whether the user has completed the first-time profile modal (name, phone, gender)
 * during the booking flow. Strictly first-time only - once marked complete, modal never shows again.
 */
export function useProfileCompletion() {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkProfileComplete = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const value = await AsyncStorage.getItem(PROFILE_COMPLETE_KEY);
      const complete = value === 'true';
      setIsProfileComplete(complete);
      return complete;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      checkProfileComplete();
    });
    return () => task.cancel();
  }, [checkProfileComplete]);


  const markProfileComplete = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
      setIsProfileComplete(true);
    } catch (error) {
      console.error('Error marking profile complete:', error);
    }
  };

  const markProfileIncomplete = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'false');
      setIsProfileComplete(false);
    } catch (error) {
      console.error('Error marking profile incomplete:', error);
    }
  };

  return {
    isProfileComplete,
    isLoading,
    checkProfileComplete,
    markProfileComplete,
    markProfileIncomplete,
  };
}
