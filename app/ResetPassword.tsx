import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSendResetCode = () => {
    if (email.trim()) {
      router.push('/OtpScreen');
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        <TouchableOpacity onPress={handleBackToLogin} className="mb-6" activeOpacity={0.7}>
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <ArrowLeft size={20} color={'black'} />
          </View>
        </TouchableOpacity>

        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.xs,
        }}>Reset Password</Text>

        <Text style={{
          ...Fonts.body,
          color: Colors.textSecondaryDark,
          marginBottom: Spacing.lg,
        }}>
          Enter your email address and we'll send you a verification code to reset your password.
        </Text>

        <InputField
          placeholder="Company email"
          icon={<Mail size={20} color={'white'}/>}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          iconPosition="left"
        />

        <View className="mt-4">
          <AuthButton title="Send Reset Code" onPress={handleSendResetCode} />
        </View>

        <View className="items-center mt-8">
          <TouchableOpacity onPress={handleBackToLogin} activeOpacity={0.7}>
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Remember your password?{' '}
              <Text className="text-[#6A9B00] font-bold" style={{ fontFamily: 'Poppins-Bold' }}>Back to Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}