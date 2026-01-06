import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { SlideData } from '../lib/assets';
import { Colors } from '../lib/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
            <Stop offset="0%" stopColor="#B8C5A8" />
            <Stop offset="18%" stopColor="#A0B090" />
            <Stop offset="38%" stopColor="#889B78" />
            <Stop offset="50%" stopColor="#6A7D5A" />
            <Stop offset="62%" stopColor="#4A5D3A" />
            <Stop offset="78%" stopColor="#1B220F" />
            <Stop offset="100%" stopColor="#0A0E07" />
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
    width: SCREEN_WIDTH * 0.7,
    height: '100%',
    zIndex: 1,
  },
  contentZone: {
    height: SCREEN_HEIGHT * 0.42,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  textBlock: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    maxWidth: '85%',
    marginBottom: 16,
  },
});
