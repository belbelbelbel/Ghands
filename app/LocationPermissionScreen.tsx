import SafeAreaWrapper from '@/components/SafeAreaWrapper';
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
    // Navigate to next screen after permission granted
    router.push('/LocationSearchScreen');
  };

  const handleManualEntry = () => {
    router.push('/LocationSearchScreen');
  };

  const handleLater = () => {
    router.push('/ProfileSetupScreen');
  };

  return (
    <SafeAreaWrapper>
      <View className="flex-1 justify-center items-center px-8">
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}
          className="mb-8"
        >
          <View className="w-32 h-32 bg-[#6A9B00] rounded-full items-center justify-center relative">
            <MapPin size={48} color="black" />
            <View className="absolute -top-1 -right-1 w-8 h-8 bg-black rounded-full items-center justify-center">
              <Plus size={16} color="white" />
            </View>
          </View>
        </Animated.View>
        <Animated.Text
          style={{
            opacity: fadeAnim,
            fontSize: 24,
            fontWeight: '800',
            color: '#000000',
            textAlign: 'center',
            fontFamily: 'Poppins-ExtraBold',
            marginBottom: 16,
          }}
        >
          Your location?
        </Animated.Text>
        <Animated.Text
          style={{
            opacity: fadeAnim,
            fontSize: 16,
            fontWeight: '400',
            color: '#000000',
            textAlign: 'center',
            fontFamily: 'Poppins-Regular',
            lineHeight: 24,
            marginBottom: 48,
          }}
        >
          We need your location to find nearby services and improve your experience.
        </Animated.Text>
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="w-full mb-4"
        >
          <TouchableOpacity
            onPress={handleAllowLocation}
            activeOpacity={0.8}
            className="bg-black rounded-xl py-4 px-6"
          >
            <Text 
              className="text-white text-center text-lg font-semibold"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Allow Location Access
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="w-full mb-6"
        >
          <TouchableOpacity
            onPress={handleManualEntry}
            activeOpacity={0.8}
            className="border-2 border-[#000000] rounded-xl py-4 px-6"
          >
            <Text 
              className="text-[#000000] text-center text-lg font-semibold"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Enter location manually
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* I'll do this later Link */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={handleLater} activeOpacity={0.7}>
            <Text 
              className="text-[#000000] text-center text-base underline"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              I'll do this later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}
