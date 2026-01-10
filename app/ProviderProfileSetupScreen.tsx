import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { ServiceCategory, apiClient, providerService, serviceRequestService } from '@/services/api';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, FileText, MapPin, Upload, User, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CategoryData extends ServiceCategory {
  IconComponent: React.ComponentType;
  selected: boolean;
}

export default function ProviderProfileSetupScreen() {
  const router = useRouter();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [businessName, setBusinessName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [licenseText, setLicenseText] = useState('');
  const [licenseDocument, setLicenseDocument] = useState<string | null>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [locationPlaceId, setLocationPlaceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const handleUploadLicense = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLicenseDocument(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveDocument = () => {
    setLicenseDocument(null);
  };

  const handleLocationPress = () => {
    router.push({
      pathname: '/LocationSearchScreen',
      params: {
        next: 'provider-profile-setup',
      },
    });
  };

  const params = useLocalSearchParams<{
    location?: string;
    placeId?: string;
    formattedAddress?: string;
    latitude?: string;
    longitude?: string;
  }>();
  
  const [exactLatitude, setExactLatitude] = useState<number | null>(null);
  const [exactLongitude, setExactLongitude] = useState<number | null>(null);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const apiCategories = await serviceRequestService.getCategories();
      
      if (!Array.isArray(apiCategories) || apiCategories.length === 0) {
        if (__DEV__) {
          console.warn('⚠️ Categories API returned empty or invalid data');
        }
        setCategories([]);
        return;
      }

      const categoriesWithIcons: CategoryData[] = apiCategories.map((cat) => {
        const IconComponent = getCategoryIcon(cat.name, cat.displayName, cat.description);
        return {
          ...cat,
          IconComponent,
          selected: selectedCategories.includes(cat.name || ''),
        };
      });

      setCategories(categoriesWithIcons);
      
      if (__DEV__) {
        console.log('✅ Categories loaded:', categoriesWithIcons.length);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      showError('Failed to load categories. Please try again.');
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [selectedCategories, showError]);

  // Load categories when modal opens
  useEffect(() => {
    if (showServiceDropdown && categories.length === 0) {
      loadCategories();
    }
  }, [showServiceDropdown, categories.length, loadCategories]);

  // Handle category toggle
  const handleCategoryToggle = (categoryName: string) => {
    haptics.light();
    setSelectedCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((name) => name !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
    
    // Update categories state to reflect selection
    setCategories((prev) =>
      prev.map((cat) =>
        cat.name === categoryName
          ? { ...cat, selected: !cat.selected }
          : cat
      )
    );
  };

  // Listen for location updates from LocationSearchScreen with EXACT coordinates
  useFocusEffect(
    useCallback(() => {
      if (params.location) {
        setLocation(params.location);
      }
      if (params.placeId) {
        setLocationPlaceId(params.placeId);
      }
      if (params.formattedAddress) {
        setLocation(params.formattedAddress);
      }
      // Store EXACT coordinates from API
      if (params.latitude) {
        const lat = parseFloat(params.latitude);
        if (!isNaN(lat)) {
          setExactLatitude(lat);
          if (__DEV__) {
            console.log('✅ Exact latitude from API:', lat);
          }
        }
      }
      if (params.longitude) {
        const lng = parseFloat(params.longitude);
        if (!isNaN(lng)) {
          setExactLongitude(lng);
          if (__DEV__) {
            console.log('✅ Exact longitude from API:', lng);
          }
        }
      }
    }, [params.location, params.placeId, params.formattedAddress, params.latitude, params.longitude])
  );

  const handleContinue = async () => {
    // Validation
    if (!businessName.trim()) {
      showError('Please enter your business name');
      return;
    }

    if (selectedCategories.length === 0) {
      showError('Please select at least one service category');
      return;
    }

    if (!description.trim()) {
      showError('Please enter a business description');
      return;
    }

    if (!location.trim() && !locationPlaceId) {
      showError('Please set your business location');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    haptics.light();

    try {
      // Get token first (required for API calls)
      const token = await apiClient.getAuthTokenPublic();
      if (!token) {
        showError('Session expired. Please sign up again.');
        setIsSaving(false);
        return;
      }
      
      // Get provider/company ID from company signup response (stored separately)
      // This is the ID from the company signup response body or token
      let providerId = await apiClient.getCompanyId();
      
      if (__DEV__) {
        console.log('✅ Company ID retrieved (from signup response or token):', providerId);
      }
      
      // If still no provider/company ID, we cannot proceed
      // The API endpoints require providerId in the URL path
      // Note: Company and Provider are the same - company ID is used as provider ID
      if (!providerId) {
        if (__DEV__) {
          console.error('❌ No provider/company ID found after signup. This should not happen.');
          console.error('❌ Token exists:', !!token);
          console.error('❌ Token length:', token.length);
          console.error('❌ Token preview:', token.substring(0, 20) + '...');
          console.error('❌ Please check company signup response includes ID or token contains user ID.');
        }
        showError('Unable to identify your account. Please try signing up again.');
        setIsSaving(false);
        return;
      }

      // Company and Provider are the same thing - use company ID directly for provider endpoints
      // No need to check if provider exists separately - company ID IS the provider ID
      if (__DEV__) {
        console.log('✅ ========== PROVIDER PROFILE SETUP ==========');
        console.log('✅ Using company ID as provider ID:', providerId);
        console.log('✅ Token exists:', !!token);
        console.log('✅ Token length:', token.length);
        console.log('✅ Company and Provider are the same entity - proceeding with provider endpoints');
        console.log('✅ ===========================================');
      }

      // Update location - ONLY send address in request body (as per API requirement)
      // VALIDATE: Ensure location is a valid non-empty string
      if (!location || typeof location !== 'string') {
        showError('Please set a valid business location address');
        setIsSaving(false);
        return;
      }
      
      const addressString = location.trim();
      
      if (!addressString || addressString.length === 0) {
        showError('Please set a valid business location address');
        setIsSaving(false);
        return;
      }
      
      // Clean address: remove newlines, tabs, extra whitespace, ensure single line
      const cleanAddress = addressString.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Ensure address is still valid after cleaning
      if (!cleanAddress || cleanAddress.length === 0) {
        showError('Please set a valid business location address');
        setIsSaving(false);
        return;
      }
      
      try {
        if (__DEV__) {
          console.log('🔄 Attempting to update location...');
          console.log('🔄 Provider ID (from token):', providerId);
          console.log('🔄 Note: Provider ID is extracted from Bearer token by backend');
          console.log('🔄 Original Address:', location);
          console.log('🔄 Clean Address:', cleanAddress);
          console.log('🔄 Address Length:', cleanAddress.length);
          console.log('🔄 Address Type:', typeof cleanAddress);
        }
        
        // FINAL CHECK: Verify address before sending
        if (__DEV__) {
          console.log('🔴 ========== BEFORE UPDATE LOCATION CALL ==========');
          console.log('🔴 cleanAddress:', cleanAddress);
          console.log('🔴 cleanAddress type:', typeof cleanAddress);
          console.log('🔴 cleanAddress length:', cleanAddress?.length || 0);
          console.log('🔴 cleanAddress value:', JSON.stringify(cleanAddress));
          const payloadToSend = { address: cleanAddress };
          console.log('🔴 Payload being sent:', payloadToSend);
          console.log('🔴 JSON.stringify payload:', JSON.stringify(payloadToSend));
          console.log('🔴 Payload keys:', Object.keys(payloadToSend));
          console.log('🔴 Address in payload:', payloadToSend.address);
          console.log('🔴 ================================================');
        }
        
        await providerService.updateLocation({
          address: cleanAddress, // Send cleaned address (provider ID extracted from token)
        });
        if (__DEV__) {
          console.log('✅ Provider/Company location updated with address:', cleanAddress);
        }
      } catch (locationError: any) {
        console.error('❌ Error updating location:', locationError);
        // Log full error details for debugging
        if (__DEV__) {
          console.error('❌ Location Error Details:', {
            message: locationError?.message,
            status: locationError?.status,
            statusText: locationError?.statusText,
            details: locationError?.details,
            originalError: locationError?.originalError,
            fullError: JSON.stringify(locationError, null, 2),
          });
        }
        // Show specific error message from API
        const errorMessage = getSpecificErrorMessage(locationError, 'save_location');
        showError(errorMessage);
        setIsSaving(false);
        return;
      }

      // Add categories (provider ID extracted from Bearer token automatically)
      try {
        if (__DEV__) {
          console.log('🔄 Attempting to add categories...');
          console.log('🔄 Provider ID will be extracted from Bearer token automatically');
          console.log('🔄 Categories:', selectedCategories);
        }
        await providerService.addCategories(selectedCategories); // NO providerId needed - extracted from token
        if (__DEV__) {
          console.log('✅ Provider categories added:', selectedCategories);
        }
      } catch (categoriesError: any) {
        console.error('❌ Error adding categories:', categoriesError);
        // Log full error details for debugging
        if (__DEV__) {
          console.error('❌ Categories Error Details:', {
            message: categoriesError?.message,
            status: categoriesError?.status,
            statusText: categoriesError?.statusText,
            details: categoriesError?.details,
            originalError: categoriesError?.originalError,
            fullError: JSON.stringify(categoriesError, null, 2),
          });
        }
        
        // Extract error message with better handling for "already has categories" case
        let errorMessage = getSpecificErrorMessage(categoriesError, 'add_categories');
        
        // If the error mentions categories already added, extract and format them nicely
        const errorText = categoriesError?.message || categoriesError?.details?.data?.error || errorMessage;
        if (errorText && errorText.includes('Provider already has the following categories:')) {
          // Extract category names from error message
          const categoriesMatch = errorText.match(/categories:\s*([^.]+)/);
          if (categoriesMatch && categoriesMatch[1]) {
            const categoryNames = categoriesMatch[1].split(',').map((c: string) => c.trim()).filter((c: string) => c);
            if (categoryNames.length > 0) {
              // Format category names to be more readable
              const formattedCategories = categoryNames
                .map((cat: string) => {
                  // Convert camelCase to readable format (e.g., "airConditioning" -> "Air Conditioning")
                  return cat
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str: string) => str.toUpperCase())
                    .trim();
                })
                .join(', ');
              
              errorMessage = `Some categories are already added to your profile: ${formattedCategories}. Please select different categories or remove existing ones first.`;
            }
          }
        }
        
        showError(errorMessage);
        setIsSaving(false);
        return;
      }

      // Save business name to AsyncStorage for welcome message
      await AsyncStorage.setItem('@ghands:business_name', businessName.trim());
      
      haptics.success();
      showSuccess('Profile setup completed successfully!');
      
      // Navigate to document upload (next step in onboarding)
      setTimeout(() => {
        router.replace('/ProviderUploadDocumentsScreen');
      }, 1500);
    } catch (error: any) {
      console.error('Error completing profile setup:', error);
      haptics.error();
      
      const errorMessage = getSpecificErrorMessage(error, 'provider_profile_setup');
      showError(errorMessage);
      setIsSaving(false);
    }
  };

  const isFormValid = 
    businessName.trim() && 
    description.trim() && 
    selectedCategories.length > 0 && 
    (location.trim() || locationPlaceId);

  return (
    <SafeAreaWrapper>
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-black mb-8" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Setup your Profile</Text>

        <View className="bg-gray-100 rounded-xl mb-4 px-4 py-3 flex-row items-center">
          <View className="w-12 h-12 mr-4 bg-[#6A9B00] border border-[#6A9B00] rounded-xl items-center justify-center">
            <User size={20} color="white" />
          </View>
          <TextInput
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            className="flex-1 text-black text-base"
            placeholderTextColor="#666666"
            style={{ fontFamily: 'Poppins-Medium' }}
          />
        </View>

        {/* Location Selection */}
        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Business Location
          </Text>
          <TouchableOpacity 
            onPress={handleLocationPress}
            className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View className="flex-1 flex-row items-center">
              <MapPin size={20} color="#6A9B00" style={{ marginRight: 12 }} />
              <Text 
                className="text-black text-base flex-1" 
                style={{ fontFamily: 'Poppins-Medium' }}
                numberOfLines={1}
              >
                {location || 'Tap to set location'}
              </Text>
            </View>
            <ChevronDown size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Service Categories - Multiple Selection */}
        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Service Categories {selectedCategories.length > 0 && `(${selectedCategories.length} selected)`}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowServiceDropdown(true)}
            className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
          <Text className="text-black text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} category${selectedCategories.length > 1 ? 'ies' : ''} selected`
                : 'Select service categories'}
          </Text>
          <ChevronDown size={20} color="#666666" />
        </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Description
          </Text>
          <TextInput
            placeholder="Describe your business"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 120,
            }}
          />
        </View>

        <View className="mb-8">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            License or certification
          </Text>
          
          {/* Text Input for License/Certification */}
          <TextInput
            placeholder="Enter license or certification details"
            value={licenseText}
            onChangeText={setLicenseText}
            multiline
            numberOfLines={3}
            className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base mb-3"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 80,
            }}
          />

          {/* Document Upload Section */}
          {licenseDocument ? (
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <FileText size={20} color="#6A9B00" />
              <View className="flex-1 ml-3">
                <Image 
                  source={{ uri: licenseDocument }} 
                  style={{ width: 60, height: 60, borderRadius: 8, marginBottom: 4 }}
                  resizeMode="cover"
                />
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  License document uploaded
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveDocument} className="ml-2">
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={handleUploadLicense}
              className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-12 items-center justify-center"
              activeOpacity={0.7}
            >
            <Upload size={32} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
                Tap to upload document
            </Text>
          </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid || isSaving}
          className={`rounded-xl py-4 px-6 ${
            isFormValid && !isSaving ? 'bg-[#6A9B00]' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text 
                className="text-center text-lg font-semibold text-white"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Saving...
              </Text>
            </View>
          ) : (
          <Text 
            className={`text-center text-lg font-semibold ${
              isFormValid ? 'text-white' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Finish Setup
          </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Service Dropdown Modal */}
      <Modal
        visible={showServiceDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceDropdown(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowServiceDropdown(false)}
          />
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'Poppins-Bold',
                    color: '#000000',
                    marginBottom: 4,
                  }}
                >
                  Select Service Categories
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: '#6B7280',
                  }}
                >
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} categor${selectedCategories.length > 1 ? 'ies' : 'y'} selected`
                    : 'You can select multiple categories'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowServiceDropdown(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12,
                }}
                activeOpacity={0.7}
              >
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {isLoadingCategories ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#6A9B00" />
                  <Text
                    style={{
                      marginTop: 16,
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: '#6B7280',
                    }}
                  >
                    Loading categories...
                  </Text>
                </View>
              ) : categories.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: '#6B7280',
                    }}
                  >
                    No categories available
                  </Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                  {categories.map((category, index) => {
                    const IconComponent = category.IconComponent;
                    const isSelected = selectedCategories.includes(category.name || '');
                    
                    return (
                      <TouchableOpacity
                        key={category.name || `category-${index}`}
                        onPress={() => handleCategoryToggle(category.name || '')}
                        activeOpacity={0.7}
                        style={{
                          marginBottom: 12,
                          borderRadius: 16,
                          borderWidth: isSelected ? 2 : 1.5,
                          borderColor: isSelected ? '#6A9B00' : '#E5E7EB',
                          backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                          padding: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isSelected ? 0.08 : 0.04,
                          shadowRadius: 3,
                          elevation: isSelected ? 3 : 1,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            {/* Icon Container */}
                            <View
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 14,
                                backgroundColor: isSelected ? '#6A9B00' : '#F3F4F6',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                              }}
                            >
                              <IconComponent />
                            </View>

                            {/* Text Content */}
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontFamily: 'Poppins-SemiBold',
                                  color: isSelected ? '#6A9B00' : '#111827',
                                  marginBottom: 4,
                                }}
                              >
                                {category.displayName || category.name}
                              </Text>
                              {category.description && (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontFamily: 'Poppins-Regular',
                                    color: '#6B7280',
                                    lineHeight: 16,
                                  }}
                                  numberOfLines={2}
                                >
                                  {category.description}
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* Checkmark */}
                          <View style={{ marginLeft: 12 }}>
                            {isSelected ? (
                              <View
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                  backgroundColor: '#6A9B00',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                              </View>
                            ) : (
                              <View
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                  borderWidth: 2,
                                  borderColor: '#D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                }}
                              />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Done Button */}
            {categories.length > 0 && (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 24,
                  borderTopWidth: 1,
                  borderTopColor: '#F3F4F6',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setShowServiceDropdown(false);
                  }}
                  style={{
                    backgroundColor: '#6A9B00',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#6A9B00',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-SemiBold',
                      color: '#FFFFFF',
                    }}
                  >
                    Done {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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

