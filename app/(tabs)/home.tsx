import { useRouter } from 'expo-router';
import { Bell, MapPin, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ServiceCategory, homeScreenCategories } from '../../data/serviceCategories';

// Memoized CategoryItem component to prevent unnecessary re-renders
const CategoryItem = React.memo(({ 
  category, 
  onPress 
}: { 
  category: ServiceCategory; 
  onPress: (category: ServiceCategory) => void;
}) => {
  const handlePress = useCallback(() => {
    onPress(category);
  }, [category, onPress]);

  const IconComponent = category.icon;

  return (
    <TouchableOpacity
      key={category.id}
      onPress={handlePress}
      className="rounded-2xl items-center"
      style={{ width: '23%', marginBottom: 16 }}
      activeOpacity={0.8}
    >
      {/* Icon Container */}
      <View className="w-22 h-22 rounded-2xl items-center bg-gray-100 justify-center mb-2 border-0">
        <IconComponent />
      </View>
      
      {/* Category Title */}
      <Text 
        className="text-xs font-medium text-black text-center"
        style={{ fontFamily: 'Poppins-Medium' }}
      >
        {category.title}
      </Text>
    </TouchableOpacity>
  );
});

CategoryItem.displayName = 'CategoryItem';

// Main HomeScreen component with performance optimizations
const HomeScreen = React.memo(() => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memoize animation values to prevent recreation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Memoize animation configuration
  const animationConfig = useMemo(() => ({
    fadeConfig: {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    },
    slideConfig: {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }
  }), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, animationConfig.fadeConfig),
      Animated.timing(slideAnim, animationConfig.slideConfig),
    ]).start();
  }, [fadeAnim, slideAnim, animationConfig]);

  // Memoized event handlers
  const handleCategoryPress = useCallback((category: ServiceCategory) => {
    console.log('Category selected:', category.title);
  }, []);

  const handleViewAllCategories = useCallback(() => {
    router.push('/(tabs)/categories');
  }, [router]);

  const handleSearchQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Memoized animated styles
  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  }), [fadeAnim, slideAnim]);

  // Memoized search bar height style
  const searchBarStyle = useMemo(() => ({ height: 50 }), []);

  // Memoized bottom spacer style
  const bottomSpacerStyle = useMemo(() => ({ height: 90 }), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="white" 
        translucent={false}
        hidden={false}
      />
      <Animated.View 
        style={[animatedStyles, { flex: 1 }]}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text 
                className="text-2xl font-bold text-black"
                style={{ fontFamily: 'Poppins-ExtraBold' }}
              >
                GHands
              </Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#666" />
                <Text 
                  className="text-xs text-gray-600 ml-1"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Lagos, 100001
                </Text>
              </View>
            </View>
            <TouchableOpacity className="relative p-2">
              <Bell size={22} color="#666" />
              <View className="absolute top-1 right-1 w-2 h-2 bg-[#ADF802] rounded-full" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View 
            className="bg-gray-100 rounded-xl px-4 py-0 flex-row items-center" 
            style={searchBarStyle}
          >
            <Text className="text-[#ADF802] text-lg font-semibold mr-3">⚙</Text> 
            <TextInput
              placeholder="Search for services"
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              className="flex-1 text-black text-base"
              placeholderTextColor="#666"
              style={{ fontFamily: 'Poppins-Medium' }}
            />
            <TouchableOpacity className="w-10 h-10 bg-black rounded-lg items-center justify-center ml-2">
              <Search size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section */}
        <View className="px-4 pt-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text 
              className="text-xl font-bold text-black"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Categories
            </Text>
            <TouchableOpacity 
              onPress={handleViewAllCategories}
              className="px-3 py-1"
            >
              <Text 
                className="text-[#00000] text-sm font-semibold"
                style={{ fontFamily: 'Poppins-SemiBold' }} 
              >
                View all →
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4x2 Grid Categories */}
          <View className="flex-row flex-wrap justify-between">
            {homeScreenCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onPress={handleCategoryPress}
              />
            ))}
          </View>
        </View>

        {/* Promotional Banner */}
        <View className="px-0 mb-6">
          <View className="bg-gradient-to-r from-[#ADF802] to-[#90E040] rounded-2xl p-6 ">
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text 
                  className="text-xl font-bold text-black mb-2"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Your one-stop shop for help
                </Text>
                <Text 
                  className="text-sm text-black/70 mb-4"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Find trusted professionals for all your needs
                </Text>
                <TouchableOpacity className="bg-black rounded-xl py-3 px-6 self-start">
                  <Text 
                    className="text-white font-semibold"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    Get Started
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="w-20 h-20 bg-black/10 rounded-full items-center justify-center">
                <Text className="text-3xl">🛠️</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacer for Tab Navigation */}
        <View style={bottomSpacerStyle} />
      </Animated.View>
    </SafeAreaView>
  );
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;