import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Building, ChevronDown, Upload, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProviderProfileSetupScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [description, setDescription] = useState('');

  const handleContinue = () => {
    if (businessName.trim() && description.trim()) {
      router.push('/ProviderUploadDocumentsScreen');
    }
  };

  const isFormValid = businessName.trim() && description.trim();

  return (
    <SafeAreaWrapper>
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-black mb-8" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Setup your Profile</Text>

        <View className="bg-gray-100 rounded-xl mb-4 px-4 py-3 flex-row items-center">
          <View className="w-12 h-12 mr-4 bg-[#6A9B00] border border-[#6A9B00] rounded-xl items-center justify-center">
            <User size={20} color="white" />
          </View>
          <TextInput
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            className="flex-1 text-black text-base"
            placeholderTextColor="#666666"
            style={{ fontFamily: 'Poppins-Medium' }}
          />
        </View>

        <TouchableOpacity className="bg-gray-100 rounded-xl mb-6 px-4 py-3 flex-row items-center justify-between">
          <Text className="text-black text-base" style={{ fontFamily: 'Poppins-Medium' }}>
            {selectedService}
          </Text>
          <ChevronDown size={20} color="#666666" />
        </TouchableOpacity>

        <View className="mb-6">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Description
          </Text>
          <TextInput
            placeholder="Describe your business"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            className="bg-gray-100 rounded-xl px-4 py-3 text-black text-base"
            placeholderTextColor="#666666"
            style={{ 
              fontFamily: 'Poppins-Medium',
              textAlignVertical: 'top',
              minHeight: 120,
            }}
          />
        </View>

        <View className="mb-8">
          <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            License or certification:
          </Text>
          <TouchableOpacity className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-12 items-center justify-center">
            <Upload size={32} color="#9CA3AF" />
            <Text className="text-gray-500 text-base mt-2" style={{ fontFamily: 'Poppins-Medium' }}>
              Tap to upload
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid}
          className={`rounded-xl py-4 px-6 ${
            isFormValid ? 'bg-[#6A9B00]' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          <Text 
            className={`text-center text-lg font-semibold ${
              isFormValid ? 'text-white' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Finish Setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

