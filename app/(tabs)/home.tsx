import { useRouter } from 'expo-router';
import { Bell, MapPin, Search, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import LiveSupportScreen from '@/components/LiveSupportScreen';
import { Ionicons } from '@expo/vector-icons';
import { ServiceCategory, homeScreenCategories } from '../../data/serviceCategories';
import { Provider } from '../../types';

// Nearby providers data
const nearbyProviders: Provider[] = [
  {
    id: '1',
    name: "Mike's Plumbing",
    profession: "Licensed Plumber",
    rating: 4.9,
    reviews: 127,
    distance: "1.2 miles",
    phone: "(123) 456-7890",
    icon: require('../../assets/images/plumbericon.png'),
    tags: ["Emergency", "Licensed", "24/7"]
  },
  {
    id: '2',
    name: "AutoFix Garage",
    profession: "Certified Mechanic",
    rating: 4.8,
    reviews: 89,
    distance: "0.8 miles",
    phone: "(234) 567-8901",
    icon: require('../../assets/images/mechanicicon.png'),
    tags: ["Certified", "Fast Service", "Warranty"]
  }
];


const ProviderCard = React.memo(({ provider }: { provider: Provider }) => {
  return (
    <View className='flex flex-row items-center justify-between border border-gray-200 rounded-2xl p-4 mb-4'>
      <View className='w-20 h-20 bg-gray-200 mr-4 rounded-full items-center justify-center'>
        <Image 
          source={provider.icon} 
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>
      <View className='flex-1'>
        <View className='flex-row items-center justify-between'>
          <Text className='text-lg font-bold text-black' style={{ fontFamily: 'Poppins-Bold' }}>
            {provider.name}
          </Text>
          <View className='flex-row items-center'>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text className='text-sm font-semibold text-black ml-1' style={{ fontFamily: 'Poppins-SemiBold' }}>
              {provider.rating}
            </Text>
          </View>
        </View>
        <View className='flex-row items-center justify-between mb-2 mt-1'>
          <Text className='text-gray-500 text-sm' style={{ fontFamily: 'Poppins-Medium' }}>
            {provider.profession}
          </Text>
          <Text className='text-gray-500 text-sm' style={{ fontFamily: 'Poppins-Medium' }}>
            {provider.reviews} reviews
          </Text>
        </View>
        <View className='flex-row items-center justify-between mb-2 mt-2'>
          <View className='flex-row items-center gap-1'>
            <Ionicons name='location-outline' size={14} color="#6A9B00" />
            <Text className='text-gray-500 text-sm' style={{ fontFamily: 'Poppins-Medium' }}>
              {provider.distance}
            </Text>
          </View>
          <View className='flex-row items-center gap-1'>
            <Ionicons name='call-outline' size={14} color="#6A9B00" />
            <Text className='text-gray-500 text-sm' style={{ fontFamily: 'Poppins-Medium' }}>
              {provider.phone}
            </Text>
          </View>
        </View>
        {/* Action Buttons */}
        <View className='flex-row items-center justify-between mt-3'>
          <TouchableOpacity className='flex-1 mr-2'>
            <Text className='text-[#6A9B00] text-center font-semibold' style={{ fontFamily: 'Poppins-SemiBold' }}>
              View profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className='flex-1 bg-[#6A9B00] rounded-xl py-2 px-4 flex-row items-center justify-center'>
            <Text className='text-white text-[12px] font-semibold mr-1' style={{ fontFamily: 'Poppins-SemiBold' }}>
              View on map
            </Text>
            <Ionicons name='arrow-forward' size={16} color="white"/>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});


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
      className="rounded-2xl bg-gray-100 px-3 py-2 items-center"
      style={{ width: '24%', marginBottom: 16 }}
      activeOpacity={0.8}
    >
      <View className="w-22 h-22 rounded-2xl items-center  justify-center mb-2 border-0">
        <IconComponent />
      </View>
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

const HomeScreen = React.memo(() => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleCategoryPress = useCallback((category: ServiceCategory) => {
    console.log('Category selected:', category.title);
  }, []);

  const handleViewAllCategories = useCallback(() => {
    router.push('/(tabs)/categories' as any);
  }, [router]);

  const handleSearchQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleNotificationPress = useCallback(() => {
    router.push('../NotificationsScreen' as any);
  }, [router]);

  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  }), [fadeAnim, slideAnim]);

  const searchBarStyle = useMemo(() => ({ height: 50 }), []);

  const bottomSpacerStyle = useMemo(() => ({ height: 90 }), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[animatedStyles, { flex: 1, }]}
        >
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row items-center justify-between mb-4">
              <View className='flex flex-row items-center gap-2'>
                 <MapPin size={20} color="#6A9B00" />
                <Text
                  className="text-sm font-bold text-black"
                  style={{ fontFamily: 'Poppins-ExtraBold' }}
                >
                 Lagos, 100001
                </Text>
                <View className="flex-row items-center mt-1 hidden">
                  <MapPin size={14} color="#6A9B00" />
                  <Text
                    className="text-xs text-gray-600 ml-1"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Lagos, 100001
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                className="relative p-2"
                onPress={handleNotificationPress}
              >
                <Bell size={22} color="#666" />
                <View className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
              </TouchableOpacity>
            </View>

            <View
              className="bg-gray-100 rounded-xl px-4 py-0 flex-row items-center"
              style={searchBarStyle}
            >
              {/* <Text className="text-[#ADF802] text-lg font-semibold mr-3">⚙</Text>  */}
              <TextInput
                placeholder="Search for services"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                className="flex-1 text-black text-base"
                placeholderTextColor="#666"
                style={{ fontFamily: 'Poppins-Medium' }}
              />
              <TouchableOpacity className="w-10 h-10 bg-[#6A9B00] rounded-lg items-center justify-center ml-2">
                <Search size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories Section */}
          <View className="px-4 pt-4 mb-3">
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
          <View className="px-0 mb-3">
            <View className="bg-gradient-to-r from-[#6A9B00] to-[#5A8A00] rounded-2xl p-6 ">
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
           {/* Nearby Providers Section */}
           <View className='px-4 mb-6'>
             <Text className="text-xl font-bold text-black mb-4" style={{ fontFamily: 'Poppins-Bold' }}>
               Nearby Providers
             </Text>
             
             {nearbyProviders.map((provider) => (
               <ProviderCard key={provider.id} provider={provider} />
             ))}
           </View>
           <LiveSupportScreen />
          <View style={bottomSpacerStyle} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;