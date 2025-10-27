import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const LiveSupportScreen = () => {
  return (
    <View className='px-4 mb-6'>
      <View className='bg-[#EEFFD9] border border-[#D4FF8C] rounded-2xl p-5'>
        <View className='flex-row items-center mb-2'>
          <Ionicons name='chatbubble' size={20} color="#6A9B00" />
          <Text 
            className='text-lg font-bold text-black ml-2' 
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Live chat Support
          </Text>
        </View>
        <Text 
          className='text-gray-700 text-sm mb-4' 
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          Get instant answers to your questions from our friendly support team.
        </Text>
        <TouchableOpacity className='bg-[#6A9B00] rounded-xl py-3 px-6 items-center'>
          <Text 
            className='text-white font-semibold' 
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Start chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LiveSupportScreen;