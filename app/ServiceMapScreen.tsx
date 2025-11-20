import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import ServiceMap, { ProviderCategory, ServiceProvider } from '@/components/ServiceMap';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
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
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>('All');
  const [selectedProviders, setSelectedProviders] = useState<ServiceProvider[]>([]);
  const [showList, setShowList] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
          return prev.filter((item) => item.id !== provider.id);
        }
        if (prev.length >= MAX_SELECTION) {
          Alert.alert('Selection limit reached', `You can select up to ${MAX_SELECTION} providers.`);
          return prev;
        }
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
          <TouchableOpacity
            onPress={() => router.push('../BookingConfirmationScreen' as any)}
            activeOpacity={0.85}
            className="bg-[#6A9B00] rounded-xl py-4 items-center justify-center"
          >
            <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Confirm Booking
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaWrapper>
  );
};

export default ServiceMapScreen;
