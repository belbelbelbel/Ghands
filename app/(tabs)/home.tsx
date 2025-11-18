import LiveSupportScreen from '@/components/LiveSupportScreen';
import JobActivityCard from '@/components/home/JobActivityCard';
import PromoCodeCard from '@/components/home/PromoCodeCard';
import RecommendedCard from '@/components/home/RecommendedCard';
import TodoCard from '@/components/home/TodoCard';
import { jobActivities, promoCodes, recommendedServices, todoItems } from '@/components/home/data';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronDown, MapPin, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceCategory, homeScreenCategories } from '../../data/serviceCategories';

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
  const { location, isLoading, refreshLocation } = useUserLocation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Refresh location when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload location from storage when screen comes into focus
      refreshLocation();
    }, [refreshLocation])
  );

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
    router.push({
      pathname: '/(tabs)/categories',
      params: { selectedCategoryId: category.id },
    });
  }, [router]);

  const handleViewAllCategories = useCallback(() => {
    router.push('/categories' as any);
  }, [router]);

  const handleSearchQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleNotificationPress = useCallback(() => {
    router.push('../NotificationsScreen' as any);
  }, [router]);

  const handleLocationPress = useCallback(() => {
    router.push('../LocationSearchScreen' as any);
  }, [router]);

  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  }), [fadeAnim, slideAnim]);

  const searchBarStyle = useMemo(() => ({ height: 50 }), []);

  const bottomSpacerStyle = useMemo(() => ({ height: 90 }), []);

  const displayLocation = useMemo(() => {
    if (isLoading) {
      return 'Loading...';
    }
    if (!location || !location.trim()) {
      return 'Enter your location';
    }
    const trimmed = location.trim();
    return trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed;
  }, [location, isLoading]);

  const locationTextColor = location ? '#4B5563' : '#9CA3AF';
  const locationIconBackground = location ? '#D7FF6B' : '#F3F4F6';
  const locationIconColor = location ? '#111827' : '#6B7280';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[animatedStyles, { flex: 1, paddingTop: 20 }]}
        >
          <View className="px-4 pb-0">
            <View className="flex-row items-center justify-between mb-1">
              <TouchableOpacity
                onPress={handleLocationPress}
                className="flex-row items-center flex-1"
                activeOpacity={0.8}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: locationIconBackground }}
                >
                  <MapPin size={16} color={locationIconColor} />
                </View>
                <Text
                  className="text-sm flex-1"
                  numberOfLines={1}
                  style={{ fontFamily: 'Poppins-SemiBold', color: locationTextColor }}
                >
                  {displayLocation}
                </Text>
                <ChevronDown size={16} color={location ? '#4B5563' : '#9CA3AF'} />
              </TouchableOpacity>
              <TouchableOpacity
                className="relative p-2 ml-4"
                onPress={handleNotificationPress}
              >
                <Bell size={22} color="#111827" />
                <View className="absolute top-1 right-1 w-2 h-2 bg-[#D7FF6B] rounded-full" />
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
          <View className="px-4 pt-6 mb-0">
            <View className="flex-row pb-2 items-center justify-between mb-0vieew detaiuls">
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
                      <TouchableOpacity className="flex-row items-center">
                <Text
                  className="text-sm text-[#6A9B00]"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  View all
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6A9B00" />
              </TouchableOpacity>
                </Text>
              </TouchableOpacity>
            </View>


            <View className="flex-row flex-wrap justify-between">
              {homeScreenCategories.slice(0,4).map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onPress={handleCategoryPress}
                />
              ))}
            </View>
          </View>
          <View className="px-0 mb-0">
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
                  <TouchableOpacity className="bg-black rounded-xl py-3 px-6 self-start" onPress={() => router.push('categories' as any)}>
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
          {/* <View className='px-4 mb-6'>
             <Text className="text-xl font-bold text-black mb-4" style={{ fontFamily: 'Poppins-Bold' }}>
               Nearby Providers
             </Text>
             
             {nearbyProviders.map((provider) => (
               <ProviderCard key={provider.id} provider={provider} />
             ))}
           </View> */}
          <View className='px-4 mb-6'>
            <Text style={{
              fontFamily: 'Poppins-Bold'
            }} className='text-xl font-bold mb-2'>Todo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex mt-0  flex-row '>
              {todoItems.map((item) => (
                <TodoCard key={item.id} {...item} />
              ))}
            </ScrollView>
          </View>
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Job Activity
              </Text>
              <TouchableOpacity className="flex-row items-center">
                <Text
                  className="text-sm text-[#6A9B00]"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  View all
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6A9B00" />
              </TouchableOpacity>
            </View>
            {jobActivities.map((activity) => (
              <JobActivityCard key={activity.id} activity={activity} />
            ))}
          </View>

          <View className="px-4 mb-8">
            <Text
              className="text-xl font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Recommended for you
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendedServices.map((service) => (
                <RecommendedCard
                  key={service.id}
                  {...service}
                />
              ))}
            </ScrollView>
          </View>

          <View className="px-4 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Promo Codes
              </Text>
              <View className="w-10 h-10 rounded-full bg-[#EEF1FF] items-center justify-center">
                <Ionicons name="pricetag-outline" size={18} color="#2563EB" />
              </View>
            </View>
            {promoCodes.map((promo) => (
              <PromoCodeCard key={promo.id} promo={promo} />
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