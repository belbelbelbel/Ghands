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
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

  const handleResetPassword = () => {
    if (password && confirmPassword && password === confirmPassword) {
      router.push('/LoginScreen');
    }
  };

  const handleBackToOtp = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        <TouchableOpacity onPress={handleBackToOtp} className="mb-6" activeOpacity={0.7}>
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <ArrowLeft size={20} color={'black'} />
          </View>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-black mb-4" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Create New Password</Text>

        <Text className="text-base text-gray-600 mb-8" style={{
          fontFamily: 'Poppins-Medium',
        }}>
          Your new password must be different from your previous password.
        </Text>

        <View className="mb-4">
          <InputField
            placeholder="New password"
            icon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <Eye size={20} color={'white'} /> : <EyeOff size={20} color={'white'} />}
              </TouchableOpacity>
            }
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            iconPosition="right"
          />
        </View>

        <View className="mb-8">
          <InputField
            placeholder="Confirm new password"
            icon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <Eye size={20} color={'white'} /> : <EyeOff size={20} color={'white'} />}
              </TouchableOpacity>
            }
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            iconPosition="right"
          />
        </View>

        <View className="mt-4">
          <AuthButton title="Reset Password" onPress={handleResetPassword} />
        </View>

        <View className="items-center mt-8">
          <TouchableOpacity onPress={() => router.push('/LoginScreen')} activeOpacity={0.7}>
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