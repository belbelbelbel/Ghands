import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, Text, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1 justify-center items-center px-4"
      >
        <View className="w-20 h-20 bg-[#ADF802] rounded-full items-center justify-center mb-6">
          <User size={40} color="black" />
        </View>
        
        <Text 
          className="text-2xl font-bold text-black mb-4 text-center"
          style={{ fontFamily: 'Poppins-ExtraBold' }}
        >
          Profile
        </Text>
        
        <Text 
          className="text-base text-gray-600 text-center"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          Manage your account settings and preferences.
        </Text>
        
        {/* Bottom Spacer for Tab Navigation */}
        <View style={{ height: 100 }} />
      </Animated.View>
    </SafeAreaView>
  );
}
