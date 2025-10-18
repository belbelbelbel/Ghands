import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideData } from '../lib/assets';
import AnimatedIcon from './AnimatedIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


// Fixed values - no responsiveness
const TITLE_FONT_SIZE = 28;
const DESCRIPTION_FONT_SIZE = 15.5;
const HORIZONTAL_PADDING = 28;
const TEXT_PADDING = 10;

interface OnboardingSlideProps {
  slide: SlideData;
  isActive: boolean;
}

export default function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(40)).current;
  const descSlideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isActive) {
      // Reset values for entrance
      fadeAnim.setValue(0);
      titleSlideAnim.setValue(40);
      descSlideAnim.setValue(40);
      scaleAnim.setValue(0.95);
    
      // Staggered entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Title slides up first
      Animated.timing(titleSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Description slides up with delay
      setTimeout(() => {
        Animated.timing(descSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 150);

    } else {
      // Smooth exit animation when slide becomes inactive
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlideAnim, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(descSlideAnim, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, fadeAnim, titleSlideAnim, descSlideAnim, scaleAnim]);
  
   const insets = useSafeAreaInsets();

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, backgroundColor: '#0b0b07',  paddingBottom: Platform.OS === 'android' ? StatusBar.currentHeight : 0, }}>
      {/* Image Section - Top Half */}
      <View style={{ height: SCREEN_HEIGHT * 0.5, position: 'relative' }}>
        <Image
          source={slide.image}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
        
        {/* Shadow Gradient Overlay for smooth blending */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            flexDirection: 'column',
          }}
          pointerEvents="none"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.05)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.1)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.2)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.35)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.5)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.65)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.8)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.9)' }} />
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 7, 0.95)' }} />
          <View style={{ flex: 1, backgroundColor: '#0b0b07' }} />
        </View>
      </View>

      {/* Animated Icon - Positioned at intersection */}
      <Animated.View
        style={{
          position: 'absolute',
          top: SCREEN_HEIGHT * 0.5 - 30,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 10,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim }
          ],
        }}
      >
        <AnimatedIcon icon={slide.icon} animate={isActive} />
      </Animated.View>

      {/* Text Section - Bottom Half */}
      <View
        style={{
          height: SCREEN_WIDTH < 375 ? SCREEN_HEIGHT * 0.35 - 20 : SCREEN_HEIGHT * 0.3,
          backgroundColor: '#0b0b07',
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Title - Staggered Animation */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: titleSlideAnim }
            ],
            width: '100%',
            paddingHorizontal: TEXT_PADDING,
            marginBottom: 20,
            marginTop: 40,
          }}
        >
          <Text
            style={{
              fontSize: TITLE_FONT_SIZE,
              fontWeight: '800',
              color: '#FFFFFF',
              textAlign: 'center',
              fontFamily: 'System',
              lineHeight: TITLE_FONT_SIZE + 8,
              letterSpacing: -0.5,
            }}
          >
            {slide.title}
          </Text>
        </Animated.View>

        {/* Description - Staggered Animation */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: descSlideAnim }
            ],
            width: '100%',
            paddingHorizontal: TEXT_PADDING,
          }}
        >
          <Text
            style={{
              fontSize: DESCRIPTION_FONT_SIZE,
              fontWeight: '500',
              color: '#FFFFFF',
              textAlign: 'center',
              fontFamily: 'System',
              lineHeight: DESCRIPTION_FONT_SIZE + 8,
              letterSpacing: 0.3,
              zIndex: 1
            }}
          >
            {slide.description}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}