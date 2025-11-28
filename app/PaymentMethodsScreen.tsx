import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const PAYMENT_METHODS = [
  {
    id: '1',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
  {
    id: '2',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
  {
    id: '3',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const handleRemove = (id: string) => {
    // Handle remove payment method
  };

  return (
    <SafeAreaWrapper>
      <View style={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text 
            className="text-xl font-bold text-black" 
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Payment methods
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {PAYMENT_METHODS.map((method) => (
          <View
            key={method.id}
            className="bg-gray-50 rounded-2xl px-4 py-5 mb-4 border border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-600 rounded-xl w-12 h-12 items-center justify-center mr-4">
                  <Text 
                    className="text-white font-bold text-xs" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    VISA
                  </Text>
                </View>
                <View className="flex-1">
                  <Text 
                    className="text-base font-bold text-black mb-1" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    Visa •••• {method.lastFour}
                  </Text>
                  <Text 
                    className="text-sm text-gray-500 mb-1" 
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Expires {method.expires}
                  </Text>
                  <Text 
                    className="text-sm text-gray-500" 
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Last used: {method.lastUsed}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(method.id)}
                activeOpacity={0.7}
              >
                <Text 
                  className="text-[#6A9B00] text-sm" 
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => router.push('/AddCardDetailsScreen' as any)}
          activeOpacity={0.7}
          className="border-2 border-dashed border-gray-300 rounded-2xl px-4 py-5 flex-row items-center justify-between mb-4"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 items-center justify-center mr-4">
              <Plus size={24} color="#9CA3AF" />
            </View>
            <Text 
              className="text-gray-500 text-base" 
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Add Payment Method
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

