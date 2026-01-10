import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { haptics } from '@/hooks/useHaptics';

export default function IndividualProviderComingSoonScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const iconScale = {
    transform: [{ scale: pulseAnim }],
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaWrapper>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
            <Text
              style={{
                marginLeft: 8,
                color: Colors.textPrimary,
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          {/* Content */}
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 40,
              },
              animatedStyle,
            ]}
          >
            {/* Icon */}
            <Animated.View
              style={[
                {
                  width: 120,
                  height: 120,
                  backgroundColor: Colors.accent,
                  borderRadius: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                },
                iconScale,
              ]}
            >
              <Sparkles size={56} color={Colors.white} fill={Colors.white} />
            </Animated.View>

            {/* Title */}
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 16,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Coming Soon
            </Text>

            {/* Welcome Message */}
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Regular',
                color: '#000000',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 8,
                paddingHorizontal: 20,
              }}
            >
              We're excited to bring you Individual Provider registration!
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: '#000000',
                textAlign: 'center',
                lineHeight: 22,
                paddingHorizontal: 20,
              }}
            >
              We're currently working on integrating enhanced security features including third-party identity verification to ensure the best experience for all providers.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaWrapper>
    </Animated.View>
  );
}
