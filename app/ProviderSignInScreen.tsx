import { AuthButton } from '@/components/AuthButton';
import { InputField } from '@/components/InputField';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { SocialButton } from '@/components/SocialButton';
import Toast from '@/components/Toast';
import { useAuthRole } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { providerService } from '@/services/api';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProviderSignInScreen() {
  const router = useRouter();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const { setRole } = useAuthRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Prevent duplicate submissions
    if (isSubmitting || isLoading) {
      if (__DEV__) {
        console.warn('⚠️ Login already in progress, ignoring duplicate call');
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    haptics.light();

    try {
      const loginPayload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      if (__DEV__) {
        console.log('📤 Provider Login Request:', JSON.stringify({ ...loginPayload, password: '***' }, null, 2));
      }

      const response = await providerService.login(loginPayload);
      
      // Token is already saved by providerService.login
      // Set role to provider
      await setRole('provider');
      
      // Save provider info
      if (response.id) {
        await AsyncStorage.setItem('@ghands:provider_id', response.id.toString());
      }
      if (response.name) {
        await AsyncStorage.setItem('@ghands:provider_name', response.name);
      }
      if (response.email) {
        await AsyncStorage.setItem('@ghands:provider_email', response.email);
      }
      
      haptics.success();
      showSuccess('Login successful!');
      
      // Navigate to provider home
      setTimeout(() => {
        router.replace('/provider/home');
      }, 1000);
    } catch (error: any) {
      console.error('Provider login error:', error);
      haptics.error();
      
      const errorMessage = getSpecificErrorMessage(error);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSignup = () => {
    router.push('/ProviderSignUpScreen');
  };

  const handleGoogleLogin = () => {
    // Handle Google login
  };

  const handleFacebookLogin = () => {
    // Handle Facebook login
  };

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
        }}>Sign In</Text>

        <InputField
          placeholder="Email"
          icon={<Mail size={20} color={'white'}/>}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          iconPosition="left"
          autoCapitalize="none"
        />

        <InputField
          placeholder="Password"
          icon={<Lock size={20} color={'white'}/>}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          iconPosition="right"
        />

        <View className="items-end mb-4">
          <TouchableOpacity onPress={() => router.push('/ProviderResetPasswordScreen')} activeOpacity={0.7}>
            <Text className="text-[#6A9B00] font-bold text-base" style={{ fontFamily: 'Poppins-Bold' }}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <AuthButton 
            title="Login" 
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        <View className="items-center mb-8">
          <TouchableOpacity onPress={handleSignup} activeOpacity={0.7}>
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Don't have an account?{' '}
              <Text className="text-[#6A9B00] font-bold" style={{ fontFamily: 'Poppins-Bold' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-500 text-base" style={{ fontFamily: 'Poppins-Medium' }}>or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        <SocialButton
          title="Continue using Google"
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </Svg>
          }
          onPress={handleGoogleLogin}
        />

        <SocialButton
          title="Continue using Facebook"
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                fill="#1877F2"
              />
            </Svg>
          }
          onPress={handleFacebookLogin}
        />
      </ScrollView>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}

