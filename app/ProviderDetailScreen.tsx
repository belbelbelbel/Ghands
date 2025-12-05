import SafeAreaWrapper from '@/components/SafeAreaWrapper';
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
  image: 'https://via.placeholder.com/150',
  rating: 4.9,
  reviewCount: 127,
  distance: '2.3 mi away',
  jobsDone: 89,
  responseTime: '15m',
  onTimePercentage: 98,
  skills: ['Sink', 'Shower', 'Boiler', 'Toilet'],
  recentWork: [
    'https://via.placeholder.com/300',
    'https://via.placeholder.com/300',
    'https://via.placeholder.com/300',
  ],
  about:
    'Licensed electrician with 8+ years of experience. Specialized in residential and commercial electrical work. Committed to safety, quality, and customer satisfaction. Available for emergency calls and scheduled appointments.',
  reviews: [
    {
      id: 'review-1',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://via.placeholder.com/100',
      timeAgo: '2 days ago',
      rating: 5,
      reviewText:
        'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: 'review-2',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://via.placeholder.com/100',
      timeAgo: '2 days ago',
      rating: 5,
      reviewText:
        'Excellent work! Marcus was professional, on time, and fixed our electrical issue quickly. Highly recommend!',
    },
    {
      id: 'review-3',
      reviewerName: 'Sarah Miller',
      reviewerImage: 'https://via.placeholder.com/100',
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
  
  const provider = {
    ...MOCK_PROVIDER,
    name: params.providerName || MOCK_PROVIDER.name,
  };

  return (
    <SafeAreaWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        
        <View className="flex-row items-center px-4 pb-2" style={{ paddingTop: 20 }}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        
        <View className="px-4 mb-8">
          <View className="bg-white rounded-3xl border border-gray-100 p-6 ">
            <View className="flex-row items-start">
              <View className="relative">
                <Image
                  source={{ uri: provider.image }}
                  className="w-24 h-24 rounded-full"
                  style={{ borderRadius: 48 }}
                />
                {provider.isOnline && (
                  <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#6A9B00] border-2 border-white" />
                )}
              </View>
              <View className="flex-1 ml-5">
                <Text className="text-2xl text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.name}
                </Text>
                <Text className="text-base text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Medium' }}>
                  {provider.role}
                </Text>
                <View className="flex-row items-center mb-3">
                  <Star size={18} color="#FACC15" fill="#FACC15" />
                  <Text className="text-sm text-gray-600 ml-2" style={{ fontFamily: 'Poppins-Medium' }}>
                    {provider.rating} ({provider.reviewCount})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2" style={{ fontFamily: 'Poppins-Regular' }}>
                    {provider.distance}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        
        <View className="px-4 mb-8">
          <View className="bg-white rounded-3xl border border-gray-100 p-6 ">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.jobsDone}
                </Text>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  Jobs Done
                </Text>
              </View>
              <View className="w-px bg-gray-200 mx-2" />
              <View className="items-center flex-1">
                <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.responseTime}
                </Text>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  Response Time
                </Text>
              </View>
              <View className="w-px bg-gray-200 mx-2" />
              <View className="items-center flex-1">
                <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.onTimePercentage}%
                </Text>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  On Time
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="px-4 mb-8">
          <Text className="text-xl text-black mb-4 px-1" style={{ fontFamily: 'Poppins-Bold' }}>
            Skills
          </Text>
          <View className="bg-white rounded-3xl border border-gray-100 p-5 ">
            <View className="flex-row flex-wrap">
              {provider.skills.map((skill, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-gray-100 rounded-xl px-5 py-2 mr-3 mb-3"
                >
                  <Text className="text-sm text-black" style={{ fontFamily: 'Poppins-Medium' }}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        
        <View className="px-4 mb-8">
          <Text className="text-xl text-black mb-4 px-1" style={{ fontFamily: 'Poppins-Bold' }}>
            Recent Work
          </Text>
          <View className="bg-white rounded-3xl border border-gray-100 p-5 ">
            <View className="flex-row">
              {provider.recentWork.map((workImage, index) => (
                <Image
                  key={index}
                  source={{ uri: workImage }}
                  className="w-28 h-28 rounded-2xl mr-3"
                  style={{ borderRadius: 16 }}
                />
              ))}
            </View>
          </View>
        </View>

        
        <View className="px-4 mb-8">
          <Text className="text-xl text-black mb-4 px-1" style={{ fontFamily: 'Poppins-Bold' }}>
            About
          </Text>
          <View className="bg-white rounded-3xl border border-gray-100 p-6 ">
            <Text className="text-sm text-gray-600 leading-6" style={{ fontFamily: 'Poppins-Regular' }}>
              {provider.about}
            </Text>
          </View>
        </View>

        
        <View className="px-4 mb-8">
          <Text className="text-xl text-black mb-4 px-1" style={{ fontFamily: 'Poppins-Bold' }}>
            Reviews
          </Text>
          {provider.reviews.map((review, index) => (
            <View
              key={review.id}
              className={`bg-white rounded-3xl border border-gray-100 p-5 mb-4  ${index === provider.reviews.length - 1 ? 'mb-0' : ''}`}
            >
              <View className="flex-row items-center mb-4">
                <Image
                  source={{ uri: review.reviewerImage }}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <View className="flex-1">
                  <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    {review.reviewerName}
                  </Text>
                  <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                    {review.timeAgo}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={16} color="#FACC15" fill="#FACC15" style={{ marginRight: 2 }} />
                ))}
              </View>
              <Text className="text-sm text-gray-600 leading-6" style={{ fontFamily: 'Poppins-Regular' }}>
                {review.reviewText}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

