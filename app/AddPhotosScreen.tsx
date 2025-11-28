import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Camera, Plus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_SIZE = (screenWidth - 48) / 3 - 8;

interface PhotoItem {
  id: string;
  uri: string;
  selected: boolean;
}

export default function AddPhotosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedDateTime?: string; selectedDate?: string; selectedTime?: string }>();
  const { toast, showError, showWarning, hideToast } = useToast();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isFindingProviders, setIsFindingProviders] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  const findingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    let loopingAnimation: Animated.CompositeAnimation | null = null;
    if (isFindingProviders) {
      loopingAnimation = Animated.loop(
        Animated.timing(spinnerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      );
      spinnerAnim.setValue(0);
      loopingAnimation.start();
    } else {
      spinnerAnim.stopAnimation(() => {
        spinnerAnim.setValue(0);
      });
    }

    return () => {
      loopingAnimation?.stop();
    };
  }, [isFindingProviders, spinnerAnim]);

  useEffect(() => {
    return () => {
      if (findingTimeoutRef.current) {
        clearTimeout(findingTimeoutRef.current);
      }
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Camera roll permissions are required to upload images');
      return false;
    }
    return true;
  }, [showError]);

  const requestCameraPermissions = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('Camera permissions are required to take photos');
      return false;
    }
    return true;
  }, [showError]);

  const handleOpenGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = result.assets.map((asset) => ({
        id: `photo-${Date.now()}-${Math.random()}`,
        uri: asset.uri,
        selected: true,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      setSelectedPhotos((prev) => {
        const newSet = new Set(prev);
        newPhotos.forEach((photo) => newSet.add(photo.id));
        return newSet;
      });
    }
  }, []);

  const handleUploadPhotos = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // For now, directly open gallery. In a full implementation, you'd show a bottom sheet
    handleOpenGallery();
  }, [requestPermissions, handleOpenGallery]);

  const handleOpenCamera = useCallback(async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = result.assets.map((asset) => ({
        id: `photo-${Date.now()}-${Math.random()}`,
        uri: asset.uri,
        selected: true,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      setSelectedPhotos((prev) => {
        const newSet = new Set(prev);
        newPhotos.forEach((photo) => newSet.add(photo.id));
        return newSet;
      });
    }
  }, []);

  const handleTogglePhoto = useCallback((photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  }, []);

  const handleDone = useCallback(() => {
    if (isFindingProviders) {
      return;
    }
    if (selectedPhotos.size === 0) {
      showError('Please select at least one photo to continue');
      return;
    }
    // Show confirmation modal with date/time
    setShowConfirmModal(true);
  }, [isFindingProviders, selectedPhotos, showError]);

  const handleConfirmAndProceed = useCallback(() => {
    setShowConfirmModal(false);
    const selected = photos.filter((photo) => selectedPhotos.has(photo.id));
    setIsFindingProviders(true);

    if (findingTimeoutRef.current) {
      clearTimeout(findingTimeoutRef.current);
    }

    findingTimeoutRef.current = setTimeout(() => {
      setIsFindingProviders(false);
      router.push('/ServiceMapScreen');
    }, 1800);
  }, [photos, router, selectedPhotos]);

  const handleChangePhotos = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const animatedStyles = useRef({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }).current;

  const spin = spinnerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const canProceed = selectedPhotos.size > 0;

  return (
    <SafeAreaWrapper>
      <Animated.View style={[animatedStyles, { flex: 1 }]}>
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleBack}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
              Add photos
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Camera size={40} color="#6B7280" />
            </View>
            <Text className="text-lg text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
              Add Photos of the Issue
            </Text>
            <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
              Help providers understand the problem better
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleUploadPhotos}
            activeOpacity={0.85}
            className="bg-[#6A9B00] rounded-xl py-4 px-6 items-center justify-center flex-row mb-6"
          >
            <Plus size={20} color="#FFFFFF" />
            <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Upload Photos
            </Text>
          </TouchableOpacity>

          {photos.length > 0 && (
            <View className="mb-6">
              <View className="flex-row flex-wrap gap-2">
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.has(photo.id);
                  return (
                    <TouchableOpacity
                      key={photo.id}
                      onPress={() => handleTogglePhoto(photo.id)}
                      activeOpacity={0.8}
                      className="relative"
                      style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        className="w-full h-full rounded-xl"
                        resizeMode="cover"
                      />
                      <View
                        className={`absolute inset-0 rounded-xl border-2 ${
                          isSelected ? 'border-[#6A9B00] bg-[#6A9B00]/20' : 'border-transparent'
                        }`}
                      >
                        {isSelected && (
                          <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#6A9B00] items-center justify-center">
                            <View className="w-3 h-3 rounded-full bg-white" />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo.id);
                        }}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/50 items-center justify-center"
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {photos.length === 0 && (
            <View className="flex-row gap-2 mb-6">
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 items-center justify-center"
                  style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                >
                  <Camera size={24} color="#9CA3AF" />
                </View>
              ))}
            </View>
          )}

          <View className="rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/20 px-4 py-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Camera size={18} color="#D97706" />
              <Text className="text-sm text-[#D97706] ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Photo Tips
              </Text>
            </View>
            <View className="ml-6">
              <Text className="text-xs text-[#D97706] mb-1" style={{ fontFamily: 'Poppins-Medium' }}>
                • Take clear, well-lit photos
              </Text>
              <Text className="text-xs text-[#D97706] mb-1" style={{ fontFamily: 'Poppins-Medium' }}>
                • Include surrounding area for context
              </Text>
              <Text className="text-xs text-[#D97706]" style={{ fontFamily: 'Poppins-Medium' }}>
                • Show the problem from multiple angles
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-5 gap-3">
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.85}
            disabled={!canProceed || isFindingProviders}
            className={`rounded-xl py-4 items-center justify-center ${
              !canProceed || isFindingProviders ? 'bg-gray-300' : 'bg-black'
            }`}
          >
            <Text
              className={`text-base ${!canProceed || isFindingProviders ? 'text-gray-500' : 'text-white'}`}
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              {isFindingProviders ? 'Matching…' : 'Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            className="bg-gray-100 rounded-xl py-4 items-center justify-center"
          >
            <Text className="text-black text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Cancel request
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Confirmation Modal - Date/Time & Photos */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={handleChangePhotos}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <Animated.View
            style={[animatedStyles]}
            className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-[0px_24px_48px_rgba(15,23,42,0.2)]"
          >
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-[#E3F4DF] items-center justify-center mb-4">
                <Text className="text-3xl">📸</Text>
              </View>
              <Text className="text-lg text-black mb-3" style={{ fontFamily: 'Poppins-Bold' }}>
                Confirm Details
              </Text>
              
              {/* Date/Time Display */}
              {params.selectedDateTime && (
                <View className="w-full mb-4">
                  <View className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                    <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins-Medium' }}>
                      Scheduled Date & Time
                    </Text>
                    <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                      {params.selectedDateTime}
                    </Text>
                  </View>
                  
                  {/* Photos Preview */}
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Text className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
                      Selected Photos
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {photos
                        .filter((photo) => selectedPhotos.has(photo.id))
                        .slice(0, 3)
                        .map((photo) => (
                          <Image
                            key={photo.id}
                            source={{ uri: photo.uri }}
                            className="w-16 h-16 rounded-lg"
                            resizeMode="cover"
                          />
                        ))}
                      {selectedPhotos.size > 3 && (
                        <View className="w-16 h-16 rounded-lg bg-gray-200 items-center justify-center">
                          <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-SemiBold' }}>
                            +{selectedPhotos.size - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleConfirmAndProceed}
                activeOpacity={0.85}
                className="bg-black rounded-xl py-4 items-center justify-center"
              >
                <View className="flex-row items-center">
                  <Text className="text-base text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Next
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangePhotos}
                activeOpacity={0.85}
                className="bg-white border border-gray-200 rounded-xl py-4 items-center justify-center"
              >
                <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Finding Providers Modal */}
      <Modal transparent visible={isFindingProviders} animationType="fade">
        <View className="flex-1 bg-black/45 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 items-center shadow-[0px_24px_48px_rgba(15,23,42,0.2)]">
            <Animated.View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#E6F4D7',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: spin }],
              }}
            >
              <Image source={require('../assets/images/plumbericon2.png')} style={{ width: 42, height: 42, resizeMode: 'contain' }} />
            </Animated.View>
            <Text className="mt-5 text-lg text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Finding providers…
            </Text>
            <Text
              className="mt-2 text-sm text-gray-500 text-center"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Sit tight while we match you with trusted professionals nearby.
            </Text>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}

