import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className='flex-row items-center px-4 py-3 bg-white border-b border-gray-100' style={{ paddingTop: 20 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text 
          className='text-xl font-bold text-black flex-1 text-center' 
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Address Book
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-white">
        <View className="px-4 pt-6">
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              activeOpacity={0.85}
              className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center border border-gray-200"
            >
              {/* Selection Indicator */}
              <View className="mr-4">
                {address.isSelected ? (
                  <View className="w-6 h-6 bg-gray-400 rounded-full" />
                ) : (
                  <View className="w-6 h-6 border-2 border-gray-300 rounded-full bg-white" />
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
              <TouchableOpacity className="ml-3" activeOpacity={0.85}>
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
