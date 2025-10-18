import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { setBackgroundColorAsync } from 'expo-system-ui';
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
  useEffect(() => {
    const setupAndroidUI = async () => {
      if (Platform.OS === 'android') {
        try {
          // Set system background to black to match app
          await setBackgroundColorAsync(DESIGN_TOKENS.colors.background);
          
          // Force immersive mode immediately
          StatusBar.setHidden(false, 'none');
          StatusBar.setBackgroundColor('transparent', true);
          StatusBar.setTranslucent(true);
          
        } catch (error) {
          console.log('System UI setup error:', error);
        }
      }
    };

    setupAndroidUI();
  }, []);

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
        barStyle="light-content"
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