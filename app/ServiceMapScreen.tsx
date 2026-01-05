import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import ServiceMap, { ProviderCategory, ServiceProvider } from '@/components/ServiceMap';
import BookingSummaryModal, { BookingSummaryData } from '@/components/BookingSummaryModal';
import { haptics } from '@/hooks/useHaptics';
import { useUserLocation } from '@/hooks/useUserLocation';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';
const MAX_SELECTION = 3;

const SAMPLE_PROVIDERS: ServiceProvider[] = [
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
];


const ServiceMapScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedDateTime?: string;
    selectedDate?: string;
    selectedTime?: string;
    photoCount?: string;
    serviceType?: string;
  }>();
  const { location: savedLocation } = useUserLocation();
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>('All');
  const [selectedProviders, setSelectedProviders] = useState<ServiceProvider[]>([]);
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviceLocation, setServiceLocation] = useState<string>(savedLocation || '');
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Update serviceLocation when savedLocation changes
  useEffect(() => {
    if (savedLocation) {
      setServiceLocation(savedLocation);
    }
  }, [savedLocation]);

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
        <ServiceMap
          providers={SAMPLE_PROVIDERS}
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
      </View>
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
              serviceType: bookingData.serviceType,
              selectedDateTime: bookingData.dateTime || params.selectedDateTime,
              selectedDate: bookingData.date || params.selectedDate,
              selectedTime: bookingData.time || params.selectedTime,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              location: bookingData.location,
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
              location: bookingData.location,
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
              location: bookingData.location,
              photoCount: bookingData.photoCount?.toString() || params.photoCount,
              preserveData: 'true',
            },
          } as any);
        }}
        onEditProviders={(bookingData) => {
          // Stay on current screen, just close modal to allow editing
          // Selected providers are already in state, so user can modify them
        }}
        data={{
          serviceType: params.serviceType || 'Plumbing Service',
          dateTime: params.selectedDateTime,
          date: params.selectedDate,
          time: params.selectedTime,
          location: serviceLocation || savedLocation || 'Location not set',
          photoCount: params.photoCount ? parseInt(params.photoCount, 10) : 0,
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
