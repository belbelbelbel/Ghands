import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const COACH_MARKS_COMPLETED_KEY = '@ghands:coach_marks_completed';

export interface CoachMark {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // Ref name for highlighting
}

export const COACH_MARKS: CoachMark[] = [
  {
    id: 'search',
    title: 'Search for Services',
    description: 'Use the search bar to quickly find any service you need',
  },
  {
    id: 'categories',
    title: 'Browse Categories',
    description: 'Scroll through service categories to find what you\'re looking for',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Fast access to emergency services, booking again, and your wallet',
  },
  {
    id: 'request-button',
    title: 'Request Service',
    description: 'Tap the center button to start a new service request',
  },
  {
    id: 'jobs',
    title: 'View Your Jobs',
    description: 'Track all your bookings and service history in the Jobs tab',
  },
];

export function useCoachMarks() {
  const [isCompleted, setIsCompleted] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkCoachMarksStatus();
  }, []);

  const checkCoachMarksStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(COACH_MARKS_COMPLETED_KEY);
      const completed = value === 'true';
      setIsCompleted(completed);
      setIsVisible(false); // Don't auto-show, user must click button
    } catch (error) {
      console.error('Error checking coach marks status:', error);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(COACH_MARKS_COMPLETED_KEY, 'true');
      setIsCompleted(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Error marking coach marks as completed:', error);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsVisible(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < COACH_MARKS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markAsCompleted();
    }
  }, [currentStep, markAsCompleted]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    markAsCompleted();
  }, [markAsCompleted]);

  return {
    isVisible,
    isCompleted,
    isLoading,
    currentStep,
    currentMark: COACH_MARKS[currentStep],
    totalSteps: COACH_MARKS.length,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    markAsCompleted,
  };
}
