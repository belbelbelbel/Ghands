import CoachMarks, { CoachMarkStep } from '@/components/CoachMarks';
import { CoachMarkTarget } from '@/components/CoachMarkTarget';
import LiveSupportScreen from '@/components/LiveSupportScreen';
import LocationSearchModal from '@/components/LocationSearchModal';
import { JobCardSkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import JobActivityCard from '@/components/home/JobActivityCard';
import PromoCodeCard from '@/components/home/PromoCodeCard';
import RecommendedCard from '@/components/home/RecommendedCard';
import TodoCard from '@/components/home/TodoCard';
import { promoCodes, quickActions, recommendedServices, todoItems, type QuickAction, type JobActivity } from '@/components/home/data';
import useCoachMarks from '@/hooks/useCoachMarks';
import { haptics } from '@/hooks/useHaptics';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronDown, MapPin, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceCategory, homeScreenCategories } from '../../data/serviceCategories';
import { serviceRequestService, ServiceRequest, authService } from '@/services/api';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Colors, BorderRadius, Spacing, SHADOWS } from '@/lib/designSystem';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { useTokenGuard } from '@/hooks/useTokenGuard';

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
  const { isChecking } = useTokenGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [apiCategories, setApiCategories] = useState<ServiceCategory[]>([]); // API categories
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { location, isLoading, refreshLocation } = useUserLocation();
  const [jobActivities, setJobActivities] = useState<JobActivity[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  // Coach marks configuration
  const coachMarkSteps: CoachMarkStep[] = [
    {
      id: 'location',
      target: 'location-selector',
      title: 'Set Your Location',
      description: 'Tap here to set your location. This helps us show you nearby service providers.',
      position: 'bottom',
    },
    {
      id: 'search',
      target: 'search-bar',
      title: 'Search Services',
      description: 'Use the search bar to quickly find any service you need.',
      position: 'bottom',
    },
    {
      id: 'categories',
      target: 'categories-section',
      title: 'Browse Categories',
      description: 'Explore different service categories or tap "View all" to see everything.',
      position: 'bottom',
    },
    {
      id: 'quick-actions',
      target: 'quick-actions',
      title: 'Quick Actions',
      description: 'Access emergency services, book again, or manage your wallet quickly.',
      position: 'bottom',
    },
    {
      id: 'job-activity',
      target: 'job-activity',
      title: 'Track Your Jobs',
      description: 'See all your active and completed service requests here.',
      position: 'bottom',
    },
  ];

  const {
    isComplete: isCoachMarksComplete,
    isLoading: isLoadingCoachMarks,
    currentStep,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  } = useCoachMarks(coachMarkSteps);

  // Start coach marks tour on first visit
  useEffect(() => {
    if (!isLoadingCoachMarks && !isCoachMarksComplete && coachMarkSteps.length > 0) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingCoachMarks, isCoachMarksComplete, startTour, coachMarkSteps.length]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const categoriesFadeAnim = useRef(new Animated.Value(1)).current; // Start visible for dummy data

  // Refresh location and jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload location from storage when screen comes into focus
      refreshLocation();
      // Reload job activities
      loadJobActivities();
    }, [refreshLocation, loadJobActivities])
  );

  // Refresh location when modal closes
  useEffect(() => {
    if (!showLocationModal) {
      refreshLocation();
    }
  }, [showLocationModal, refreshLocation]);

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

  // Helper function to format time ago
  const formatTimeAgo = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch {
      return 'Recently';
    }
  }, []);

  // Map ServiceRequest to JobActivity
  const mapRequestToJobActivity = useCallback((request: ServiceRequest, acceptedProvidersCount: number = 0): JobActivity => {
    const categoryDisplayName = request.categoryName
      ? request.categoryName.charAt(0).toUpperCase() + request.categoryName.slice(1).replace(/([A-Z])/g, ' $1')
      : 'Service';
    
    // Map status: If providers have accepted, show "In Progress" even if request status is "pending"
    let status: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
    if (request.status === 'completed') {
      status = 'Completed';
    } else if (request.status === 'accepted' || request.status === 'in_progress') {
      status = 'In Progress';
    } else if (acceptedProvidersCount > 0) {
      // Providers have accepted, but request status is still "pending" (waiting for client selection)
      status = 'In Progress'; // Show as "In Progress" to indicate providers have accepted
    }

    // Get quotations count (if available)
    const quotesCount = 0; // TODO: Get from request if available

    // Format price range (if available)
    const priceRange = request.price ? `₦${request.price.toLocaleString()}` : 'Price pending';

    return {
      id: request.id.toString(),
      title: request.jobTitle || `${categoryDisplayName} Service`,
      category: categoryDisplayName,
      submittedAt: formatTimeAgo(request.createdAt),
      quotes: quotesCount,
      priceRange,
      status,
    };
  }, [formatTimeAgo]);

  // Load job activities from API
  const loadJobActivities = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      // Fetch all requests
      const requests = await serviceRequestService.getUserRequests();
      
      if (!Array.isArray(requests) || requests.length === 0) {
        setJobActivities([]);
        return;
      }

      // Filter out requests that are still in the booking flow (not confirmed yet)
      // Also filter out cancelled/deleted requests - they should only show in Jobs tab
      // Only show requests that have been confirmed/booked AND sent to providers
      const confirmedRequests = requests.filter((request) => {
        // Exclude cancelled requests - they should only show in Jobs tab
        if (request.status === 'cancelled') {
          return false;
        }
        
        // Must have both jobTitle and description
        const hasJobTitle = request.jobTitle && request.jobTitle.trim().length > 0;
        const hasDescription = request.description && request.description.trim().length > 0;
        if (!hasJobTitle || !hasDescription) {
          return false;
        }
        
        // For "pending" status: Only show if booking has been sent to providers
        // A booking is sent to providers when:
        // 1. It has location (request was sent to providers via updateJobDetails)
        // OR it has scheduled date/time (user confirmed booking in DateTimeScreen)
        // This ensures user has completed the booking flow and seen providers
        // but is still waiting for provider response (status is still "pending", not "accepted")
        // Note: When a provider is selected, status changes to "accepted", so if status is "pending",
        // it means no provider has been selected yet
        if (request.status === 'pending') {
          const hasScheduledDateTime = !!(request.scheduledDate && request.scheduledTime);
          const hasLocation = !!(request.location?.latitude && request.location?.longitude);
          const hasLocationText = !!(request.location?.formattedAddress || request.location?.address);
          
          // Show "pending" if booking has been sent to providers (has location OR date/time)
          // This means user has completed the booking flow and confirmed booking
          // Status being "pending" already means no provider has been selected yet
          // (if provider was selected, status would be "accepted")
          return hasScheduledDateTime || hasLocation || hasLocationText;
        }
        
        // Show all other statuses (accepted, in_progress, completed) - these are confirmed
        return true;
      });

      // Map to JobActivity format - Load accepted providers for each request to determine correct status
      const activities = await Promise.all(
        confirmedRequests.map(async (request) => {
          // Check if providers have accepted this request
          let acceptedProvidersCount = 0;
          try {
            const acceptedProviders = await serviceRequestService.getAcceptedProviders(request.id);
            acceptedProvidersCount = acceptedProviders?.length || 0;
          } catch (error) {
            // Silently fail - if we can't load accepted providers, use request status
            if (__DEV__) {
              console.log(`Could not load accepted providers for request ${request.id}:`, error);
            }
          }
          
          return mapRequestToJobActivity(request, acceptedProvidersCount);
        })
      );

      // Sort by date (most recent first) and limit to 2 most recent
      const sortedActivities = activities
        .sort((a, b) => {
          // Sort by status priority: In Progress > Pending > Completed
          const statusPriority = { 'In Progress': 0, 'Pending': 1, 'Completed': 2 };
          const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
          if (priorityDiff !== 0) return priorityDiff;
          // Then by ID (most recent first)
          return parseInt(b.id) - parseInt(a.id);
        })
        .slice(0, 2); // Show only 2 most recent

      setJobActivities(sortedActivities);
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      
      // Check if it's a network error
      const isNetworkError = error?.isNetworkError || 
                            error?.message?.includes('Network') || 
                            error?.message?.includes('Failed to fetch') ||
                            error?.message?.includes('Network request failed');
      
      if (isNetworkError) {
        // Don't show error for network issues on home screen - just show empty state
        setJobActivities([]);
        return;
      }
      
      // Check if it's a 500 error - might indicate invalid/expired token
      const status = (error as any)?.status;
      if (status === 500) {
        // 500 errors on protected routes often mean invalid token
        // Check if we have a token - if not, redirect
        try {
          const token = await authService.getAuthToken();
          if (!token) {
            // No token = redirect to login
            await handleAuthErrorRedirect(router);
            return;
          }
        } catch (tokenError) {
          // Can't get token = redirect
          await handleAuthErrorRedirect(router);
          return;
        }
      }
      
      if (__DEV__ && !(error instanceof AuthError)) {
        console.error('Error loading job activities:', error?.message || error);
      }
      setJobActivities([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [mapRequestToJobActivity, router]);

  // Fetch categories from API on mount
  useEffect(() => {
    loadCategoriesFromAPI();
    loadJobActivities();
  }, [loadJobActivities]);

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
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      
      // On error, clear categories to show empty state
      setApiCategories([]);
      if (__DEV__) {
        console.error('Error loading categories from API:', error);
      }
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
    haptics.light();
    setShowLocationModal(true);
  }, []);

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

  // If checking token, show nothing (will redirect if no token)
  if (isChecking) {
    return null;
  }

  return (
    <SafeAreaWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[animatedStyles, { flex: 1, paddingTop: 17 }]}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <CoachMarkTarget name="location-selector">
                <TouchableOpacity
                  onPress={handleLocationPress}
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: Colors.black,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <MapPin size={16} color={Colors.accent} />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: location ? Colors.textPrimary : Colors.textSecondaryDark,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {location || 'Enter your location'}
                  </Text>
                  <ChevronDown size={16} color={location ? Colors.textSecondaryDark : Colors.textTertiary} />
                </TouchableOpacity>
              </CoachMarkTarget>
              <TouchableOpacity
                style={{ position: 'relative', padding: 8, marginLeft: 16 }}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Bell size={22} color={Colors.textPrimary} />
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.accent,
                  }}
                />
              </TouchableOpacity>
            </View>

            <CoachMarkTarget name="search-bar">
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
            </CoachMarkTarget>
          </View>
          <CoachMarkTarget name="categories-section">
            <View className="px-4 pt-6 mb-0">
            <View className="flex-row pb-2 items-center justify-between mb-4">
              <Text
                className="text-lg font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold', letterSpacing: -0.3 }}
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
                style={{ marginTop: 5, marginBottom: 28 }}
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
          </CoachMarkTarget>

          {/* Quick Actions */}
          <CoachMarkTarget name="quick-actions">
            <View className="px-4 mb-8">
            <Text
              className="text-lg font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-Bold', letterSpacing: -0.3 }}
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
          </CoachMarkTarget>

          <View style={{ paddingHorizontal: 16, marginBottom: 28 }}>
            <View
              style={{
                backgroundColor: '#6A9B00',
                borderRadius: 16,
                paddingVertical: 24,
                paddingHorizontal: 18,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: '#000000',
                      marginBottom: 6,
                    }}
                  >
                    Invite Friends, Earn Rewards
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Medium',
                      color: 'rgba(0, 0, 0, 0.7)',
                      marginBottom: 12,
                      lineHeight: 18,
                    }}
                  >
                    Get $10 credit for each friend who signs up
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#000000',
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 18,
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
                          fontSize: 13,
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
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
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
                          fontSize: 13,
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
                    width: 64,
                    height: 64,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 14,
                  }}
                >
                  <Ionicons name="gift" size={32} color="#000000" />
                </View>
              </View>
            </View>
          </View>
          <View className='px-4 mb-6 hidden'>
            <Text style={{
              fontFamily: 'Poppins-Bold'
            }} className='text-lg font-bold mb-2' style={{ letterSpacing: -0.3 }}>Todo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex mt-0  flex-row '>
              {todoItems.map((item) => (
                <TodoCard key={item.id} {...item} />
              ))}
            </ScrollView>
          </View>
          <CoachMarkTarget name="job-activity">
            <View className="px-4 mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-lg font-bold text-black"
                  style={{ letterSpacing: -0.3 }}
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
            {isLoadingJobs ? (
              <>
                <JobCardSkeleton />
                <JobCardSkeleton />
              </>
            ) : jobActivities.length > 0 ? (
              jobActivities.map((activity, index) => (
                <View key={activity.id} style={{ marginBottom: index < jobActivities.length - 1 ? 16 : 0 }}>
                  <JobActivityCard activity={activity} />
                </View>
              ))
            ) : (
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 20,
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#F2F7EC',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="briefcase-outline" size={32} color="#6A9B00" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  No jobs yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  Your recent job activity will appear here
                </Text>
              </View>
            )}
            </View>
          </CoachMarkTarget>

          <View className="px-4 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-bold text-black"
                style={{ letterSpacing: -0.3 }}
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
                className="text-lg font-bold text-black"
                style={{ letterSpacing: -0.3 }}
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

      {/* Coach Marks */}
      <CoachMarks
        steps={coachMarkSteps}
        visible={!isCoachMarksComplete && !isLoadingCoachMarks && currentStep >= 0 && currentStep < coachMarkSteps.length}
        onComplete={completeTour}
        onSkip={skipTour}
        currentStep={currentStep}
        onStepChange={(step) => {
          if (step < coachMarkSteps.length) {
            if (step > currentStep) {
              nextStep();
            } else if (step < currentStep) {
              previousStep();
            }
          } else {
            completeTour();
          }
        }}
      />

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          refreshLocation();
        }}
        onLocationSelected={(selectedLocation) => {
          setShowLocationModal(false);
          refreshLocation();
        }}
      />
    </SafeAreaWrapper>
  );
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;