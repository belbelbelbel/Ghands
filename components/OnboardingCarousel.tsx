import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SlideData } from '../lib/assets';
import OnboardingSlide from './OnboardingSlide';
import { Colors } from '../lib/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingCarouselProps {
  slides: SlideData[];
  currentIndex: number;
  onSlideChange: (index: number) => void;
  onNext: () => void;
  onSkip: () => void;
  isLastSlide: boolean;
}

export default function OnboardingCarousel({
  slides,
  currentIndex,
  onSlideChange,
  onNext,
  onSkip,
  isLastSlide,
}: OnboardingCarouselProps) {
  const translateX = useRef(new Animated.Value(-currentIndex * SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: -currentIndex * SCREEN_WIDTH,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.carouselContainer}>
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              width: slides.length * SCREEN_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {slides.map((slide, index) => (
            <OnboardingSlide key={slide.id} slide={slide} isActive={index === currentIndex} />
          ))}
        </Animated.View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.paginationContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pill,
                index === currentIndex ? styles.pillActive : styles.pillInactive,
              ]}
            />
          ))}
        </View>

        <Pressable style={styles.ctaButton} onPress={onNext}>
          <Text style={styles.ctaText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
          {!isLastSlide && <ChevronRight size={18} color={Colors.black} style={{ marginLeft: 8 }} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E07',
  },
  carouselContainer: {
    flex: 1,
  },
  slidesContainer: {
    flexDirection: 'row',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  pill: {
    height: 8,
    borderRadius: 4,
  },
  pillActive: {
    width: 32,
    backgroundColor: Colors.accent,
  },
  pillInactive: {
    width: 8,
    backgroundColor: '#1B5E20',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.black,
  },
});
