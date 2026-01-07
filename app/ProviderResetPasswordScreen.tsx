import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProviderResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleConfirm = () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    router.push('/ProviderSignInScreen' as any);
  };

  const isFormValid = newPassword.trim() && confirmPassword.trim() && newPassword === confirmPassword;

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
        }}>Reset your password</Text>

        <View className="bg-gray-100 rounded-xl mb-4 px-4 py-3 flex-row items-center">
          <TextInput
            placeholder="Enter new password"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            className="flex-1 text-black text-base"
            placeholderTextColor="#666666"
            style={{ fontFamily: 'Poppins-Medium' }}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            className="w-12 h-12 bg-[#6A9B00] border border-[#6A9B00] rounded-xl items-center justify-center ml-4"
          >
            {showNewPassword ? <EyeOff size={20} color="black" /> : <Eye size={20} color="black" />}
          </TouchableOpacity>
        </View>

        <View className="bg-gray-100 rounded-xl mb-6 px-4 py-3 flex-row items-center">
          <TextInput
            placeholder="Confirm password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className="flex-1 text-black text-base"
            placeholderTextColor="#666666"
            style={{ fontFamily: 'Poppins-Medium' }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            className="w-12 h-12 bg-[#6A9B00] border border-[#6A9B00] rounded-xl items-center justify-center ml-4"
          >
            {showConfirmPassword ? <EyeOff size={20} color="black" /> : <Eye size={20} color="black" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
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
            Confirm
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

