import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Review {
  id: string;
  reviewerName: string;
  reviewerImage: string;
  timeAgo: string;
  rating: number;
  reviewText: string;
}

interface ProviderDetail {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  jobsDone: number;
  responseTime: string;
  onTimePercentage: number;
  skills: string[];
  recentWork: string[];
  about: string;
  reviews: Review[];
  isOnline?: boolean;
}

const MOCK_PROVIDER: ProviderDetail = {
  id: 'provider-1',
  name: 'Marcus Johnson',
  role: 'Professional Electrician',
  image: 'https://i.pravatar.cc/150?img=12',
  rating: 4.9,
  reviewCount: 127,
  distance: '2.3 mi away',
  jobsDone: 89,
  responseTime: '15m',
  onTimePercentage: 98,
  skills: ['Sink', 'Shower', 'Boiler', 'Toilet'],
  recentWork: [
    'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
  ],
  about:
    'Licensed electrician with 8+ years of experience. Specialized in residential and commercial electrical work. Committed to safety, quality, and customer satisfaction. Available for emergency calls and scheduled appointments.',
  reviews: [
    {
      id: 'review-1',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://i.pravatar.cc/150?img=47',
      timeAgo: '2 days ago',
      rating: 5,
      reviewText:
        'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: 'review-2',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://i.pravatar.cc/150?img=47',
      timeAgo: '2 days ago',
      rating: 5,
      reviewText:
        'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: 'review-3',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://i.pravatar.cc/150?img=47',
      timeAgo: '2 days ago',
      rating: 5,
      reviewText:
        'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
  ],
  isOnline: true,
};

export default function ProviderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string; providerName?: string }>();
  
  // In a real app, you'd fetch provider data based on params.providerId
  const provider = {
    ...MOCK_PROVIDER,
    name: params.providerName || MOCK_PROVIDER.name,
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ 
          paddingBottom: 32,
          backgroundColor: Colors.backgroundLight,
        }}
      >
        {/* Header with Back Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Summary Section */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 20,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              {/* Profile Picture */}
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: provider.image }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: Colors.backgroundGray,
                  }}
                />
                {provider.isOnline && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: Colors.accent,
                      borderWidth: 3,
                      borderColor: Colors.white,
                    }}
                  />
                )}
              </View>

              {/* Profile Info */}
              <View
                style={{
                  flex: 1,
                  marginLeft: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {provider.name}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: 12,
                  }}
                >
                  {provider.role}
                </Text>

                {/* Rating */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Star size={18} color="#FACC15" fill="#FACC15" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.textSecondaryDark,
                      marginLeft: 6,
                    }}
                  >
                    {provider.rating} ({provider.reviewCount})
                  </Text>
                </View>

                {/* Distance */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <MapPin size={16} color={Colors.textSecondaryDark} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.textSecondaryDark,
                      marginLeft: 4,
                    }}
                  >
                    {provider.distance}
                  </Text>
                </View>
              </View>
            </View>

            {/* Statistics Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 24,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {provider.jobsDone}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Jobs Done
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: Colors.border,
                  marginHorizontal: 16,
                }}
              />

              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {provider.responseTime}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Response Time
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: Colors.border,
                  marginHorizontal: 16,
                }}
              />

              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {provider.onTimePercentage}%
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  On Time
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Skills
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {provider.skills.map((skill, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: Colors.backgroundLight,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                  }}
                >
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Work Section */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Recent Work
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            {provider.recentWork.map((workImage, index) => (
              <Image
                key={index}
                source={{ uri: workImage }}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: Colors.backgroundGray,
                }}
              />
            ))}
          </View>
        </View>

        {/* About Section */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            About
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              lineHeight: 22,
            }}
          >
            {provider.about}
          </Text>
        </View>

        {/* Reviews Section */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Reviews
          </Text>
          {provider.reviews.map((review, index) => (
            <View
              key={review.id}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                padding: 20,
                marginBottom: index < provider.reviews.length - 1 ? 16 : 0,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Image
                  source={{ uri: review.reviewerImage }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.backgroundGray,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {review.reviewerName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {review.timeAgo}
                  </Text>
                </View>
              </View>

              {/* Star Rating */}
              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: 12,
                }}
              >
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    color="#FACC15"
                    fill="#FACC15"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>

              {/* Review Text */}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  lineHeight: 20,
                }}
              >
                {review.reviewText}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
