import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts, Spacing, BorderRadius, CommonStyles } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { MapPin, Plus } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAllowLocation = () => {
    router.push('/ProfileSetupScreen');
  };

  const handleManualEntry = () => {
    router.push('/LocationSearchScreen');
  };

  const handleLater = () => {
    router.push('/ProfileSetupScreen');
  };

  return (
    <SafeAreaWrapper>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg }}>
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}
          className="mb-8"
        >
          <View style={{ width: 128, height: 128, backgroundColor: Colors.accent, borderRadius: 64, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <MapPin size={48} color={Colors.white} />
            <View style={{ position: 'absolute', top: -4, right: -4, width: 32, height: 32, backgroundColor: Colors.black, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} color={Colors.white} />
            </View>
          </View>
        </Animated.View>
        <Animated.Text
          style={{
            opacity: fadeAnim,
            ...Fonts.h2,
            fontSize: 24,
            color: Colors.textPrimary,
            textAlign: 'center',
            marginBottom: Spacing.lg,
          }}
        >
          Your location?
        </Animated.Text>
        <Animated.Text
          style={{
            opacity: fadeAnim,
            ...Fonts.body,
            color: Colors.textPrimary,
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          We need your location to find nearby services and improve your experience.
        </Animated.Text>
        <Animated.View 
          style={{ opacity: fadeAnim, width: '100%', marginBottom: Spacing.md }}
        >
          <TouchableOpacity
            onPress={handleAllowLocation}
            activeOpacity={0.8}
            style={{
              ...CommonStyles.buttonPrimary,
              width: '100%',
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg + 2,
            }}
          >
            <Text 
              style={{
                ...Fonts.button,
                fontSize: 16,
                color: Colors.white,
                textAlign: 'center',
              }}
            >
              Allow Location Access
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View 
          style={{ opacity: fadeAnim, width: '100%', marginBottom: Spacing.lg + 2 }}
        >
          <TouchableOpacity
            onPress={handleManualEntry}
            activeOpacity={0.8}
            style={{
              borderWidth: 2,
              borderColor: Colors.black,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg + 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text 
              style={{
                ...Fonts.button,
                fontSize: 16,
                color: Colors.textPrimary,
                textAlign: 'center',
              }}
            >
              Enter location manually
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={handleLater} activeOpacity={0.7}>
            <Text 
              style={{
                ...Fonts.body,
                color: Colors.textPrimary,
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}
            >
              I'll do this later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}
