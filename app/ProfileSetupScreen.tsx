import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, MapPin, Plus, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [location, setLocation] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Debug log for profile image changes
  useEffect(() => {
    // console.log('Profile image changed:', profileImage);
  }, [profileImage]);
  
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
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
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

    // console.log('Camera result:', result);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Setting profile image from camera:', result.assets[0].uri);
      setProfileImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    // console.log('Gallery result:', result);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Setting profile image from gallery:', result.assets[0].uri);
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddHomeAddress = () => {
    router.push('/LocationSearchScreen');
  };

  const handleSave = () => {
    console.log('Profile saved:', {
      fullName,
      homeAddress,
      location,
      selectedGender,
      description,
      profileImage,
    });
    
    // Here you would typically upload the image to your backend
    // Navigate to main tab navigation
    router.replace('/(tabs)/home');
  };

  const isFormValid = fullName.trim()  && location.trim() && selectedGender && description.trim();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1"
      >
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-4"
          style={{ minHeight: screenHeight * 0.02 }}
        >
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <Text 
            className="text-lg font-bold text-black"
            style={{ 
              fontFamily: 'Poppins-Bold',
              fontSize: screenWidth < 375 ? 16 : 18
            }}
          >
            Setup your Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Profile Picture Section */}
          <View className="items-center mb-8">
            <TouchableOpacity 
              onPress={pickImage}
              className="border-2 border-gray-300 rounded-full items-center justify-center relative overflow-hidden"
              activeOpacity={0.8}
              style={{ 
                width: screenWidth * 0.32, 
                height: screenWidth * 0.32,
                minWidth: 120,
                minHeight: 120,
                maxWidth: 140,
                maxHeight: 140
              }}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={{
                    width: screenWidth * 0.3,
                    height: screenWidth * 0.3,
                    borderRadius: (screenWidth * 0.3) / 2,
                    minWidth: 110,
                    minHeight: 110,
                    maxWidth: 130,
                    maxHeight: 130
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Camera size={32} color="#6A9B00" />
              )}
              <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-full items-center justify-center">
                <Plus size={16} color="white" />
              </View>
            </TouchableOpacity>
            {profileImage && (
              <Text className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
                Image selected ✓
              </Text>
            )}
            {/* Debug info
            <Text className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
              {profileImage ? `Image URI: ${profileImage.substring(0, 50)}...` : 'No image selected'}
            </Text> */}
            {/* Debug button - remove this later */}
            {/* <TouchableOpacity 
              onPress={() => setProfileImage('https://via.placeholder.com/128x128/ADF802/000000?text=Test')}
              className="mt-2 px-4 py-2 bg-gray-200 rounded-lg"
            >
              <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
                Test Image
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Full Name Input */}
          <View 
            className="flex-row items-center mb-4"
            style={{ minHeight: screenHeight * 0.06 }}
          >
            <View 
              className="bg-[#6A9B00] border-[0.5px] border-black rounded-xl items-center justify-center mr-4"
              style={{ 
                width: screenWidth * 0.12, 
                height: screenWidth * 0.08,
                minWidth: 48,
                minHeight: 48
              }}
            >
              <User size={20} color="white" />
            </View>
            <View 
              className="flex-1 bg-gray-100 rounded-xl px-4 py-3"
            >
              <TextInput
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                className="text-black text-base"
                placeholderTextColor="#666666"
                style={{ 
                  fontFamily: 'Poppins-Medium',
                  fontSize: screenWidth < 375 ? 14 : 16
                }}
              />
            </View>
          </View>

          {/* Home Address Input */}
          <View 
            className="flex-row items-center mb-4"
            style={{ minHeight: screenHeight * 0.06 }}
          >
            <View 
              className="bg-[#6A9B00] border-[0.5px] border-black rounded-xl items-center justify-center mr-4"
              style={{ 
                width: screenWidth * 0.12, 
                height: screenWidth * 0.12,
                minWidth: 48,
                minHeight: 48
              }}
            >
              <MapPin size={20} color="white" />
            </View>
            <TouchableOpacity
              onPress={handleAddHomeAddress}
              className="flex-1 bg-[#000000] rounded-xl py-3 px-4"
              activeOpacity={0.8}
              style={{ minHeight: 48 }}
            >
              <Text 
                className="text-white text-base text-center"
                style={{ 
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: screenWidth < 375 ? 14 : 16
                }}
              >
                Add home address
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location Input */}
          <View 
            className="bg-gray-100 rounded-xl px-4 py-3 mb-6"
            style={{ minHeight: screenHeight * 0.06 }}
          >
            <TextInput
              placeholder="Location..."
              value={location}
              onChangeText={setLocation}
              className="text-black text-base"
              placeholderTextColor="#666666"
              style={{ 
                fontFamily: 'Poppins-Medium',
                fontSize: screenWidth < 375 ? 14 : 16
              }}
            />
          </View>

          {/* Gender Selection */}
          <View className="mb-6">
            <Text 
              className="text-black text-base mb-3"
              style={{ 
                fontFamily: 'Poppins-Medium',
                fontSize: screenWidth < 375 ? 14 : 16
              }}
            >
              Gender:
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setSelectedGender('male')}
                className={`flex-1 mr-2 border-2 rounded-xl py-3 items-center ${
                  selectedGender === 'male' 
                    ? 'border-[#000000] bg-[#000000]' 
                    : 'border-gray-300 bg-white'
                }`}
                activeOpacity={0.8}
                style={{ minHeight: screenHeight * 0.06 }}
              >
                <Text 
                style={{ 
                  fontFamily: 'Poppins-Medium',
                  fontSize: screenWidth < 375 ? 16 : 20
                }}
                  className={`${
                    selectedGender === 'male' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Male 
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedGender('female')}
                className={`flex-1 ml-2 border-2 rounded-xl py-3 items-center ${
                  selectedGender === 'female' 
                    ? 'border-[#000000] bg-[#000000]' 
                    : 'border-gray-300 bg-white'
                }`}
                activeOpacity={0.8}
                style={{ minHeight: screenHeight * 0.06 }}
              >
                <Text 
                style={{ 
                  fontFamily: 'Poppins-Medium',
                  fontSize: screenWidth < 375 ? 16 : 20
                }}
                  className={`${
                    selectedGender === 'female' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Female 
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description Input */}
          <View className="mb-8">
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base"
              placeholderTextColor="#666666"
              style={{ 
                fontFamily: 'Poppins-Medium',
                textAlignVertical: 'top',
                minHeight: screenHeight * 0.12,
                fontSize: screenWidth < 375 ? 14 : 16
              }}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View 
          className="px-4 pb-4"
          style={{ minHeight: screenHeight * 0.08 }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isFormValid}
            className={`rounded-xl py-4 px-6 ${
              isFormValid ? 'bg-[#6A9B00]' : 'bg-gray-300'
            }`}
            activeOpacity={0.8}
            style={{ minHeight: 52 }}
          >
            <Text 
              className={`text-center text-lg font-semibold ${
                isFormValid ? 'text-white' : 'text-gray-500'
              }`}
              style={{ 
                fontFamily: 'Poppins-SemiBold',
                fontSize: screenWidth < 375 ? 16 : 18
              }}
            >
              Save Profile
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
