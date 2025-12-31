import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { Spacing, Colors } from '@/lib/designSystem';

export default function PasswordConfirmationScreen() {
  const router = useRouter();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!password.trim()) {
      showError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success message
      showSuccess('Password reset successfully! Redirecting to login...');

      // Navigate to login screen after a short delay
      setTimeout(() => {
        router.replace('/LoginScreen');
      }, 2000);
    } catch (error) {
      showError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOtp = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBackToOtp}
          style={{ marginBottom: 24 }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.backgroundGray,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={{
            fontSize: 32,
            fontFamily: 'Poppins-ExtraBold',
            color: Colors.textPrimary,
            marginBottom: 16,
            lineHeight: 40,
          }}
        >
          Create New Password
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            color: Colors.textSecondaryDark,
            marginBottom: 32,
            lineHeight: 24,
          }}
        >
          Your new password must be different from your previous password.
        </Text>

        {/* New Password Input */}
        <View style={{ marginBottom: 16 }}>
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
        <View style={{ marginBottom: 32 }}>
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
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <AuthButton
            title={isLoading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        {/* Back to Login Link */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <TouchableOpacity onPress={() => router.push('/LoginScreen')} activeOpacity={0.7}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Medium',
                color: Colors.textPrimary,
              }}
            >
              Remember your password?{' '}
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  color: Colors.accent,
                }}
              >
                Back to Login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
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