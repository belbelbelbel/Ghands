import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Clock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useUserLocation } from '@/hooks/useUserLocation';

const MAX_DESCRIPTION_LENGTH = 500;

export default function JobDetailsScreen() {
  const router = useRouter();
  const { location } = useUserLocation();
  const { toast, showError, hideToast } = useToast();
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ jobTitle?: string; description?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
    const newErrors: { jobTitle?: string; description?: string } = {};
    
    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fill in all required fields');
      return;
    }
    
    setErrors({});
    router.push('../DateTimeScreen' as any);
  }, [jobTitle, description, location, router, showError]);

  const handleJobTitleChange = useCallback((text: string) => {
    setJobTitle(text);
    if (errors.jobTitle) {
      setErrors((prev) => ({ ...prev, jobTitle: undefined }));
    }
  }, [errors.jobTitle]);

  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  }, [errors.description]);

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
    <SafeAreaWrapper>
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
          <View className="mb-6 rounded-2xl bg-gray-100 px-4 py-4 border border-[#D7FF6B]/30">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-[#000] items-center justify-center mr-2">
                  <MapPin size={16} color="#81b60eff" />
                </View>
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Current Location
                </Text>
              </View>
              <TouchableOpacity onPress={handleChangeLocation} className='bg-black px-4 py-2  rounded-md' activeOpacity={0.7}>
                <Text className="text-sm text-[#81b60eff]" style={{ fontFamily: 'Poppins-SemiBold' }}>
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
              onChangeText={handleJobTitleChange}
              placeholder="e.g., Kitchen faucet repair, Electrical outlet..."
              className={`rounded-xl border bg-white px-4 py-3 text-base text-black ${
                errors.jobTitle ? 'border-[#EF4444]' : 'border-gray-200'
              }`}
              placeholderTextColor="#9CA3AF"
              style={{ fontFamily: 'Poppins-Medium' }}
            />
            {errors.jobTitle ? (
              <Text className="text-xs text-[#EF4444] mt-1.5" style={{ fontFamily: 'Poppins-Medium' }}>
                {errors.jobTitle}
              </Text>
            ) : (
              <Text className="text-xs text-gray-500 mt-1.5" style={{ fontFamily: 'Poppins-Regular' }}>
                Be specific about what needs to be done.
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-sm text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Description <Text className="text-[#EF4444]">*</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="Description"
              multiline
              numberOfLines={6}
              maxLength={MAX_DESCRIPTION_LENGTH}
              className={`rounded-xl border bg-white px-4 py-3 text-base text-black ${
                errors.description ? 'border-[#EF4444]' : 'border-gray-200'
              }`}
              placeholderTextColor="#9CA3AF"
              style={{
                fontFamily: 'Poppins-Medium',
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <View className="flex-row items-center justify-between mt-1.5">
              {errors.description ? (
                <Text className="text-xs text-[#EF4444]" style={{ fontFamily: 'Poppins-Medium' }}>
                  {errors.description}
                </Text>
              ) : (
                <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  Describe the issue in detail.
                </Text>
              )}
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
            activeOpacity={canProceed ? 0.85 : 1}
            className={`rounded-xl py-4 items-center justify-center flex-row ${
              canProceed ? 'bg-black' : 'bg-gray-200'
            }`}
            style={{
              opacity: canProceed ? 1 : 0.6,
            }}
          >
            <Text
              className={`text-base mr-2 ${canProceed ? 'text-[#D7FF6B]' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Next
            </Text>
            <ArrowRight size={18} color={canProceed ? '#D7FF6B' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}

