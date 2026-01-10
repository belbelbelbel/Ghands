import CoachMarks from '@/components/CoachMarks';
import LiveSupportScreen from '@/components/LiveSupportScreen';
import { JobCardSkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import JobActivityCard from '@/components/home/JobActivityCard';
import PromoCodeCard from '@/components/home/PromoCodeCard';
import RecommendedCard from '@/components/home/RecommendedCard';
import TodoCard from '@/components/home/TodoCard';
import { jobActivities, promoCodes, quickActions, recommendedServices, todoItems, type QuickAction } from '@/components/home/data';
import { useCoachMarks } from '@/hooks/useCoachMarks';
import { haptics } from '@/hooks/useHaptics';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronDown, MapPin, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceCategory, homeScreenCategories } from '../../data/serviceCategories';
import { serviceRequestService } from '@/services/api';
import { getCategoryIcon } from '@/utils/categoryIcons';

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
      style={{ width: 100, marginRight: 12 }}
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
  const [apiCategories, setApiCategories] = useState<ServiceCategory[]>([]); // API categories
  const { location, isLoading, refreshLocation } = useUserLocation();
  const {
    isVisible: isCoachMarksVisible,
    currentStep,
    currentMark,
    totalSteps,
    startTour,
    nextStep,
    previousStep,
    skipTour,
  } = useCoachMarks();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const categoriesFadeAnim = useRef(new Animated.Value(1)).current; // Start visible for dummy data

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

  // Fetch categories from API on mount
  useEffect(() => {
    loadCategoriesFromAPI();
  }, []);

  // Animate categories when API data loads
  useEffect(() => {
    if (apiCategories.length > 0) {
      // Subtle fade animation when real data replaces dummy data
      Animated.sequence([
        Animated.timing(categoriesFadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(categoriesFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [apiCategories]);

  // Shuffle array function for randomizing category order
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const loadCategoriesFromAPI = async () => {
    try {
      const categories = await serviceRequestService.getCategories();
      
      if (!Array.isArray(categories) || categories.length === 0) {
        // If API fails or returns empty, keep dummy data
        if (__DEV__) {
          console.log('⚠️ Categories API returned empty or invalid data, using dummy data');
        }
        return;
      }
      
      // Map API categories to ServiceCategory format with icons
      const categoriesWithIcons: ServiceCategory[] = categories
        .map((cat) => {
          const IconComponent = getCategoryIcon(cat.name, cat.displayName, cat.description);
          return {
            id: cat.name || cat.categoryName || `category-${cat.id}`,
            title: cat.displayName || cat.name || 'Service',
            icon: IconComponent,
          };
        });
      
      // Shuffle categories for random order on home page
      const shuffledCategories = shuffleArray(categoriesWithIcons);
      
      // Limit to 8 for home screen (same as dummy data)
      const limitedCategories = shuffledCategories.slice(0, 8);
      
      // Replace dummy data with API data
      setApiCategories(limitedCategories);
      
      if (__DEV__) {
        console.log('✅ Categories loaded from API (randomized):', limitedCategories.length);
      }
    } catch (error: any) {
      // On error, keep dummy data (silent fail for better UX)
      if (__DEV__) {
        console.error('Error loading categories from API:', error);
        console.log('ℹ️ Using dummy categories as fallback');
      }
      // Don't show error to user - just use dummy data
    }
  };

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

  // Use API categories if available, otherwise use dummy data (shuffled)
  // Memoize shuffled dummy categories so they don't re-shuffle on every render
  const shuffledDummyCategories = useMemo(() => {
    return shuffleArray([...homeScreenCategories]);
  }, []); // Only shuffle once on mount

  const filteredCategories = useMemo(() => {
    const categoriesToUse = apiCategories.length > 0 ? apiCategories : shuffledDummyCategories;
    
    if (!searchQuery.trim()) {
      return categoriesToUse;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = categoriesToUse.filter(
      (category) =>
        category.title.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query)
    );
    // If no results found, show all categories instead of empty
    return filtered.length > 0 ? filtered : categoriesToUse;
  }, [searchQuery, apiCategories, shuffledDummyCategories]);

  const handleNotificationPress = useCallback(() => {
    router.push('../NotificationsScreen' as any);
  }, [router]);

  const handleLocationPress = useCallback(() => {
    router.push('../LocationSearchScreen' as any);
  }, [router]);

  const handleViewAllJobs = useCallback(() => {
    router.push('/(tabs)/jobs' as any);
  }, [router]);

  // Generate personalized recommendations based on booking history
  const personalizedRecommendations = useMemo(() => {
    if (jobActivities.length === 0) {
      // If no booking history, show default recommendations
      return recommendedServices;
    }

    // Extract categories from job history
    const bookedCategories = jobActivities.map(job => job.category.toLowerCase());
    const uniqueCategories = [...new Set(bookedCategories)];

    // Generate recommendations based on booking history
    // If user booked plumbing, suggest related services or rebooking
    const personalized = uniqueCategories.map((category, index) => {
      // Map category names to category IDs
      const categoryMap: { [key: string]: { id: string; title: string; image: any } } = {
        'plumbing': { 
          id: 'plumber', 
          title: 'Plumbing', 
          image: require('../../assets/images/plumbericon2.png') 
        },
        'electrical': { 
          id: 'electrician', 
          title: 'Electrical', 
          image: require('../../assets/images/electricianicon2.png') 
        },
        'cleaning': { 
          id: 'cleaning', 
          title: 'Cleaning', 
          image: require('../../assets/images/cleanericon2.png') 
        },
        'painting': { 
          id: 'painter', 
          title: 'Painting', 
          image: require('../../assets/images/paintericon2.png') 
        },
      };

      const categoryInfo = categoryMap[category] || {
        id: category,
        title: category.charAt(0).toUpperCase() + category.slice(1),
        image: require('../../assets/images/plumbericon2.png'),
      };

      return {
        id: `personalized-${category}-${index}`,
        title: categoryInfo.title,
        subtitle: `Based on your ${category} booking${jobActivities.filter(j => j.category.toLowerCase() === category).length > 1 ? 's' : ''}`,
        image: categoryInfo.image,
        categoryId: categoryInfo.id,
      };
    });

    // Add some default recommendations if we have space
    const remaining = recommendedServices.slice(0, 3 - personalized.length);
    return [...personalized, ...remaining].slice(0, 3);
  }, [jobActivities]);

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

            <Animated.View style={{ opacity: categoriesFadeAnim }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                style={{ marginTop: 5, marginBottom: 20 }}
              >
                {filteredCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onPress={handleCategoryPress}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View className="px-4 mb-6">
            <Text
              className="text-xl font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Quick Actions
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {(quickActions || []).map((action: QuickAction) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => {
                    haptics.light();
                    if (action.id === 'emergency') {
                      router.push({
                        pathname: '/(tabs)/categories',
                        params: { emergency: 'true' },
                      });
                    } else if (action.id === 'book-again') {
                      router.push('/(tabs)/jobs' as any);
                    } else if (action.id === 'wallet') {
                      router.push('/WalletScreen' as any);
                    }
                  }}
                  activeOpacity={0.8}
                  style={{
                    minWidth: 140,
                    marginRight: 12,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 16,
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons 
                      name={action.iconName} 
                      size={24} 
                      color={action.id === 'emergency' ? '#DC2626' : '#000000'} 
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: '#000000',
                      textAlign: 'center',
                    }}
                  >
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
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
                    Invite Friends, Earn Rewards
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: 'rgba(0, 0, 0, 0.7)',
                      marginBottom: 16,
                    }}
                  >
                    Get $10 credit for each friend who signs up
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#000000',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        flex: 1,
                      }}
                      onPress={() => {
                        haptics.light();
                        // TODO: Implement share/referral flow
                        // For now, can navigate to a referral screen or show share dialog
                        router.push('/(tabs)/categories' as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-SemiBold',
                          color: '#FFFFFF',
                          textAlign: 'center',
                        }}
                      >
                        Invite Now
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(0, 0, 0, 0.2)',
                      }}
                      onPress={() => {
                        haptics.light();
                        startTour();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Medium',
                          color: '#000000',
                          textAlign: 'center',
                        }}
                      >
                        Take Tour
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                  <Ionicons name="gift" size={40} color="#000000" />
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
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Recommended for you
              </Text>
              {jobActivities.length > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={16} color="#6A9B00" style={{ marginRight: 4 }} />
                  <Text
                    className="text-xs text-[#6A9B00]"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Personalized
                  </Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {personalizedRecommendations.map((service) => (
                <RecommendedCard
                  key={service.id}
                  {...service}
                  onPress={() => {
                    haptics.light();
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

      {/* Coach Marks Modal */}
      <CoachMarks
        visible={isCoachMarksVisible}
        currentMark={currentMark}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
        onClose={skipTour}
      />
    </SafeAreaWrapper>
  );
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;