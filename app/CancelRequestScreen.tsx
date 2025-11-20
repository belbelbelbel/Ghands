import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const REASONS = [
  'Service Unavailable',
  'Timing issue',
  'Better match found',
  'Others (Please specify)',
];

export default function CancelRequestScreen() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [additionalNote, setAdditionalNote] = useState('');

  const handleSubmit = () => {
    router.push('/(tabs)/jobs');
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
            Why did you cancel?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">×</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-gray-500 mb-6" style={{ fontFamily: 'Poppins-Regular' }}>
          Help us improve by sharing your reason
        </Text>

        {REASONS.map((reason) => {
          const isActive = selectedReason === reason;
          return (
            <TouchableOpacity
              key={reason}
              onPress={() => setSelectedReason(reason)}
              className="flex-row items-center justify-between border border-gray-200 rounded-2xl px-4 py-4 mb-3"
              activeOpacity={0.85}
            >
              <Text className="text-base text-black" style={{ fontFamily: 'Poppins-Medium' }}>
                {reason}
              </Text>
              <View className={`w-6 h-6 rounded-full border-2 ${isActive ? 'border-black' : 'border-gray-300'} items-center justify-center`}>
                {isActive && <View className="w-3 h-3 rounded-full bg-black" />}
              </View>
            </TouchableOpacity>
          );
        })}

        {selectedReason === 'Others (Please specify)' && (
          <TextInput
            placeholder="Share more details"
            value={additionalNote}
            onChangeText={setAdditionalNote}
            multiline
            className="border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black mb-5"
            style={{ fontFamily: 'Poppins-Regular', minHeight: 100, textAlignVertical: 'top' }}
          />
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          className="bg-black rounded-xl py-4 items-center justify-center mb-4"
        >
          <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Submit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="bg-gray-100 rounded-xl py-4 items-center justify-center"
        >
          <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-center text-gray-400 mt-4" style={{ fontFamily: 'Poppins-Regular' }}>
          Your feedback is anonymous
        </Text>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
