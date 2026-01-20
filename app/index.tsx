import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import useOnboarding from '../hooks/useOnboarding';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Normal green color used throughout the app
const APP_GREEN = '#6A9B00';

// Responsive scaling factors based on screen size
const isSmallScreen = SCREEN_WIDTH < 375; // iPhone SE, small Android
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414; // iPhone 8, 11
const isLargeScreen = SCREEN_WIDTH >= 414; // iPhone 12+, most Android

// Calculate responsive values
const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsivePadding = (base: number) => {
  return isSmallScreen ? base * 0.75 : base;
};

export default function EntryPoint() {
  const router = useRouter();
  const { isOnboardingComplete, isLoading } = useOnboarding();

  useEffect(() => {
    if (!isLoading) {
      const destination = isOnboardingComplete ? '/(tabs)/home' : '/onboarding';
      router.replace(destination);
    }
  }, [isLoading, isOnboardingComplete, router]);

  // Calculate responsive dimensions
  const iconSize = getResponsiveSize(
    SCREEN_WIDTH * 0.35, // 35% on small screens
    SCREEN_WIDTH * 0.38, // 38% on medium screens
    SCREEN_WIDTH * 0.4   // 40% on large screens
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

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      {/* Icon Container - Black square with rounded corners */}
      <View style={[
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
        }
      ]}>
        <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      
      {/* Tagline Text */}
      <Text 
        style={[
          styles.tagline,
          {
            fontSize: taglineFontSize,
            paddingHorizontal: horizontalPadding,
          }
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        Your one-stop shop for help
      </Text>
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6, // Android shadow
  },
  icon: {
    width: '75%',
    height: '75%',
  },
  tagline: {
    fontFamily: 'Poppins-SemiBold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});