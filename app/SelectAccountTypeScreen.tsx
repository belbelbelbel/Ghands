import { Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleRoleSelect = async (role: 'client' | 'provider') => {
    haptics.selection();
    // Persist chosen role
    await setRole(role);
    
    if (role === 'client') {
      // Navigate to client onboarding
      router.replace('/onboarding');
    } else {
      // Navigate directly to provider onboarding (skip splash screen)
      router.replace('/provider-onboarding');
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImageContainer: {
    width: 128,
    height: 128,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(106, 155, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },
  buttonsContainer: {
    gap: 14,
    paddingHorizontal: 4,
  },
  clientButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#6A9B00',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A9B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  clientButtonText: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  providerButton: {
    width: '100%',
    height: 58,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(106, 155, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  providerButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});