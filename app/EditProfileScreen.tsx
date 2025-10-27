import { useRouter } from 'expo-router';
import { Camera, Mail, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { InputField } from '../components/InputField';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />

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
          Edit your profile
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-8">
          {/* Profile Picture */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="w-32 h-32 bg-white rounded-full items-center justify-center border-2 border-black ">
                <User size={60} color="#6A9B00" />
              </View>
              <TouchableOpacity className="absolute bottom-0 right-0 bg-black rounded-full p-3 border-2 border-black">
                <Camera size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Fields */}
          <View className="space-y-4">
            {/* Name Field */}
            <InputField
              placeholder="Mike Plumbings"
              icon={<User size={20} color="white" />}
              value={name}
              onChangeText={setName}
              keyboardType="default"
            />

            {/* Email Field */}
            <InputField
              placeholder="miketheplumber@gmail.com"
              icon={<Mail size={20} color="white" />}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            {/* Phone Field */}
            <InputField
              placeholder="08100055522"
              icon={<Phone size={20} color="white" />}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity className="bg-black rounded-xl py-4 px-6 mt-6 items-center">
            <Text 
              className="text-white text-base font-semibold" 
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Save changes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
