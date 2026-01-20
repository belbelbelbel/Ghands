import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import ServiceMap, { ProviderCategory, ServiceProvider } from '@/components/ServiceMap';
import BookingSummaryModal, { BookingSummaryData } from '@/components/BookingSummaryModal';
import { haptics } from '@/hooks/useHaptics';
import { useUserLocation } from '@/hooks/useUserLocation';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH < 375 ? 0.85 : SCREEN_WIDTH < 414 ? 0.92 : 1.0;
import { Button } from '@/components/ui/Button';
import { providerService, locationService } from '@/services/api';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { normalizeCategoryName, isValidCategoryName } from '@/utils/categoryMapping';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
const MAX_SELECTION = 3;

// Dummy providers - only used in development mode for testing
const SAMPLE_PROVIDERS: ServiceProvider[] = __DEV__ ? [
  {
    id: 'provider-1',
    name: "Mike's Plumbing",
    category: 'Plumber',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 miles away',
    availability: 'Available',
    image: require('../assets/images/plumbericon2.png'),
    coords: { latitude: 6.6018, longitude: 3.3515 },
  },
  {
    id: 'provider-2',
    name: 'Spark Electric Co.',
    category: 'Electrician',
    rating: 4.7,
    reviews: 96,
    distance: '1.1 miles away',
    availability: 'Available',
    image: require('../assets/images/electricianicon2.png'),
    coords: { latitude: 6.6128, longitude: 3.3615 },
  },
  {
    id: 'provider-3',
    name: 'Shine Auto Spa',
    category: 'Car Wash',
    rating: 4.8,
    reviews: 88,
    distance: '1.4 miles away',
    availability: 'Available',
    image: require('../assets/images/cleanericon.png'),
    coords: { latitude: 6.5965, longitude: 3.3472 },
  },
  {
    id: 'provider-4',
    name: 'Rapid Fix Plumbing',
    category: 'Plumber',
    rating: 4.6,
    reviews: 142,
    distance: '1.6 miles away',
    availability: 'Available',
    image: require('../assets/images/plumbericon.png'),
    coords: { latitude: 6.609, longitude: 3.3312 },
  },
  {
    id: 'provider-5',
    name: 'Bright Sparks',
    category: 'Electrician',
    rating: 4.9,
    reviews: 203,
    distance: '2.1 miles away',
    availability: 'Available',
    image: require('../assets/images/electricianicon.png'),
    coords: { latitude: 6.593, longitude: 3.3674 },
  },
] : [];


const ServiceMapScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedDateTime?: string;
    selectedDate?: string;
    selectedTime?: string;
    photoCount?: string;
    serviceType?: string;
    location?: string;
    categoryName?: string;
  }>();
  const { location: savedLocation } = useUserLocation();
  const { toast, showError, hideToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>('All');
  const [selectedProviders, setSelectedProviders] = useState<ServiceProvider[]>([]);
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviceLocation, setServiceLocation] = useState<string>(savedLocation || '');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [serviceLocationCoords, setServiceLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  
  // Booking data state - synced with params
  const [bookingData, setBookingData] = useState<{
    serviceType?: string;
    dateTime?: string;
    date?: string;
    time?: string;
    photoCount?: number;
    location?: string;
  }>({
    serviceType: params.serviceType,
    dateTime: params.selectedDateTime,
    date: params.selectedDate,
    time: params.selectedTime,
    photoCount: params.photoCount ? parseInt(params.photoCount, 10) : 0,
    location: params.location,
  });

  // Update booking data when params change (after editing)
  useFocusEffect(
    useCallback(() => {
      // Sync booking data with params whenever screen comes into focus
      setBookingData((prev) => ({
        serviceType: params.serviceType || prev.serviceType,
        dateTime: params.selectedDateTime || prev.dateTime,
        date: params.selectedDate || prev.date,
        time: params.selectedTime || prev.time,
        photoCount: params.photoCount ? parseInt(params.photoCount, 10) : prev.photoCount || 0,
        location: params.location || prev.location,
      }));
      
      // Update service location if location param was updated
      if (params.location) {
        setServiceLocation(params.location);
      }
    }, [params.serviceType, params.selectedDateTime, params.selectedDate, params.selectedTime, params.photoCount, params.location])
  );

  // Update serviceLocation when savedLocation changes
  useEffect(() => {
    if (savedLocation && !serviceLocation) {
      setServiceLocation(savedLocation);
    }
  }, [savedLocation]);

  // Get coordinates from service location
  useEffect(() => {
    const getLocationCoordinates = async () => {
      // Priority: userLocation (most accurate for service location)
      if (userLocation) {
        setServiceLocationCoords(userLocation);
        return;
      }

      // If we have a service location but no userLocation yet, wait for it
      // The userLocation will be set by the GPS permission effect above
    };

    getLocationCoordinates();
  }, [serviceLocation, savedLocation, userLocation]);

  // Fetch nearby providers when we have category and coordinates
  useEffect(() => {
    const loadProviders = async () => {
      const categoryName = params.categoryName || params.serviceType;
      
      // Reset error state
      setProviderError(null);
      
      if (__DEV__) {
        console.log('🔵 ========== LOAD PROVIDERS DEBUG ==========');
        console.log('🔵 params.categoryName:', params.categoryName);
        console.log('🔵 params.serviceType:', params.serviceType);
        console.log('🔵 Final categoryName:', categoryName);
        console.log('🔵 serviceLocationCoords:', serviceLocationCoords);
        console.log('🔵 ===========================================');
      }
      
      if (!categoryName || !serviceLocationCoords) {
        // Don't show dummy data - show empty state instead
        setProviders([]);
        if (!categoryName) {
          if (__DEV__) {
            console.warn('⚠️ No category name provided!');
          }
          setProviderError('Please select a service category');
        } else if (!serviceLocationCoords) {
          if (__DEV__) {
            console.warn('⚠️ No service location coordinates!');
          }
          setProviderError('Please set your service location');
        }
        return;
      }

      setIsLoadingProviders(true);
      try {
        // Normalize category name using mapping function
        // This converts display names like "Plumber", "Plumbing Service" to API format like "plumbing"
        const normalizedCategory = normalizeCategoryName(categoryName);
        const isValid = isValidCategoryName(categoryName);
        
        if (__DEV__) {
          console.log('🔵 ========== CATEGORY NORMALIZATION ==========');
          console.log('🔵 Original categoryName:', categoryName);
          console.log('🔵 Normalized category:', normalizedCategory);
          console.log('🔵 Is valid category:', isValid);
          console.log('🔵 Location:', {
            latitude: serviceLocationCoords.latitude,
            longitude: serviceLocationCoords.longitude,
          });
          console.log('🔵 ===========================================');
        }

        if (!normalizedCategory) {
          const errorMsg = `Invalid category name: "${categoryName}". Please select a valid service category.`;
          if (__DEV__) {
            console.error('❌ Invalid category:', categoryName);
          }
          setProviderError(errorMsg);
          setProviders([]);
          return;
        }

        const nearbyProviders = await providerService.getNearbyProviders(
          normalizedCategory,
          serviceLocationCoords.latitude,
          serviceLocationCoords.longitude,
          50 // maxDistanceKm
        );

        // Ensure nearbyProviders is always an array
        const providersArray = Array.isArray(nearbyProviders) ? nearbyProviders : [];
        
        if (__DEV__) {
          console.log('✅ ========== PROVIDERS RECEIVED ==========');
          console.log('✅ Providers count:', providersArray.length);
          console.log('✅ Normalized category sent to API:', normalizedCategory);
          console.log('✅ Location sent to API:', {
            latitude: serviceLocationCoords.latitude,
            longitude: serviceLocationCoords.longitude,
          });
          if (providersArray.length > 0) {
            console.log('✅ First provider:', providersArray[0]);
          } else {
            console.warn('⚠️ No providers returned from API');
            console.warn('⚠️ This could mean:');
            console.warn('   1. No providers registered for this category');
            console.warn('   2. No providers within 50km radius');
            console.warn('   3. Category name mismatch with backend');
            console.warn('   4. Backend error (check network tab)');
          }
          console.log('✅ ===========================================');
        }

        // Only map if we have valid providers
        if (providersArray.length === 0) {
          setProviders([]);
          setProviderError(`No providers found nearby for "${categoryName}". Try expanding your search radius or selecting a different service category.`);
          return;
        }

        // Map API NearbyProvider to ServiceProvider format
        const mappedProviders: ServiceProvider[] = providersArray.map((provider, index) => {
          // Get icon for category
          const IconComponent = getCategoryIcon(normalizedCategory, categoryName, '');
          const categoryDisplayName = categoryName.split(' ')[0]; // "Plumbing Service" -> "Plumber"
          
          // Calculate approximate provider coordinates based on distance and angle
          // API doesn't return exact coordinates, so we distribute providers around service location
          const angle = (index * 45) * (Math.PI / 180); // Distribute providers around service location
          const distanceInDegrees = provider.distanceKm / 111; // Rough conversion: 1km ≈ 0.009 degrees
          
          return {
            id: `provider-${provider.id}`,
            name: provider.name,
            category: categoryDisplayName as ProviderCategory,
            rating: 4.5, // Default rating (API doesn't provide this yet)
            reviews: 0, // Default reviews (API doesn't provide this yet)
            distance: provider.distanceKm < 1 
              ? `${(provider.distanceKm * 1000).toFixed(0)} m away`
              : `${provider.distanceKm.toFixed(1)} km away`,
            availability: provider.verified ? 'Available' : 'Busy',
            image: require('../assets/images/plumbericon2.png'), // Default icon - could use getCategoryIcon result
            coords: {
              latitude: serviceLocationCoords.latitude + (Math.cos(angle) * distanceInDegrees),
              longitude: serviceLocationCoords.longitude + (Math.sin(angle) * distanceInDegrees),
            },
          };
        });

        if (__DEV__) {
          console.log('✅ Mapped providers:', mappedProviders.length);
        }

        setProviders(mappedProviders);
        setProviderError(null);
      } catch (error: any) {
        console.error('❌ ========== ERROR LOADING PROVIDERS ==========');
        console.error('❌ Error:', error);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error status:', error?.status);
        console.error('❌ Error details:', error?.details);
        console.error('❌ Category used:', categoryName);
        console.error('❌ Normalized category:', normalizeCategoryName(categoryName));
        console.error('❌ Location:', serviceLocationCoords);
        console.error('❌ ===========================================');
        
        setProviders([]);
        
        // Extract error message with more context
        const errorMessage = error?.message || error?.details?.data?.error || 'Failed to load providers';
        const fullErrorMessage = `Unable to find providers at the moment. ${errorMessage}`;
        
        if (__DEV__) {
          console.error('❌ Full error message:', fullErrorMessage);
        }
        
        setProviderError(fullErrorMessage);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadProviders();
  }, [params.categoryName, params.serviceType, serviceLocationCoords]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
      } catch (error) {
        console.warn('Unable to fetch location', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProviderSelect = useCallback(
    (provider: ServiceProvider) => {
      setSelectedProviders((prev) => {
        const exists = prev.find((item) => item.id === provider.id);
        if (exists) {
          haptics.light();
          return prev.filter((item) => item.id !== provider.id);
        }
        if (prev.length >= MAX_SELECTION) {
          haptics.warning();
          Alert.alert('Selection limit reached', `You can select up to ${MAX_SELECTION} providers.`);
          return prev;
        }
        haptics.selection();
        return [...prev, provider];
      });
    },
    []
  );

  return (
    <SafeAreaWrapper>
      <View className="flex-1">
        {isLoadingProviders ? (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#6A9B00" />
            <Text className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
              Finding nearby providers...
            </Text>
          </View>
        ) : providerError && providers.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-white px-6">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 40 * scale }}>📍</Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {providerError.includes('No providers') || providerError.includes('No providers found') 
                ? 'No Providers Available Right Now' 
                : 'Unable to Load Providers'}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: '#6B7280',
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 20,
                maxWidth: 300,
              }}
            >
              {providerError.includes('No providers') || providerError.includes('No providers found')
                ? 'We couldn\'t find any providers in your area for this service at the moment. Don\'t worry - our team is working on expanding our network!'
                : providerError.includes('location')
                ? 'Please set your service location to find nearby providers. We\'ll show you all available service professionals in that area.'
                : providerError.includes('category')
                ? 'Please select a service category to continue. We have providers available for various services!'
                : 'We\'re having trouble loading providers right now. Please try again in a moment.'}
            </Text>
            {providerError.includes('No providers') && (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 18,
                  maxWidth: 280,
                  fontStyle: 'italic',
                }}
              >
                💡 Tip: Try adjusting your search location or check back later as new providers join our platform daily!
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                // Retry loading providers
                const categoryName = params.categoryName || params.serviceType;
                if (categoryName && serviceLocationCoords) {
                  setProviderError(null);
                  setIsLoadingProviders(true);
                  // Trigger reload by updating a dependency
                  setServiceLocationCoords({ ...serviceLocationCoords });
                } else if (!serviceLocationCoords) {
                  router.push('/LocationSearchScreen' as any);
                }
              }}
              style={{
                backgroundColor: '#6A9B00',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#FFFFFF',
                }}
              >
                {!serviceLocationCoords ? 'Set Location' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : providers.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-white px-6">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 40 * scale }}>🔍</Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              No Providers Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: '#6B7280',
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 20,
                maxWidth: 300,
              }}
            >
              We couldn't find any providers nearby for this service. Don't worry - new providers join our platform regularly!
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: '#9CA3AF',
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 18,
                maxWidth: 280,
                fontStyle: 'italic',
              }}
            >
              💡 Try adjusting your location or selecting a different service category.
            </Text>
          </View>
        ) : (
          <ServiceMap
            providers={providers}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedProviders={selectedProviders}
            onProviderSelect={handleProviderSelect}
            showList={showList}
            onToggleList={() => setShowList((prev) => !prev)}
            userLocation={userLocation}
            serviceLocation={serviceLocation}
            onServiceLocationChange={setServiceLocation}
          />
        )}
      </View>
      <Toast toast={toast} onHide={hideToast} />
      {selectedProviders.length > 0 && (
        <View className="bg-white border-t border-gray-100 px-4 py-4 shadow-[0px_-8px_24px_rgba(15,23,42,0.08)]">
          <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
            Selected providers ({selectedProviders.length}/{MAX_SELECTION})
          </Text>
          <View className="flex-row flex-wrap mb-3">
            {selectedProviders.map((provider) => (
              <View
                key={`selected-${provider.id}`}
                className="mr-2 mb-2 rounded-full bg-[#E3F4DF] px-3 py-1"
              >
                <Text className="text-xs text-[#1B4332]" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {provider.name}
                </Text>
              </View>
            ))}
          </View>
          <Button
            title="Confirm Booking"
            onPress={() => {
              haptics.light();
              setShowSummaryModal(true);
            }}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      )}

      {/* Booking Summary Modal */}
      <BookingSummaryModal
        visible={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onConfirm={() => {
          setShowSummaryModal(false);
          haptics.success();
          router.replace('../BookingConfirmationScreen' as any);
        }}
        onEditService={(bookingData) => {
          // Navigate back to service selection with current data preserved
          router.push({
            pathname: '/ServicesGridScreen' as any,
            params: {
              // Pass current booking data so it can be restored
              preserveData: 'true',
              serviceType: bookingData.serviceType || params.serviceType,
              selectedDateTime: bookingData.dateTime || params.selectedDateTime,
              selectedDate: bookingData.date || params.selectedDate,
              selectedTime: bookingData.time || params.selectedTime,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              location: bookingData.location || serviceLocation,
            },
          } as any);
        }}
        onEditDateTime={(bookingData) => {
          // Navigate to date/time screen with all current data preserved
          router.push({
            pathname: '/DateTimeScreen' as any,
            params: {
              selectedDateTime: bookingData.dateTime || params.selectedDateTime,
              selectedDate: bookingData.date || params.selectedDate,
              selectedTime: bookingData.time || params.selectedTime,
              serviceType: bookingData.serviceType || params.serviceType,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              location: bookingData.location || serviceLocation,
              preserveData: 'true',
            },
          } as any);
        }}
        onEditLocation={(bookingData) => {
          // Navigate to location search with current data preserved
          router.push({
            pathname: '/LocationSearchScreen' as any,
            params: {
              next: 'ServiceMapScreen',
              preserveData: 'true',
              serviceType: bookingData.serviceType || params.serviceType,
              selectedDateTime: bookingData.dateTime || params.selectedDateTime,
              selectedDate: bookingData.date || params.selectedDate,
              selectedTime: bookingData.time || params.selectedTime,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              location: bookingData.location || serviceLocation,
            },
          } as any);
        }}
        onEditPhotos={(bookingData) => {
          // Navigate to photos screen with all current data preserved
          router.push({
            pathname: '/AddPhotosScreen' as any,
            params: {
              selectedDateTime: bookingData.dateTime || params.selectedDateTime,
              selectedDate: bookingData.date || params.selectedDate,
              selectedTime: bookingData.time || params.selectedTime,
              serviceType: bookingData.serviceType || params.serviceType,
              location: bookingData.location || serviceLocation,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              preserveData: 'true',
            },
          } as any);
        }}
        onEditProviders={(bookingData) => {
          // Stay on current screen, just close modal to allow editing
          // Selected providers are already in state, so user can modify them
          setShowSummaryModal(false);
        }}
        data={{
          serviceType: bookingData.serviceType || params.serviceType || 'Plumbing Service',
          dateTime: bookingData.dateTime || params.selectedDateTime,
          date: bookingData.date || params.selectedDate,
          time: bookingData.time || params.selectedTime,
          location: serviceLocation || bookingData.location || savedLocation || 'Location not set',
          photoCount: bookingData.photoCount || (params.photoCount ? parseInt(params.photoCount, 10) : 0),
          selectedProviders: selectedProviders.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            image: p.image,
          })),
        }}
      />
    </SafeAreaWrapper>
  );
};

export default ServiceMapScreen;
