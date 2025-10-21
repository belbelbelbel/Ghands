import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        // Focus next input (this would need refs in a real implementation)
      }
    }
  };

  const handleVerifyCode = () => {
    const code = otp.join('');
    if (code.length === 6) {
      // Navigate to password confirmation screen
      router.push('/PasswordConfirmation');
    }
  };

  const handleBackToReset = () => {
    router.back();
  };

  const handleResendCode = () => {
    // Handle resend code logic
    console.log('Resend code');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackToReset} className="mb-6" activeOpacity={0.7}>
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <ArrowLeft size={20} color={'black'} />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-3xl font-bold text-black mb-4" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Enter Verification Code</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 mb-8" style={{
          fontFamily: 'Poppins-Medium',
        }}>
          We've sent a 6-digit verification code to your email address.
        </Text>

        {/* OTP Input */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <View key={index} className="w-12 h-14 bg-gray-100 rounded-xl border-[0.5px] border-gray-300 items-center justify-center">
              <TextInput
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                keyboardType="numeric"
                maxLength={1}
                className="text-xl font-bold text-black text-center"
                style={{
                  fontFamily: 'Poppins-Bold',
                }}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
        </View>

        {/* Verify Button */}
        <View className="mt-4">
          <AuthButton title="Verify Code" onPress={handleVerifyCode} />
        </View>

        {/* Resend Code */}
        <View className="items-center mt-8">
          <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Didn't receive a code?{' '}
              <Text className="text-black font-bold" style={{ fontFamily: 'Poppins-Bold' }}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}