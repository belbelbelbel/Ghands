import { useRouter } from 'expo-router';
import { Filter, MapPin, Rocket, Search, Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  price: string;
  image: string;
  tags: string[];
}

const mockProviders: ServiceProvider[] = [
  {
    id: '1',
    name: 'Mike\'s Plumbing',
    category: 'Plumbing',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 miles',
    price: '$50/hr',
    image: '👨‍🔧',
    tags: ['Emergency', 'Licensed', '24/7']
  },
  {
    id: '2',
    name: 'Electric Solutions',
    category: 'Electrical',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 miles',
    price: '$75/hr',
    image: '⚡',
    tags: ['Certified', 'Fast Response']
  },
  {
    id: '3',
    name: 'Clean & Shine',
    category: 'Cleaning',
    rating: 4.7,
    reviews: 203,
    distance: '0.5 miles',
    price: '$30/hr',
    image: '🧽',
    tags: ['Eco-Friendly', 'Insured']
  }
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState(mockProviders);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  const handleProviderPress = (provider: ServiceProvider) => {
    console.log('Provider selected:', provider.name);
    // Navigate to provider details
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-6">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-[#ADF802] rounded-full items-center justify-center mr-3">
              <Rocket size={24} color="black" />
            </View>
            <View className="flex-1">
              <Text 
                className="text-2xl font-bold text-black"
                style={{ fontFamily: 'Poppins-ExtraBold' }}
              >
                Discover
              </Text>
              <Text 
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Find amazing services near you
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
            <Search size={20} color="#666" />
            <TextInput
              placeholder="Search services or providers"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-black"
              placeholderTextColor="#666"
              style={{ fontFamily: 'Poppins-Medium' }}
            />
            <TouchableOpacity className="w-8 h-8 bg-black rounded-lg items-center justify-center">
              <Filter size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-6">
          <View className="flex-row space-x-3">
            {['All', 'Nearby', 'Top Rated', 'Emergency', 'Budget'].map((filter, index) => (
              <TouchableOpacity
                key={index}
                className={`px-4 py-2 rounded-full ${
                  index === 0 ? 'bg-[#ADF802]' : 'bg-gray-100'
                }`}
                activeOpacity={0.8}
              >
                <Text 
                  className={`text-sm font-semibold ${
                    index === 0 ? 'text-black' : 'text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Service Providers */}
        <ScrollView className="flex-1 px-4">
          <Text 
            className="text-lg font-bold text-black mb-4"
            style={{ fontFamily: 'Poppins-ExtraBold' }}
          >
            Top Service Providers
          </Text>

          {providers.map((provider, index) => (
            <TouchableOpacity
              key={provider.id}
              onPress={() => handleProviderPress(provider)}
              className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-200"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center mb-3">
                <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">{provider.image}</Text>
                </View>
                <View className="flex-1">
                  <Text 
                    className="text-lg font-bold text-black"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {provider.name}
                  </Text>
                  <Text 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {provider.category}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text 
                      className="text-sm font-semibold text-black ml-1"
                      style={{ fontFamily: 'Poppins-SemiBold' }}
                    >
                      {provider.rating}
                    </Text>
                    <Text 
                      className="text-sm text-gray-500 ml-1"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      ({provider.reviews} reviews)
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text 
                    className="text-lg font-bold text-[#ADF802]"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {provider.price}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#666" />
                    <Text 
                      className="text-xs text-gray-600 ml-1"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {provider.distance}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-row flex-wrap">
                {provider.tags.map((tag, tagIndex) => (
                  <View key={tagIndex} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                    <Text 
                      className="text-xs text-gray-700"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom Spacer for Tab Navigation */}
        <View style={{ height: 100 }} />
      </Animated.View>
    </SafeAreaView>
  );
}
