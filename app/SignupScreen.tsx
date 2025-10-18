import { useRouter } from 'expo-router';
import { Lock, Mail, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';
import { SocialButton } from '../components/SocialButton';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fax, setFax] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    // Handle signup logic
    console.log('Sign up pressed');
  };

  const handleLogin = () => {
    // Navigate to login screen
    console.log('Login pressed');
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
        <Text className="text-3xl font-bold text-black mb-8">Sign Up</Text>

        {/* Input Fields */}
        <InputField
          placeholder="Company email"
          icon={<Mail size={20} color="black" />}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <InputField
          placeholder="+234 Company fax"
          icon={<Phone size={20} color="black" />}
          keyboardType="phone-pad"
          value={fax}
          onChangeText={setFax}
        />

        <InputField
          placeholder="Password"
          icon={<Lock size={20} color="black" />}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />

        <InputField
          placeholder="Confirm password"
          icon={<Lock size={20} color="black" />}
          secureTextEntry={true}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Sign Up Button */}
        <View className="mt-4">
          <AuthButton title="Sign Up" onPress={handleSignup} />
        </View>

        {/* Login Link */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text className="text-base">
              Already have an account?{' '}
              <Text className="text-[#ADF802] font-semibold">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-500 text-base">or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Social Buttons */}
        <SocialButton
          title="Continue with Google"
          icon={
            <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">G</Text>
            </View>
          }
          onPress={handleGoogleSignup}
        />

        <SocialButton
          title="Continue with Facebook"
          icon={
            <View className="w-5 h-5 bg-blue-600 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">f</Text>
            </View>
          }
          onPress={handleFacebookSignup}
        />
      </ScrollView>
      <StatusBar barStyle="dark-content" backgroundColor="white"  />
    </SafeAreaView>
  );
}