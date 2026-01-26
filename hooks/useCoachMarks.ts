import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachMarkStep } from '@/components/CoachMarks';

const COACH_MARKS_STORAGE_KEY = '@ghands:coach_marks_complete';

interface UseCoachMarksReturn {
  isComplete: boolean;
  isLoading: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => Promise<void>;
  completeTour: () => Promise<void>;
  resetTour: () => Promise<void>;
}

export default function useCoachMarks(
  steps: CoachMarkStep[]
): UseCoachMarksReturn {
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(COACH_MARKS_STORAGE_KEY);
        setIsComplete(value === 'true');
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking coach marks status:', error);
        }
        setIsComplete(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const startTour = useCallback(() => {
    if (steps.length === 0) return;
    setIsActive(true);
    setCurrentStep(0);
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(async () => {
    try {
      await AsyncStorage.setItem(COACH_MARKS_STORAGE_KEY, 'true');
      setIsComplete(true);
      setIsActive(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error skipping coach marks:', error);
      }
      setIsComplete(true);
      setIsActive(false);
    }
  }, []);

  const completeTour = useCallback(async () => {
    try {
      await AsyncStorage.setItem(COACH_MARKS_STORAGE_KEY, 'true');
      setIsComplete(true);
      setIsActive(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error completing coach marks:', error);
      }
      setIsComplete(true);
      setIsActive(false);
    }
  }, []);

  const resetTour = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(COACH_MARKS_STORAGE_KEY);
      setIsComplete(false);
      setCurrentStep(0);
      setIsActive(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error resetting coach marks:', error);
      }
    }
  }, []);

  return {
    isComplete,
    isLoading,
    currentStep,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
