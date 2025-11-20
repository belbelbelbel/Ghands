import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';

export default function PasswordConfirmationScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    if (password && confirmPassword && password === confirmPassword) {
      // Navigate back to login screen
      router.push('/LoginScreen');
    }
  };

  const handleBackToOtp = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackToOtp} className="mb-6" activeOpacity={0.7}>
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <ArrowLeft size={20} color={'black'} />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-3xl font-bold text-black mb-4" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Create New Password</Text>

        {/* Description */}
        <Text className="text-base text-gray-600 mb-8" style={{
          fontFamily: 'Poppins-Medium',
        }}>
          Your new password must be different from your previous password.
        </Text>

        {/* New Password Input */}
        <View className="mb-4">
          <InputField
            placeholder="New password"
            icon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={'white'} /> : <Eye size={20} color={'white'} />}
              </TouchableOpacity>
            }
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            iconPosition="right"
          />
        </View>

        {/* Confirm Password Input */}
        <View className="mb-8">
          <InputField
            placeholder="Confirm new password"
            icon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} color={'white'} /> : <Eye size={20} color={'white'} />}
              </TouchableOpacity>
            }
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            iconPosition="right"
          />
        </View>

        {/* Reset Password Button */}
        <View className="mt-4">
          <AuthButton title="Reset Password" onPress={handleResetPassword} />
        </View>

        {/* Back to Login Link */}
        <View className="items-center mt-8">
          <TouchableOpacity onPress={() => router.push('/LoginScreen')} activeOpacity={0.7}>
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Remember your password?{' '}
              <Text className="text-black font-bold" style={{ fontFamily: 'Poppins-Bold' }}>Back to Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}