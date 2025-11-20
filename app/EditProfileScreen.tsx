import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Mail, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { InputField } from '../components/InputField';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { ProfileFormData, profileFormSchema } from '../lib/validation';

// Mock user ID - In production, get from auth context/store
const MOCK_USER_ID = 'user-123';

export default function EditProfileScreen() {
  const router = useRouter();
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Gallery',
          onPress: openGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.ghands.com'}/upload/profile`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImageUri(data.imageUrl || imageUri);
      } else {
        setProfileImageUri(imageUri);
      }
    } catch (error) {
      setProfileImageUri(imageUri);
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaWrapper backgroundColor="#F9FAFB">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6A9B00" />
          <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const isSaveDisabled = isSubmitting || !isValid || updateProfileMutation.isPending;

  return (
    <SafeAreaWrapper backgroundColor="#F9FAFB">
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
              <View className="w-32 h-32 bg-white rounded-full items-center justify-center border-2 border-black overflow-hidden">
                {isUploadingImage ? (
                  <ActivityIndicator size="large" color="#6A9B00" />
                ) : profileImageUri ? (
                  <Image
                    source={{ uri: profileImageUri }}
                    style={{ width: 128, height: 128, borderRadius: 64 }}
                    resizeMode="cover"
                  />
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
    </SafeAreaWrapper>
  );
}
