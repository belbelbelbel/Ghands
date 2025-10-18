import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { SlideData } from '../lib/assets';
import OnboardingSlide from './OnboardingSlide';

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
  const buttonScale = useRef(new Animated.Value(1)).current;
  const skipOpacity = useRef(new Animated.Value(1)).current;

  // Smooth slide transition - coordinated with slide animations
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: -currentIndex * SCREEN_WIDTH,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  // Hide skip button on last slide
  useEffect(() => {
    Animated.timing(skipOpacity, {
      toValue: isLastSlide ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isLastSlide]);

  // Smooth, subtle pulse animation
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => setTimeout(pulse, 1500));
    };

    const timer = setTimeout(pulse, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b07' }}>
      {/* Carousel Content */}
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              width: slides.length * SCREEN_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {slides.map((slide, index) => (
            <OnboardingSlide
              key={slide.id}
              slide={slide}
              isActive={index === currentIndex}
            />
          ))}
        </Animated.View>
      </View>

      {/* Bottom Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0b0b07',
          paddingHorizontal: 32,
          paddingVertical: 40,
        }}
      >
        {/* Progress Indicators */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                {
                  width: index === currentIndex ? 32 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex 
                    ? '#ADF802' 
                    : 'rgba(216, 255, 46, 0.25)',
                  marginHorizontal: 3,
                },
              ]}
            />
          ))}
        </View>

        {/* Skip and Next Button Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: isLastSlide ? 'center' : 'space-between',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          {/* Skip Button - Hidden on last slide */}
          {!isLastSlide && (
            <Animated.View style={{ opacity: skipOpacity }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 28,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
                onPress={onSkip}
                accessibilityLabel="Skip onboarding"
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'System',
                  }}
                >
                  Skip
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Next/Get Started Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
           
              style={{
                paddingVertical: 18,
                paddingHorizontal: isLastSlide ? 40 : 28,
                borderRadius: 32,
                backgroundColor: '#ADF802',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#ADF802',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 12,
                minWidth: isLastSlide ? 180 : 120,
                justifyContent: 'center',
              }}
              onPress={onNext}
              accessibilityLabel={isLastSlide ? "Get started" : "Next slide"}
              activeOpacity={0.9}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#0b0b07',
                  fontFamily: 'System',
                  marginRight: isLastSlide ? 0 : 6,
                }}
              >
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
              {!isLastSlide && (
                <Text
                  style={{
                    fontSize: 16,
                    color: '#0b0b07',
                    fontWeight: 'bold',
                  }}
                >
                  →
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}