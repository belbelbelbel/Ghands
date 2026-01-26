import { Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthRole } from '../hooks/useAuth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SelectAccountTypeScreen() {
  const router = useRouter();
  const { setRole } = useAuthRole();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate logo and buttons on mount
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate buttons with delay
    setTimeout(() => {
      Animated.spring(buttonSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 300);
  }, []);

  const handleBack = () => {
    haptics.light();
    router.replace('/LoginScreen');
  };

  const handleRoleSelect = async (role: 'client' | 'provider') => {
    haptics.selection();
    // Persist chosen role
    await setRole(role);
    
    if (role === 'client') {
      // Navigate to client onboarding
      router.replace('/onboarding');
    } else {
      // Navigate to provider splash screen first, then onboarding
      router.replace('/ProviderSplashScreen');
    }
  };

  const logoStyle = {
    opacity: fadeAnim,
    transform: [{ scale: logoScaleAnim }],
  };

  const buttonStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: buttonSlideAnim }],
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/images/introimage.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={styles.overlay} />

        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* App Logo */}
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View style={styles.logoImageContainer}>
              <Image 
                source={require('../assets/images/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Buttons Container */}
          <Animated.View style={[styles.buttonsContainer, buttonStyle]}>
            {/* Sign Up as a Client Button - Green */}
            <TouchableOpacity
              style={styles.clientButton}
              onPress={() => handleRoleSelect('client')}
              activeOpacity={0.9}
            >
              <Text style={styles.clientButtonText}>Sign Up as a Client</Text>
            </TouchableOpacity>

            {/* Sign Up as a Provider Button - Dark with Green Border */}
            <TouchableOpacity
              style={styles.providerButton}
              onPress={() => handleRoleSelect('provider')}
              activeOpacity={0.9}
            >
              <Text style={styles.providerButtonText}>Sign Up as a Provider</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  logoImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#000000', // Black background for logo visibility
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, // Increased shadow for better visibility
    shadowRadius: 10, // Increased shadow radius
    elevation: 10, // Increased elevation for Android
    overflow: 'hidden', // Ensure logo doesn't overflow container
  },
  logoImage: {
    width: '90%', // Increased from 75% for better visibility
    height: '90%', // Increased from 75% for better visibility
  },
  buttonsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  clientButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#6A9B00',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clientButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  providerButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6A9B00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  providerButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});