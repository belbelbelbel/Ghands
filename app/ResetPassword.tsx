import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { InputField } from '../components/InputField';
import { Colors, Spacing } from '@/lib/designSystem';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { toast, showError, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetCode = async () => {
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to send reset code
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to OTP screen
      router.push('/OtpScreen');
    } catch (error) {
      showError('Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
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
          onPress={handleBackToLogin}
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
          Reset Password
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
          Enter your email address and we'll send you a verification code to reset your password.
        </Text>

        {/* Email Input */}
        <InputField
          placeholder="Company email"
          icon={<Mail size={20} color={'white'}/>}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          iconPosition="left"
        />

        {/* Send Code Button */}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <AuthButton
            title={isLoading ? 'Sending...' : 'Send Reset Code'}
            onPress={handleSendResetCode}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        {/* Back to Login Link */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <TouchableOpacity onPress={handleBackToLogin} activeOpacity={0.7}>
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