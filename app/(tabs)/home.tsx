import { CoachMarkTarget } from '@/components/CoachMarkTarget';
import useCoachMarks from '@/hooks/useCoachMarks';
import LiveSupportScreen from '@/components/LiveSupportScreen';
import { JobCardSkeleton } from '@/components/LoadingSkeleton';
import LocationSearchModal from '@/components/LocationSearchModal';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import JobActivityCard from '@/components/home/JobActivityCard';
import PromoCodeCard from '@/components/home/PromoCodeCard';
import RecommendedCard from '@/components/home/RecommendedCard';
import TodoCard from '@/components/home/TodoCard';
import { promoCodes, quickActions, todoItems, type QuickAction } from '@/components/home/data';
import type { JobActivity } from '@/components/home/JobActivityCard';
import { haptics } from '@/hooks/useHaptics';
import { shareReferral } from '@/utils/referral';
import { useTokenGuard } from '@/hooks/useTokenGuard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Colors, REFRESH_CONTROL, useTabScrollContentPaddingTop } from '@/lib/designSystem';
import { ServiceRequest, authService, serviceRequestService } from '@/services/api';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { AuthError } from '@/utils/errors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronDown, MapPin, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceCategory } from '../../data/serviceCategories';

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
  const [refreshing, setRefreshing] = useState(false);

  // Tour disabled - keep hook to avoid runtime errors, use empty steps so tour never shows
  useCoachMarks([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const categoriesFadeAnim = useRef(new Animated.Value(1)).current; // Start visible for dummy data

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

  // Map ServiceRequest to JobActivity (priceFromQuotations = best total from quotes when request has no price)
  const mapRequestToJobActivity = useCallback((
    request: ServiceRequest,
    acceptedProvidersCount: number = 0,
    quotesCount: number = 0,
    priceFromQuotations?: number | null
  ): JobActivity => {
    const categoryDisplayName = request.categoryName
      ? request.categoryName.charAt(0).toUpperCase() + request.categoryName.slice(1).replace(/([A-Z])/g, ' $1')
      : 'Service';

    // Map status: scheduled = paid; reviewing = provider marked complete
    let status: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
    if (request.status === 'completed') {
      status = 'Completed';
    } else if (request.status === 'accepted' || request.status === 'in_progress' ||
               request.status === 'scheduled' || request.status === 'reviewing' ||
               (request.status as any) === 'inspecting') {
      status = 'In Progress';
    } else if (acceptedProvidersCount > 0) {
      status = 'In Progress';
    }

    const requestPrice = (request as any).price ?? (request as any).total;
    const price = requestPrice != null ? Number(requestPrice) : priceFromQuotations;
    const priceRange = price != null && !isNaN(price) ? `₦${Number(price).toLocaleString()}` : 'Price pending';

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

  // Load job activities – after mapRequestToJobActivity
  const loadJobActivities = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const requests = await serviceRequestService.getUserRequests();
      if (!Array.isArray(requests) || requests.length === 0) {
        setJobActivities([]);
        return;
      }
      const confirmedRequests = requests.filter((request) => {
        if (request.status === 'cancelled') return false;
        const hasJobTitle = request.jobTitle && request.jobTitle.trim().length > 0;
        const hasDescription = request.description && request.description.trim().length > 0;
        if (!hasJobTitle || !hasDescription) return false;
        const status = ((request as any).status ?? '').toString().toLowerCase();
        if (status === 'rejected' || status === 'no_providers') return false;
        return true;
      });
      const activityEntries = await Promise.all(
        confirmedRequests.map(async (request) => {
          let acceptedProvidersCount = 0;
          let quotesCount = 0;
          let priceFromQuotations: number | null = null;
          try {
            const [acceptedProviders, quotations] = await Promise.all([
              serviceRequestService.getAcceptedProviders(request.id),
              serviceRequestService.getQuotations(request.id).catch(() => []),
            ]);
            acceptedProvidersCount = acceptedProviders?.length || 0;
            const qList = Array.isArray(quotations) ? quotations : [];
            const sentQuotes = qList.filter((q: any) => q.sentAt || (q.status && q.status !== null));
            quotesCount = sentQuotes.length;
            if (sentQuotes.length > 0) {
              const toNum = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : parseFloat(v));
              const accepted = sentQuotes.find((q: any) => q.status === 'accepted');
              if (accepted != null) {
                const t = toNum((accepted as any).total);
                if (!isNaN(t) && t >= 0) priceFromQuotations = t;
              }
              if (priceFromQuotations == null) {
                const totals = sentQuotes.map((q: any) => toNum(q.total));
                const validTotals = totals.filter((t) => !isNaN(t) && t >= 0);
                if (validTotals.length > 0) priceFromQuotations = Math.min(...validTotals);
              }
            }
          } catch {
            if (__DEV__) { /* backend schema error - continue */ }
          }
          const activity = mapRequestToJobActivity(request, acceptedProvidersCount, quotesCount, priceFromQuotations);
          const createdAtMs = request?.createdAt ? new Date(request.createdAt).getTime() : 0;
          return { activity, createdAtMs };
        })
      );
      const statusPriority: Record<JobActivity['status'], number> = { 'In Progress': 0, Pending: 1, Completed: 2 };
      const sortedActivities = activityEntries
        .sort((a, b) => {
          const statusDiff = statusPriority[a.activity.status] - statusPriority[b.activity.status];
          return statusDiff !== 0 ? statusDiff : b.createdAtMs - a.createdAtMs;
        })
        .slice(0, 2)
        .map((entry) => entry.activity);
      setJobActivities(sortedActivities);
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      const isNetworkError = error?.isNetworkError || (error?.message || '').includes('Network') || (error?.message || '').includes('Failed to fetch');
      if (isNetworkError) {
        setJobActivities([]);
        return;
      }
      const status = (error as any)?.status;
      if (status === 401 || status === 403) {
        await handleAuthErrorRedirect(router);
        return;
      }
      if (status === 500) {
        // Backend/server issue: keep user on screen and show empty state.
        // Do not redirect to auth flow for non-auth failures.
        if (__DEV__) console.warn('Job activities API returned 500; skipping redirect.');
      }
      if (__DEV__) console.error('Error loading job activities:', error?.message || error);
      setJobActivities([]);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [mapRequestToJobActivity, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshLocation();
    await loadJobActivities();
    setRefreshing(false);
  }, [loadJobActivities, refreshLocation]);

  useFocusEffect(
    useCallback(() => {
      refreshLocation();
      loadJobActivities();
    }, [refreshLocation, loadJobActivities])
  );

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
        .map((cat: any) => {
          const IconComponent = getCategoryIcon(cat.name, cat.displayName, cat.description);
          return {
            id: cat.name || cat.categoryName || cat.id || `category-${cat.name}`,
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
        params: { searchQuery: searchQuery.trim() },
      });
    }
  }, [searchQuery, router]);

  const filteredCategories = useMemo(() => {
    const categoriesToUse = apiCategories.length > 0 ? apiCategories : [];

    if (!searchQuery.trim()) {
      return categoriesToUse;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = categoriesToUse.filter(
      (category) =>
        category.title.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query)
    );
    return filtered;
  }, [searchQuery, apiCategories]);

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

  // Temporarily disabling home recommendations until we plug in real data
  const personalizedRecommendations: any[] = [];

  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  }), [fadeAnim, slideAnim]);

  const searchBarStyle = useMemo(() => ({ height: 50 }), []);

  const bottomSpacerStyle = useMemo(() => ({ height: 90 }), []);
  const tabScrollTop = useTabScrollContentPaddingTop(10);

  // If checking token, show nothing (will redirect if no token)
  if (isChecking) {
    return null;
  }

  return (
    <SafeAreaWrapper tabletShellTop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={REFRESH_CONTROL.tintColor}
            colors={REFRESH_CONTROL.colors as unknown as string[]}
          />
        }
      >
        <Animated.View
          style={[animatedStyles, { flex: 1, paddingTop: tabScrollTop }]}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <CoachMarkTarget name="location-selector" style={{ flex: 1, marginRight: 8 }}>
                <TouchableOpacity
                  onPress={handleLocationPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: Colors.white,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    minHeight: 52,
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel={location ? `Location: ${location}` : 'Enter your location'}
                  accessibilityHint="Opens location search"
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <MapPin size={18} color={Colors.accent} />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: location ? Colors.textPrimary : Colors.textSecondaryDark,
                      flex: 1,
                      marginRight: 4,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {location || 'Enter your location'}
                  </Text>
                  <ChevronDown size={18} color={location ? Colors.textSecondaryDark : Colors.textTertiary} />
                </TouchableOpacity>
              </CoachMarkTarget>
              <TouchableOpacity
                style={{ position: 'relative', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
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
            <View className="px-4 pt-4 mb-0">
              <View className="flex-row pb-1 items-center justify-between mb-2">
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
                {filteredCategories.length === 0 ? (
                  // Skeleton line for categories when nothing is loaded yet - matches actual CategoryItem size
                  <View style={{ flexDirection: 'row', marginTop: 2, marginBottom: 18 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} style={{ width: 100, marginRight: 12 }}>
                        <View
                          style={{
                            borderRadius: 16,
                            backgroundColor: '#F3F4F6',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                            borderWidth: 0,
                          }}
                        >
                          {/* Icon skeleton */}
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 8,
                              backgroundColor: '#E5E7EB',
                              marginBottom: 8,
                            }}
                          />
                          {/* Text skeleton */}
                          <View
                            style={{
                              width: 60,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: '#E5E7EB',
                            }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                    style={{ marginTop: 2, marginBottom: 18 }}
                  >
                    {filteredCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        onPress={handleCategoryPress}
                      />
                    ))}
                  </ScrollView>
                )}
              </Animated.View>
            </View>
          </CoachMarkTarget>

          {/* Quick Actions */}
          <CoachMarkTarget name="quick-actions">
            <View className="px-4 mt-3 mb-8">
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
                        name={action.iconName as any}
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
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#000000',
                      borderRadius: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      alignSelf: 'flex-start',
                    }}
                    onPress={async () => {
                      haptics.light();
                      await shareReferral({ role: 'client', code: undefined });
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
            <Text className='text-lg font-bold mb-2' style={{ fontFamily: 'Poppins-Bold', letterSpacing: -0.3 }}>Todo</Text>
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
                  style={{ letterSpacing: -0.3, fontFamily: 'Poppins-Bold' }}
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

          {/* Recommended for you section temporarily removed until we have real recommendations */}

          <View className="px-4 mb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text
                className="text-lg font-bold text-black"
                style={{ letterSpacing: -0.3, fontFamily: 'Poppins-Bold' }}
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

      {/* Coach Marks - disabled */}

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