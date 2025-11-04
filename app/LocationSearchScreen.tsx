import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LocationSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('Lagos, 100001');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('1, veekee james ave. b close, cowardice seminar');
  
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

  const handleBack = () => {
    router.back();
  };

  const handleUseCurrentLocation = () => {
    // Request current location
    console.log('Using current location');
    setSearchQuery('Current Location');
  };

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    console.log('Location confirmed:', selectedLocation);
    router.push('/ProfileSetupScreen');
  };

  const searchResults = [
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
    { name: 'Gowon Estate', address: '1, veekee james ave. b close, cowardice seminar' },
  ];

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
        <View className="flex-row items-center px-4 py-3" style={{ minHeight: screenHeight * 0.08 }}>
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Search Bar */}
          <View className="flex-row items-center mb-4" style={{ minHeight: screenHeight * 0.06 }}>
            <View className="flex-1 bg-gray-100 rounded-xl px-4 flex  justify-center mr-3" style={{ height: screenHeight * 0.06 }}>
              <View className="flex-1 bg-gray-100 rounded-xl px-4 flex  justify-center" style={{ height: screenHeight * 0.06 }}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Lagos, 100001"
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
              <Search size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Use Current Location */}
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

          {/* Selected/Recent Address */}
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

          {/* Search Results Header */}
          <Text 
            className="text-gray-500 text-sm mb-4"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            SEARCH RESULTS
          </Text>

          {/* Search Results */}
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

        {/* Filter Button */}
        <View className="px-4 pb-4" style={{ minHeight: screenHeight * 0.08 }}>
          <TouchableOpacity
            onPress={handleConfirm}
            className="bg-black rounded-xl py-4 px-6"
            activeOpacity={0.8}
            style={{ minHeight: 52 }}
          >
            <Text 
              className="text-white text-center text-lg font-semibold"
              style={{ 
                fontFamily: 'Poppins-SemiBold',
                fontSize: screenWidth < 375 ? 16 : 18
              }}
            >
              Filter
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
