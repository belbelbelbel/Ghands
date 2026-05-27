import { AuthButton } from '@/components/AuthButton';
import { InputField } from '@/components/InputField';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProviderResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        <Text
          className="text-3xl font-bold text-black mb-8"
          style={{
            fontFamily: 'Poppins-ExtraBold',
          }}
        >
          Reset your password
        </Text>

        <InputField
          placeholder="Enter new password"
          icon={<Lock size={18} color="white" />}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          iconPosition="left"
        />

        <InputField
          placeholder="Confirm password"
          icon={<Lock size={18} color="white" />}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          iconPosition="left"
        />

        <View className="mt-2">
          <AuthButton
            title="Confirm"
            onPress={handleConfirm}
            disabled={!isFormValid}
          />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
