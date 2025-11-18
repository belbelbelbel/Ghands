import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Clock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useUserLocation } from '@/hooks/useUserLocation';

const MAX_DESCRIPTION_LENGTH = 500;

export default function JobDetailsScreen() {
  const router = useRouter();
  const { location } = useUserLocation();
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, [fadeAnim, slideAnim]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleChangeLocation = useCallback(() => {
    router.push('../LocationSearchScreen' as any);
  }, [router]);

  const handleNext = useCallback(() => {
    if (!jobTitle.trim() || !description.trim()) {
      return;
    }
    console.log('Job details:', { jobTitle, description, location });
    router.push('../DateTimeScreen' as any);
  }, [jobTitle, description, location, router]);

  const parsedLocation = useMemo(() => {
    if (!location) {
      return {
        street: 'No location set',
        city: 'Please set your location',
      };
    }

    const parts = location.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return {
        street: parts[0],
        city: parts.slice(1).join(', '),
      };
    }
    return {
      street: location,
      city: '',
    };
  }, [location]);

  const descriptionCount = description.length;
  const canProceed = jobTitle.trim().length > 0 && description.trim().length > 0;

  const animatedStyles = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }),
    [fadeAnim, slideAnim]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View style={[animatedStyles, { flex: 1 }]}>
        <View className="px-4 pb-2" style={{ paddingTop: 20 }}>
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleBack}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <ArrowLeft size={20} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
              Job details
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="mb-6 rounded-2xl bg-[#F7FBEB] px-4 py-4 border border-[#D7FF6B]/30">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#D7FF6B] items-center justify-center mr-2">
                  <MapPin size={16} color="#6A9B00" />
                </View>
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Current Location
                </Text>
              </View>
              <TouchableOpacity onPress={handleChangeLocation} activeOpacity={0.7}>
                <Text className="text-sm text-[#6A9B00]" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
              {parsedLocation.street}
            </Text>
            {parsedLocation.city && (
              <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Medium' }}>
                {parsedLocation.city}
              </Text>
            )}

            <View className="flex-row items-center">
              <View className="flex-row items-center mr-4">
                <MapPin size={14} color="#6A9B00" />
                <Text className="text-xs text-gray-600 ml-1" style={{ fontFamily: 'Poppins-Medium' }}>
                  GPS Verified
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1" style={{ fontFamily: 'Poppins-Medium' }}>
                  2 min ago
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Job Title <Text className="text-[#EF4444]">*</Text>
            </Text>
            <TextInput
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g., Kitchen faucet repair, Electrical outlet..."
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black"
              placeholderTextColor="#9CA3AF"
              style={{ fontFamily: 'Poppins-Medium' }}
            />
            <Text className="text-xs text-gray-500 mt-1.5" style={{ fontFamily: 'Poppins-Regular' }}>
              Be specific about what needs to be done.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Description <Text className="text-[#EF4444]">*</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              numberOfLines={6}
              maxLength={MAX_DESCRIPTION_LENGTH}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black"
              placeholderTextColor="#9CA3AF"
              style={{
                fontFamily: 'Poppins-Medium',
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <View className="flex-row items-center justify-between mt-1.5">
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                Describe the issue in detail.
              </Text>
              <Text
                className={`text-xs ${descriptionCount >= MAX_DESCRIPTION_LENGTH ? 'text-[#EF4444]' : 'text-gray-500'}`}
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {descriptionCount}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-5">
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={canProceed ? 0.85 : 0.5}
            className={`rounded-xl py-4 items-center justify-center flex-row ${canProceed ? 'bg-black' : 'bg-gray-300'}`}
          >
            <Text
              className={`text-base mr-2 ${canProceed ? 'text-[#D7FF6B]' : 'text-gray-500'}`}
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Next
            </Text>
            <ArrowRight size={18} color={canProceed ? '#D7FF6B' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

