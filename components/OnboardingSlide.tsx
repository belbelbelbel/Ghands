import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { SlideData } from '../lib/assets';
import { Colors } from '../lib/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling based on screen size
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const scale = isSmallScreen ? 0.85 : isMediumScreen ? 0.92 : 1.0;

interface OnboardingSlideProps {
  slide: SlideData;
  isActive: boolean;
}

export default function OnboardingSlide({ slide, isActive }: OnboardingSlideProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(30)).current;
  const descSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      titleSlideAnim.setValue(30);
      descSlideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.timing(descSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 150);
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(descSlideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, fadeAnim, titleSlideAnim, descSlideAnim]);

  return (
    <SafeAreaView style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#E5E8E0" />
            <Stop offset="10%" stopColor="#D4D8CF" />
            <Stop offset="23%" stopColor="#C8D0C0" />
            <Stop offset="30%" stopColor="#B8C8A0" />
            <Stop offset="40%" stopColor="#A5C070" />
            <Stop offset="50%" stopColor="#8AB050" />
            <Stop offset="60%" stopColor="#6A9B00" />
            <Stop offset="75%" stopColor="#1A1F00" />
            <Stop offset="85%" stopColor="#0A0F00" />
            <Stop offset="100%" stopColor="#000000" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#gradient)" />
      </Svg>

      <View style={styles.heroZone}>
        <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
      </View>

      <View style={styles.contentZone}>
        <Animated.View style={[styles.textBlock, { opacity: fadeAnim, transform: [{ translateY: titleSlideAnim }] }]}>
          <Text style={styles.title}>{slide.title}</Text>
        </Animated.View>
        <Animated.View style={[styles.textBlock, { opacity: fadeAnim, transform: [{ translateY: descSlideAnim }] }]}>
          <Text style={styles.description}>{slide.description}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  heroZone: {
    height: SCREEN_HEIGHT * 0.58,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: SCREEN_HEIGHT * 0.1,
  },
  illustration: {
    width: SCREEN_WIDTH * 0.85,
    height: '100%',
    zIndex: 1,
  },
  contentZone: {
    height: SCREEN_HEIGHT * 0.42,
    paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
    paddingBottom: SCREEN_HEIGHT < 700 ? 20 * scale : 32 * scale,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  textBlock: {
    width: '100%',
  },
  title: {
    fontSize: 32 * scale,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 8 * scale,
    paddingHorizontal: isSmallScreen ? 4 : 0,
  },
  description: {
    fontSize: 16 * scale,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    maxWidth: isSmallScreen ? '95%' : '85%',
    marginBottom: 16 * scale,
    paddingHorizontal: isSmallScreen ? 4 : 0,
  },
});
