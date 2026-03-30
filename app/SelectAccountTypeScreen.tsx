import { Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import useOnboarding from '../hooks/useOnboarding';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthRole } from '../hooks/useAuth';

export default function SelectAccountTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRole } = useAuthRole();
  const { isOnboardingComplete } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(buttonSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRoleSelect = async (role: 'client' | 'provider') => {
    haptics.selection();
    // Persist chosen role
    await setRole(role);
    
    if (role === 'client') {
      // First time: show client onboarding. Afterwards, go straight to signup.
      if (isOnboardingComplete) {
        router.replace('/SignupScreen');
      } else {
        router.replace('/onboarding');
      }
    } else {
      // First time: show provider onboarding. Afterwards, go straight to provider signup.
      if (isOnboardingComplete) {
        router.replace('/ProviderSignUpScreen');
      } else {
        router.replace('/provider-onboarding');
      }
    }
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
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
          {/* Buttons Container — max width keeps text from clipping in tablet phone lane */}
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

            {/* Already have an account - Log in */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => {
                haptics.selection();
                router.replace('/LoginScreen');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
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
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: '100%',
  },
  buttonsContainer: {
    gap: 10,
    width: '100%',
    alignSelf: 'center',
  },
  clientButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#6A9B00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A9B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  clientButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  providerButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderRadius: 12,
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
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loginLink: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    flexShrink: 1,
  },
});