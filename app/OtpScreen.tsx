import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      
      // Auto-focus next input if value is entered
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace - move to previous input
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any 6-digit code
      if (code.length === 6) {
        router.push('/PasswordConfirmation');
      } else {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToReset = () => {
    router.back();
  };

  const handleResendCode = () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    
    // Simulate resend API call
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  const isCodeComplete = otp.join('').length === 6;

  return (
    <SafeAreaWrapper>
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
        <View className="flex-row justify-between mb-8 px-4">
          {otp.map((digit, index) => (
            <View 
              key={index} 
              className={`w-12 h-14 rounded-xl border-[0.5px] items-center justify-center ${
                digit ? 'bg-[#6A9B00] border-[#6A9B00]' : 'bg-gray-100 border-gray-300'
              }`}
            >
              <TextInput
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                className="text-xl font-bold text-white text-center w-full"
                style={{
                  fontFamily: 'Poppins-Bold',
                }}
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus
                autoFocus={index === 0}
              />
            </View>
          ))}
        </View>

        {/* Verify Button */}
        <View className="mt-4">
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={!isCodeComplete || isVerifying}
            className={`rounded-xl py-4 px-6 ${
              isCodeComplete && !isVerifying 
                ? 'bg-black' 
                : 'bg-gray-300'
            }`}
            activeOpacity={0.8}
          >
            <Text 
              className={`text-center text-lg font-semibold ${
                isCodeComplete && !isVerifying ? 'text-white' : 'text-gray-500'
              }`}
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resend Code */}
        <View className="items-center mt-8">
          <TouchableOpacity 
            onPress={handleResendCode} 
            activeOpacity={canResend ? 0.7 : 1}
            disabled={!canResend}
          >
            <Text className="text-base" style={{ fontFamily: 'Poppins-Medium' }}>
              Didn't receive a code?{' '}
              {canResend ? (
                <Text className="text-black font-bold" style={{ fontFamily: 'Poppins-Bold' }}>
                  Resend
                </Text>
              ) : (
                <Text className="text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                  Resend in {resendTimer}s
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}