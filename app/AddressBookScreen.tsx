import { useRouter } from 'expo-router';
import { Check, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const addresses = [
  {
    id: '1',
    title: 'Current Location',
    address: '1, veekee james ave. b close, cowardice seminar',
    isSelected: true
  },
  {
    id: '2',
    title: '',
    address: '1, veekee james ave. b close, cowardice seminar',
    isSelected: false
  },
  {
    id: '3',
    title: '',
    address: '1, veekee james ave. b close, cowardice seminar',
    isSelected: false
  },
  {
    id: '4',
    title: '',
    address: '1, veekee james ave. b close, cowardice seminar',
    isSelected: false
  }
];

export default function AddressBookScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className='flex-row items-center px-4 py-4 bg-white border-b border-gray-100'>
        <TouchableOpacity onPress={() => router.back()}>
          <View className='w-8 h-8 items-center justify-center'>
            <Text className='text-black text-2xl'>←</Text>
          </View>
        </TouchableOpacity>
        <Text 
          className='text-xl font-bold text-black flex-1 text-center mr-8' 
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Address Book
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-6">
          {addresses.map((address) => (
            <View
              key={address.id}
              className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center  border border-gray-200"
            >
              {/* Selection Indicator */}
              <View className="mr-4">
                {address.isSelected ? (
                  <View className="w-6 h-6 bg-[#6A9B00] rounded-full items-center justify-center">
                    <Check size={16} color="white" />
                  </View>
                ) : (
                  <View className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                )}
              </View>

              {/* Address Content */}
              <View className="flex-1">
                {address.title ? (
                  <Text 
                    className="text-base font-bold text-black mb-1" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {address.title}
                  </Text>
                ) : null}
                <Text 
                  className="text-sm text-gray-600" 
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {address.address}
                </Text>
              </View>

              {/* More Options Icon */}
              <TouchableOpacity className="ml-3">
                <MoreVertical size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
