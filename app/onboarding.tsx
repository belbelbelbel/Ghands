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

  // Fix Android navigation bar and force immersive mode

  const handleNext = async () => {
    if (currentSlideIndex === ONBOARDING_SLIDES.length - 1) {
      // Last slide - complete onboarding
      await completeOnboarding();
      router.replace('/SelectAccountTypeScreen');
    } else {
      // Go to next slide
      nextSlide();
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/SelectAccountTypeScreen');
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