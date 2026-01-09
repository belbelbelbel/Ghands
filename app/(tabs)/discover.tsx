import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MapPin, Star, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface TrendingService {
  id: string;
  title: string;
  category: string;
  bookings: number;
  image: any;
  categoryId: string;
}

interface FeaturedProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  image: any;
  badge?: string;
  isVerified: boolean;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  expiry: string;
  image: any;
}

interface ServiceTip {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
}

const trendingServices: TrendingService[] = [
  {
    id: 'trend-1',
    title: 'Plumbing',
    category: 'Emergency Repairs',
    bookings: 245,
    image: require('../../assets/images/plumbericon2.png'),
    categoryId: 'plumber',
  },
  {
    id: 'trend-2',
    title: 'Electrical',
    category: 'Installations',
    bookings: 189,
    image: require('../../assets/images/electricianicon2.png'),
    categoryId: 'electrician',
  },
  {
    id: 'trend-3',
    title: 'Cleaning',
    category: 'Deep Cleaning',
    bookings: 312,
    image: require('../../assets/images/cleanericon2.png'),
    categoryId: 'cleaning',
  },
  {
    id: 'trend-4',
    title: 'Painting',
    category: 'Interior',
    bookings: 156,
    image: require('../../assets/images/paintericon2.png'),
    categoryId: 'painter',
  },
];

const featuredProviders: FeaturedProvider[] = [
  {
    id: 'provider-1',
    name: 'Elite Plumbing Services',
    category: 'Plumbing',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 mi',
    image: require('../../assets/images/plumbericon2.png'),
    badge: 'Popular',
    isVerified: true,
  },
  {
    id: 'provider-2',
    name: 'Pro Electric Solutions',
    category: 'Electrical',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 mi',
    image: require('../../assets/images/electricianicon2.png'),
    badge: 'New',
    isVerified: true,
  },
  {
    id: 'provider-3',
    name: 'Clean & Shine Pro',
    category: 'Cleaning',
    rating: 4.7,
    reviews: 203,
    distance: '0.5 mi',
    image: require('../../assets/images/cleanericon2.png'),
    isVerified: true,
  },
  {
    id: 'provider-4',
    name: 'Master Painters',
    category: 'Painting',
    rating: 4.9,
    reviews: 156,
    distance: '1.5 mi',
    image: require('../../assets/images/paintericon2.png'),
    badge: 'Top Rated',
    isVerified: true,
  },
];

const specialOffers: SpecialOffer[] = [
  {
    id: 'offer-1',
    title: 'Weekend Special',
    description: 'Get 20% off on all weekend bookings',
    discount: '20% OFF',
    expiry: 'Ends in 2 days',
    image: require('../../assets/images/plumbericon2.png'),
  },
  {
    id: 'offer-2',
    title: 'First Time Customer',
    description: 'Enjoy 25% discount on your first service',
    discount: '25% OFF',
    expiry: 'Limited time',
    image: require('../../assets/images/electricianicon2.png'),
  },
];

const serviceTips: ServiceTip[] = [
  {
    id: 'tip-1',
    title: 'How to Choose the Right Plumber',
    description: 'Learn what to look for when hiring a plumbing professional',
    category: 'Plumbing',
    readTime: '3 min read',
  },
  {
    id: 'tip-2',
    title: 'Electrical Safety Tips for Homeowners',
    description: 'Essential safety guidelines for electrical work in your home',
    category: 'Electrical',
    readTime: '5 min read',
  },
  {
    id: 'tip-3',
    title: 'When to Call a Professional',
    description: 'Know when DIY is safe and when to call the experts',
    category: 'General',
    readTime: '4 min read',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleServicePress = useCallback((categoryId: string) => {
    haptics.light();
    router.push({
      pathname: '/(tabs)/categories',
      params: { selectedCategoryId: categoryId },
    });
  }, [router]);

  const handleProviderPress = useCallback((providerId: string, providerName: string) => {
    haptics.light();
    router.push({
      pathname: '/ProviderDetailScreen',
      params: { providerId, providerName },
    });
  }, [router]);

  const handleOfferPress = useCallback((offerId: string) => {
    haptics.light();
    router.push({
      pathname: '/(tabs)/categories',
    });
  }, [router]);

  const animatedStyles = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }), [fadeAnim, slideAnim]);

  return (
    <SafeAreaWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[animatedStyles, { flex: 1, paddingTop: 17 }]}>
          {/* Hero Banner - Featured Deal/Provider */}
          <View className="px-4 mb-6">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleOfferPress('hero-offer')}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Poppins-Bold',
                      color: '#000000',
                      marginBottom: 4,
                    }}
                  >
                    Featured Deal
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: 'rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    Get 30% off your first booking
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: '#000000',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: '#FFFFFF',
                  }}
                >
                  Claim Offer →
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Trending Services */}
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <TrendingUp size={20} color="#6A9B00" style={{ marginRight: 8 }} />
                <Text
                  className="text-xl font-bold text-black"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Trending Services
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {trendingServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => handleServicePress(service.categoryId)}
                  activeOpacity={0.85}
                  style={{
                    width: 200,
                    marginRight: 16,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Image
                      source={service.image}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: '#000000',
                      marginBottom: 6,
                    }}
                  >
                    {service.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Medium',
                      color: '#6B7280',
                      marginBottom: 12,
                    }}
                  >
                    {service.category}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#FEF3C7',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Ionicons name="flame" size={16} color="#F59E0B" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#92400E',
                        marginLeft: 6,
                      }}
                    >
                      {service.bookings} bookings
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Providers */}
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Featured Providers
              </Text>
              <TouchableOpacity
                className="px-3 py-1 flex-row items-center"
                onPress={() => {
                  haptics.light();
                  router.push('/(tabs)/categories');
                }}
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
            <View>
              {featuredProviders.map((provider, index) => (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => handleProviderPress(provider.id, provider.name)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: index < featuredProviders.length - 1 ? 12 : 0,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        backgroundColor: '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Image
                        source={provider.image}
                        style={{ width: 48, height: 48 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View className="flex-row items-center mb-1">
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: 'Poppins-SemiBold',
                            color: '#000000',
                            marginRight: 6,
                          }}
                        >
                          {provider.name}
                        </Text>
                        {provider.isVerified && (
                          <Ionicons name="checkmark-circle" size={16} color="#6A9B00" />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Medium',
                          color: '#6B7280',
                          marginBottom: 6,
                        }}
                      >
                        {provider.category}
                      </Text>
                      <View className="flex-row items-center">
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Medium',
                            color: '#000000',
                            marginLeft: 4,
                            marginRight: 12,
                          }}
                        >
                          {provider.rating}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Regular',
                            color: '#6B7280',
                            marginRight: 12,
                          }}
                        >
                          ({provider.reviews} reviews)
                        </Text>
                        <MapPin size={12} color="#6B7280" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Regular',
                            color: '#6B7280',
                            marginLeft: 4,
                          }}
                        >
                          {provider.distance}
                        </Text>
                      </View>
                    </View>
                    {provider.badge && (
                      <View
                        style={{
                          backgroundColor: provider.badge === 'New' ? '#DBEAFE' : provider.badge === 'Top Rated' ? '#FEF3C7' : '#F3E8FF',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-SemiBold',
                            color: provider.badge === 'New' ? '#1E40AF' : provider.badge === 'Top Rated' ? '#92400E' : '#6B21A8',
                          }}
                        >
                          {provider.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Offers */}
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Special Offers
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {specialOffers.map((offer) => (
                <TouchableOpacity
                  key={offer.id}
                  onPress={() => handleOfferPress(offer.id)}
                  activeOpacity={0.9}
                  style={{
                    width: 280,
                    marginRight: 12,
                    backgroundColor: '#000000',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontFamily: 'Poppins-Bold',
                          color: '#FFFFFF',
                          marginBottom: 4,
                        }}
                      >
                        {offer.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Medium',
                          color: 'rgba(255, 255, 255, 0.8)',
                        }}
                      >
                        {offer.description}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        source={offer.image}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View
                      style={{
                        backgroundColor: '#6A9B00',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Bold',
                          color: '#000000',
                        }}
                      >
                        {offer.discount}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Medium',
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      {offer.expiry}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Service Tips */}
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-black"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Service Tips
              </Text>
            </View>
            {serviceTips.map((tip, index) => (
              <TouchableOpacity
                key={tip.id}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: index < serviceTips.length - 1 ? 12 : 0,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#000000',
                        marginBottom: 6,
                      }}
                    >
                      {tip.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: '#6B7280',
                        marginBottom: 8,
                      }}
                    >
                      {tip.description}
                    </Text>
                    <View className="flex-row items-center">
                      <View
                        style={{
                          backgroundColor: '#EEF2FF',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-Medium',
                            color: '#4F46E5',
                          }}
                        >
                          {tip.category}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins-Regular',
                          color: '#9CA3AF',
                        }}
                      >
                        {tip.readTime}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nearby Popular Services */}
          <View className="px-4 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <MapPin size={20} color="#6A9B00" style={{ marginRight: 8 }} />
                <Text
                  className="text-xl font-bold text-black"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Popular Near You
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <MapPin size={32} color="#6B7280" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#000000',
                  marginBottom: 6,
                }}
              >
                Map View Coming Soon
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                Explore popular services in your area
              </Text>
            </View>
          </View>

          <View style={{ height: 90 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
