import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing } from '@/lib/designSystem';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LocationSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = params?.next;
  const { location, setLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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
  }, []);

  useEffect(() => {
    if (location) {
      setSearchQuery(location);
      setSelectedLocation(location);
    }
  }, [location]);

  const handleBack = () => {
    router.back();
  };

  const handleUseCurrentLocation = async () => {
    try {
      // Request location permission and get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showError('Location permission is required to use current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const currentLocation = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
      setSearchQuery(currentLocation);
      setSelectedLocation(currentLocation);
      showSuccess('Current location detected!');
    } catch (error) {
      showError('Failed to get current location. Please enter manually.');
    }
  };

  const handleSearch = () => {
  };

  const handleLocationSelect = (value: string) => {
    setSelectedLocation(value);
    setSearchQuery(value);
  };

  const handleConfirm = async () => {
    if (!selectedLocation.trim()) {
      showError('Please select or enter a location');
      return;
    }

    setIsSaving(true);

    try {
      await setLocation(selectedLocation.trim());
      showSuccess('Location saved successfully!');

      // If this screen was opened as part of the onboarding/profile flow,
      // send the user forward instead of back to the permission screen.
      setTimeout(() => {
        if (next === 'ProfileSetupScreen') {
          router.replace('/ProfileSetupScreen');
        } else {
          router.back();
        }
      }, 1000);
    } catch (error) {
      showError('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const searchResults = [
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
  ];

  return (
    <SafeAreaWrapper>
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1"
      >
        
        <View className="flex-row items-center px-4 py-3" style={{ minHeight: screenHeight * 0.02 }}>
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          
          <View className="flex-row items-center mb-4" style={{ minHeight: screenHeight * 0.06 }}>
            <View className="flex-1 bg-gray-100 rounded-xl px-4 flex  justify-center mr-3" style={{ height: screenHeight * 0.06 }}>
              <View className="flex-1 bg-gray-100 rounded-xl px-4 flex  justify-center" style={{ height: screenHeight * 0.06 }}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Enter your location"
                  className="text-black text-base"
                  placeholderTextColor="#666666"
                  style={{ fontFamily: 'Poppins-Medium', fontSize: screenWidth < 375 ? 14 : 16 }}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              className="bg-black rounded-xl items-center justify-center"
              style={{ width: screenWidth * 0.15, height: screenWidth * 0.12, minWidth: 48, minHeight: 48 }}
            >
              <Search size={20} color="#9bd719ff" />
            </TouchableOpacity>
          </View>

          
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            className="flex-row items-center mb-6"
            activeOpacity={0.7}
            style={{ minHeight: screenHeight * 0.06 }}
          >
            <Send size={20} color="#000000" className="mr-3" />
            <Text 
              className="text-[#000000] text-base"
              style={{ 
                fontFamily: 'Poppins-Medium',
                fontSize: screenWidth < 375 ? 14 : 16
              }}
            >
              Use my current location
            </Text>
          </TouchableOpacity>

          
          <View 
            className="bg-gray-100 rounded-xl px-4 py-3 mb-6"
            style={{ minHeight: screenHeight * 0.08 }}
          >
            <Text 
              className="text-black text-base"
              style={{ 
                fontFamily: 'Poppins-Medium',
                fontSize: screenWidth < 375 ? 14 : 16
              }}
            >
              {selectedLocation}
            </Text>
          </View>

          
          <Text 
            className="text-gray-500 text-sm mb-4"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            SEARCH RESULTS
          </Text>

          
          <View className="mb-8">
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleLocationSelect(result.address)}
                className={`py-4 ${index !== searchResults.length - 1 ? 'border-b border-gray-200' : ''}`}
                activeOpacity={0.7}
              >
                <Text 
                  className="text-black text-base font-bold mb-1"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  {result.name}
                </Text>
                <Text 
                  className="text-gray-600 text-sm"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {result.address}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 8,
          }}
        >
          <Button
            title={isSaving ? 'Saving...' : 'Save location'}
            onPress={handleConfirm}
            variant="secondary"
            size="large"
            fullWidth
            loading={isSaving}
            disabled={isSaving || !selectedLocation.trim()}
          />
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
