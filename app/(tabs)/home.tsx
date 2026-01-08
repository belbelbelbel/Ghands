import LiveSupportScreen from '@/components/LiveSupportScreen';
import { CategorySkeleton, JobCardSkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
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
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      style={{ width: 84, marginRight: 12 }}
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
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { location, isLoading, refreshLocation } = useUserLocation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/categories',
        params: { searchQuery: searchQuery.trim()},
      });
    }
  }, [searchQuery, router]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return homeScreenCategories;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = homeScreenCategories.filter(
      (category) =>
        category.title.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query)
    );
    // If no results found, show all categories instead of empty
    return filtered.length > 0 ? filtered : homeScreenCategories;
  }, [searchQuery]);

  const handleNotificationPress = useCallback(() => {
    router.push('../NotificationsScreen' as any);
  }, [router]);

  const handleLocationPress = useCallback(() => {
    router.push('../LocationSearchScreen' as any);
  }, [router]);

  const handleViewAllJobs = useCallback(() => {
    router.push('/(tabs)/jobs' as any);
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
  const locationIconBackground = location ? '#111827' : '#F3F4F6';
  const locationIconColor = location ? '#9bd917ff' : '#6B7280';

  return (
    <SafeAreaWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[animatedStyles, { flex: 1, paddingTop: 17 }]}
        >
          <View className="px-4 pt-0 pb-0">
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
                <View className="absolute top-1 right-1 w-2 h-2 bg-[#9bd719ff] rounded-full" />
              </TouchableOpacity>
            </View>

            <View
              className="bg-gray-100 rounded-xl px-4 py-0 flex-row items-center"
              style={searchBarStyle}
            >
              <TextInput
                placeholder="Search for services"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                className="flex-1 text-black text-base"
                placeholderTextColor="#666"
                style={{ fontFamily: 'Poppins-Medium' }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  className="w-8 h-8 items-center justify-center mr-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name='close-outline' size={20} color="#666" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                className="w-10 h-10 bg-black rounded-lg items-center justify-center ml-2"
                onPress={handleSearch}
                activeOpacity={0.8}
              >
                <Search size={18} color="#9bd719ff" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="px-4 pt-6 mb-0">
            <View className="flex-row pb-2 items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Categories
              </Text>
              <TouchableOpacity
                onPress={handleViewAllCategories}
                className="px-3 py-1 flex-row items-center"
              >
                <Text
                  className="text-sm text-black"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  View all
                </Text>
                <Ionicons name="chevron-forward" size={16} color="black" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              style={{ marginTop: 5, marginBottom: 20 }}
            >
              {isLoadingCategories ? (
                <>
                  <View style={{ width: 80, marginRight: 12 }}>
                    <CategorySkeleton />
                  </View>
                  <View style={{ width: 80, marginRight: 12 }}>
                    <CategorySkeleton />
                  </View>
                  <View style={{ width: 80, marginRight: 12 }}>
                    <CategorySkeleton />
                  </View>
                  <View style={{ width: 80, marginRight: 12 }}>
                    <CategorySkeleton />
                  </View>
                </>
              ) : (
                filteredCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onPress={handleCategoryPress}
                  />
                ))
              )}
            </ScrollView>
          </View>
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: '#6A9B00',
                borderRadius: 16,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Poppins-Bold',
                      color: '#000000',
                      marginBottom: 8,
                    }}
                  >
                    Your one-stop shop for help
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: 'rgba(0, 0, 0, 0.7)',
                      marginBottom: 16,
                    }}
                  >
                    Find trusted professionals for all your needs
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#000000',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => router.push('/UserGuideScreen' as any)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#FFFFFF',
                      }}
                    >
                      New to GHands? Learn how it works
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 16,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>🛠️</Text>
                </View>
              </View>
            </View>
          </View>
          <View className='px-4 mb-6 hidden'>
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
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={handleViewAllJobs}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm text-black"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  View all
                </Text>
                <Ionicons name="chevron-forward" size={16} color="black" />
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <>
                <JobCardSkeleton />
                <JobCardSkeleton />
              </>
            ) : (
              jobActivities.map((activity, index) => (
                <View key={activity.id} style={{ marginBottom: index < jobActivities.length - 1 ? 16 : 0 }}>
                  <JobActivityCard activity={activity} />
                </View>
              ))
            )}
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
                  onPress={() => {
                    if (service.categoryId) {
                      router.push({
                        pathname: '/(tabs)/categories',
                        params: { selectedCategoryId: service.categoryId },
                      });
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>

          <View className="px-4 mb-10">
            <View className="flex-row items-center justify-between mb-5">
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
            {promoCodes.map((promo, index) => (
              <View key={promo.id} style={{ marginBottom: index < promoCodes.length - 1 ? 16 : 0 }}>
                <PromoCodeCard promo={promo} />
              </View>
            ))}
          </View>

          <LiveSupportScreen />
          <View style={bottomSpacerStyle} />
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;