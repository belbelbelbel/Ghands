import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Normal green color used throughout the app
const APP_GREEN = '#6A9B00';

// Responsive scaling factors based on screen size
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isLargeScreen = SCREEN_WIDTH >= 414;

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsivePadding = (base: number) => {
  return isSmallScreen ? base * 0.75 : base;
};

export default function ProviderSplashScreen() {
  const router = useRouter();

  // Animation values
  const iconFadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const taglineFadeAnim = useRef(new Animated.Value(0)).current;
  const taglineSlideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Always navigate to provider onboarding after splash
    // The onboarding screen will handle navigation based on completion status
    const timer = setTimeout(() => {
      router.replace('/provider-onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  // Start animations on mount
  useEffect(() => {
    // Icon container: fade in + scale up with spring
    Animated.parallel([
      Animated.spring(iconFadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline: fade in + slide up with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(taglineFadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(taglineSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Subtle pulse animation for icon (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Calculate responsive dimensions
  const iconSize = getResponsiveSize(
    SCREEN_WIDTH * 0.35,
    SCREEN_WIDTH * 0.38,
    SCREEN_WIDTH * 0.4
  );

  const iconMaxSize = getResponsiveSize(200, 220, 240);
  const iconMinSize = getResponsiveSize(120, 140, 160);
  const borderRadius = getResponsiveSize(16, 18, 20);
  const marginBottom = getResponsiveSize(
    SCREEN_HEIGHT < 700 ? 20 : 30,
    SCREEN_HEIGHT < 800 ? 35 : 40,
    40
  );
  const taglineFontSize = getResponsiveSize(14, 16, 17);
  const horizontalPadding = getResponsivePadding(20);

  // Provider tagline
  const tagline = 'Work Earn Grow';

  // Animated styles
  const iconContainerStyle = {
    opacity: iconFadeAnim,
    transform: [{ scale: iconScaleAnim }],
  };

  const iconStyle = {
    transform: [{ scale: pulseAnim }],
  };

  const taglineStyle = {
    opacity: taglineFadeAnim,
    transform: [{ translateY: taglineSlideAnim }],
  };

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      {/* Icon Container - Black square with rounded corners */}
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            width: iconSize,
            height: iconSize,
            maxWidth: iconMaxSize,
            maxHeight: iconMaxSize,
            minWidth: iconMinSize,
            minHeight: iconMinSize,
            borderRadius: borderRadius,
            marginBottom: marginBottom,
          },
          iconContainerStyle
        ]}
      >
        <Animated.View style={iconStyle}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
      
      {/* Tagline Text */}
      <Animated.Text 
        style={[
          styles.tagline,
          {
            fontSize: taglineFontSize,
            paddingHorizontal: horizontalPadding,
          },
          taglineStyle
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {tagline}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: '#000000', // Black background for logo visibility
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4, // Increased shadow for better visibility
    shadowRadius: 10, // Increased shadow radius
    elevation: 10, // Increased elevation for Android
    overflow: 'hidden', // Ensure logo doesn't overflow container
  },
  icon: {
    width: '90%', // Increased from 75% for better visibility
    height: '90%', // Increased from 75% for better visibility
  },
  tagline: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
