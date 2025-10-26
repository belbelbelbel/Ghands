import { useRouter } from 'expo-router';
import { Lock, Mail, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';
import { SocialButton } from '../components/SocialButton';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fax, setFax] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    // Basic validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Simulate API call for signup
      console.log('Signing up user:', { email, fax, password });
      
      // After successful signup, navigate to location permission
      router.push('/LocationPermissionScreen');
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  };

  const handleLogin = () => {
    // Navigate to login screen
    router.push('/LoginScreen');
  };

  const handleGoogleSignup = () => {
    // Handle Google signup
    console.log('Google signup');
  };

  const handleFacebookSignup = () => {
    // Handle Facebook signup
    console.log('Facebook signup');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        {/* Title */}
        <Text className="text-3xl font-bold text-black mb-8" style={{
             fontFamily: 'Poppins-ExtraBold',
        }}>Sign Up</Text>

        {/* Company Email Input */}
        <InputField
          placeholder="Company email"
          icon={<Mail size={20} color={'white'}/>}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          iconPosition="left"
        />

        {/* Company Fax Input */}
        <InputField
          placeholder="+234 Company fax"
          icon={<Phone size={20} color={'white'}/>}
          keyboardType="phone-pad"
          value={fax}
          onChangeText={setFax}
          iconPosition="right"
        />

        {/* Password Input */}
        <InputField
          placeholder="Password"
          icon={<Lock size={20} color={'white'}/>}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          iconPosition="right"
        />

        {/* Confirm Password Input */}
        <InputField
          placeholder="Confirm password"
          icon={<Lock size={20} color={'white'}/>}
          secureTextEntry={true}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          iconPosition="right"
        />


        {/* Sign Up Button */}
        <View className="mt-4">
          <AuthButton title="Sign Up" onPress={handleSignup} />
        </View>

        {/* Login Link */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Already have an account?{' '}
              <Text className="text-black font-bold" style={{ fontFamily: 'Poppins-Bold' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-500 text-base" style={{ fontFamily: 'Poppins-Medium' }}>or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Social Buttons */}
        <SocialButton
          title="Continue with Google"
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
          onPress={handleGoogleSignup}
        />

        <SocialButton
          title="Continue with Facebook"
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                fill="#1877F2"
              />
            </Svg>
          }
          onPress={handleFacebookSignup}
        />
      </ScrollView>
    
    </SafeAreaView>
  );
}