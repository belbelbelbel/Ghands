import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, View } from 'react-native';
import OnboardingCarousel from '../components/OnboardingCarousel';
import useOnboarding from '../hooks/useOnboarding';
import { DESIGN_TOKENS, ONBOARDING_SLIDES } from '../lib/assets';

export default function OnboardingScreen() {
  const router = useRouter();
  
  const {
    currentSlideIndex,
    setCurrentSlideIndex,
    nextSlide,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const handleNext = async () => {
    if (currentSlideIndex === ONBOARDING_SLIDES.length - 1) {
      await completeOnboarding();
      // Navigate to client type selection after onboarding
      router.replace('/ClientTypeSelectionScreen');
    } else {
      nextSlide();
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    // Navigate to client type selection after skipping
    router.replace('/ClientTypeSelectionScreen');
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index);
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: DESIGN_TOKENS.colors.background,
    }}>
      <StatusBar
        barStyle="default"
        backgroundColor="transparent"
        translucent={true}
        hidden={false}
        animated={true}
      />
      
      <OnboardingCarousel
        slides={ONBOARDING_SLIDES}
        currentIndex={currentSlideIndex}
        onSlideChange={handleSlideChange}
        onNext={handleNext}
        onSkip={handleSkip}
        isLastSlide={currentSlideIndex === ONBOARDING_SLIDES.length - 1}
      />
    </View>
  );
}