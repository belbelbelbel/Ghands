import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Colors, BorderRadius, Spacing } from '@/lib/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MapPin, ShieldCheck, Star, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

// Removed colorful service icons and colors - using neutral design

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
        <Animated.View style={[animatedStyles, { flex: 1, paddingTop: 20 }]}>
          {/* Header Section */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Discover
            </Text>
          </View>

          {/* Hero Banner - Featured Deal/Provider */}
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleOfferPress('hero-offer')}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                padding: 24,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Ionicons name="gift" size={24} color={Colors.textPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginBottom: 4,
                      letterSpacing: -0.3,
                    }}
                  >
                    Featured Deal
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      lineHeight: 20,
                    }}
                  >
                    Get 30% off your first booking
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: Colors.black,
                  borderRadius: BorderRadius.default,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                    letterSpacing: 0.2,
                  }}
                >
                  Claim Offer →
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Trending Services */}
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TrendingUp size={18} color={Colors.textPrimary} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                Trending Services
              </Text>
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
                    width: 180,
                    marginRight: 12,
                    borderRadius: BorderRadius.xl,
                    padding: 20,
                    backgroundColor: Colors.white,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: BorderRadius.default,
                      backgroundColor: Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    {(() => {
                      const IconComponent = getCategoryIcon(service.title);
                      return <IconComponent />;
                    })()}
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 4,
                      letterSpacing: -0.2,
                    }}
                  >
                    {service.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 12,
                      lineHeight: 16,
                    }}
                  >
                    {service.category}
                  </Text>
                  <View
                    style={{
                      backgroundColor: Colors.backgroundGray,
                      borderRadius: BorderRadius.sm,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textSecondaryDark,
                        letterSpacing: 0.1,
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
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                Featured Providers
              </Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  haptics.light();
                  router.push('/(tabs)/categories');
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginRight: 4,
                  }}
                >
                  View all
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
            </View>
            <View>
              {featuredProviders.map((provider, index) => (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => handleProviderPress(provider.id, provider.name)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.xl,
                    padding: 20,
                    marginBottom: index < featuredProviders.length - 1 ? 12 : 0,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: BorderRadius.default,
                        backgroundColor: Colors.backgroundGray,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16,
                      }}
                    >
                      {(() => {
                        const IconComponent = getCategoryIcon(provider.category);
                        return <IconComponent />;
                      })()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: 'Poppins-SemiBold',
                            color: Colors.textPrimary,
                            marginRight: 6,
                            letterSpacing: -0.2,
                          }}
                        >
                          {provider.name}
                        </Text>
                        {provider.isVerified && (
                          <View
                            style={{
                              backgroundColor: Colors.accent,
                              borderRadius: BorderRadius.sm,
                              padding: 3,
                            }}
                          >
                            <ShieldCheck size={12} color={Colors.white} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textSecondaryDark,
                          marginBottom: 8,
                          lineHeight: 16,
                        }}
                      >
                        {provider.category}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                          <Star size={12} color={Colors.textSecondaryDark} fill={Colors.textSecondaryDark} />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: 'Poppins-Medium',
                              color: Colors.textPrimary,
                              marginLeft: 4,
                            }}
                          >
                            {provider.rating}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textSecondaryDark,
                            marginRight: 12,
                          }}
                        >
                          ({provider.reviews})
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MapPin size={10} color={Colors.textSecondaryDark} />
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: 'Poppins-Regular',
                              color: Colors.textSecondaryDark,
                              marginLeft: 3,
                            }}
                          >
                            {provider.distance}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {provider.badge && (
                      <View
                        style={{
                          backgroundColor: Colors.backgroundGray,
                          borderRadius: BorderRadius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-Medium',
                            color: Colors.textSecondaryDark,
                            letterSpacing: 0.2,
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
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  letterSpacing: -0.3,
                }}
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
                    backgroundColor: Colors.black,
                    borderRadius: BorderRadius.xl,
                    padding: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.white,
                          marginBottom: 6,
                          letterSpacing: -0.2,
                        }}
                      >
                        {offer.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          color: 'rgba(255, 255, 255, 0.8)',
                          lineHeight: 18,
                        }}
                      >
                        {offer.description}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View
                      style={{
                        backgroundColor: Colors.accent,
                        borderRadius: BorderRadius.sm,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.black,
                          letterSpacing: 0.2,
                        }}
                      >
                        {offer.discount}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: 'Poppins-Regular',
                        color: 'rgba(255, 255, 255, 0.7)',
                        letterSpacing: 0.1,
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
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                Service Tips
              </Text>
            </View>
            {serviceTips.map((tip, index) => (
              <TouchableOpacity
                key={tip.id}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.xl,
                  padding: 20,
                  marginBottom: index < serviceTips.length - 1 ? 12 : 0,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                        marginBottom: 6,
                        letterSpacing: -0.2,
                        lineHeight: 22,
                      }}
                    >
                      {tip.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                        marginBottom: 10,
                        lineHeight: 18,
                      }}
                    >
                      {tip.description}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          backgroundColor: Colors.backgroundGray,
                          borderRadius: BorderRadius.sm,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          marginRight: 10,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: 'Poppins-Medium',
                            color: Colors.textSecondaryDark,
                            letterSpacing: 0.2,
                          }}
                        >
                          {tip.category}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textTertiary,
                        }}
                      >
                        {tip.readTime}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={{ marginTop: 2 }} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nearby Popular Services */}
          <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MapPin size={18} color={Colors.textPrimary} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                Popular Near You
              </Text>
            </View>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                padding: 32,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
                borderWidth: 1,
                borderColor: Colors.border,
                borderStyle: 'dashed',
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <MapPin size={28} color={Colors.textSecondaryDark} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 6,
                  letterSpacing: -0.2,
                }}
              >
                Map View Coming Soon
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  textAlign: 'center',
                  lineHeight: 18,
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
