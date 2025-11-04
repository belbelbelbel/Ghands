import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Camera, Mail, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { InputField } from '../components/InputField';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { ProfileFormData, profileFormSchema } from '../lib/validation';

// Mock user ID - In production, get from auth context/store
const MOCK_USER_ID = 'user-123';

export default function EditProfileScreen() {
  const router = useRouter();
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>();

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useProfile(MOCK_USER_ID);
  
  // Update profile mutation
  const updateProfileMutation = useUpdateProfile();

  // Form setup with validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setValue('name', profile.name);
      setValue('email', profile.email);
      setValue('phone', profile.phone);
      if (profile.profileImageUri) {
        setProfileImageUri(profile.profileImageUri);
      }
    }
  }, [profile, setValue]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        userId: MOCK_USER_ID,
        payload: {
          ...data,
          profileImageUri,
        },
      });

      Alert.alert('Success', 'Your profile has been updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.'
      );
    }
  };

  // Handle profile image picker (placeholder for now)
  const handleImagePicker = async () => {
    // TODO: Implement image picker using expo-image-picker
    Alert.alert('Image Picker', 'Image picker functionality will be implemented here');
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6A9B00" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  const isSaveDisabled = isSubmitting || !isValid || updateProfileMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className='flex-row items-center px-4 py-4 bg-transparent border-b border-gray-100'>
        <TouchableOpacity onPress={() => router.back()}>
          <View className='w-8 h-8 items-center justify-center'>
            <Text className='text-black text-2xl'>←</Text>
          </View>
        </TouchableOpacity>
        <Text 
          className='text-xl font-bold text-black flex-1 text-center mr-8' 
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Edit your profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-8">
          {/* Profile Picture */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="w-32 h-32 bg-white rounded-full items-center justify-center border-2 border-black">
                {profileImageUri ? (
                  // TODO: Add Image component to display profile image
                  <User size={60} color="#6A9B00" />
                ) : (
                  <User size={60} color="#6A9B00" />
                )}
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-black rounded-full p-3 border-2 border-black"
                onPress={handleImagePicker}
              >
                <Camera size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View className="space-y-4">
            <View>
              <InputField
                placeholder="Mike Plumbings"
                icon={<User size={20} color="white" />}
                value={name}
                onChangeText={(text) => setValue('name', text, { shouldValidate: true })}
                keyboardType="default"
              />
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1 px-4" style={{ fontFamily: 'Poppins-Medium' }}>
                  {errors.name.message}
                </Text>
              )}
            </View>

            <View>
              <InputField
                placeholder="miketheplumber@gmail.com"
                icon={<Mail size={20} color="white" />}
                value={email}
                onChangeText={(text) => setValue('email', text, { shouldValidate: true })}
                keyboardType="email-address"
              />
              {errors.email && (
                <Text className="text-red-500 text-xs mt-1 px-4" style={{ fontFamily: 'Poppins-Medium' }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View>
              <InputField
                placeholder="08100055522"
                icon={<Phone size={20} color="white" />}
                value={phone}
                onChangeText={(text) => setValue('phone', text, { shouldValidate: true })}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text className="text-red-500 text-xs mt-1 px-4" style={{ fontFamily: 'Poppins-Medium' }}>
                  {errors.phone.message}
                </Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 px-6 mt-6 items-center ${
              isSaveDisabled ? 'bg-gray-400' : 'bg-black'
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSaveDisabled}
            activeOpacity={0.7}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text 
                className="text-white text-base font-semibold" 
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Save changes
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
