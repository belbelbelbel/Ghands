import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts, Spacing, BorderRadius } from '@/lib/designSystem';
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
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  const isCodeComplete = otp.join('').length === 6;

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        <TouchableOpacity onPress={handleBackToReset} className="mb-6" activeOpacity={0.7}>
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <ArrowLeft size={20} color={'black'} />
          </View>
        </TouchableOpacity>

        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.xs,
        }}>Enter Verification Code</Text>

        <Text style={{
          ...Fonts.body,
          color: Colors.textSecondaryDark,
          marginBottom: Spacing.lg,
        }}>
          We've sent a 6-digit verification code to your email address.
        </Text>

        <View className="flex-row justify-between mb-8 px-4">
          {otp.map((digit, index) => (
            <View 
              key={index} 
              style={{
                width: 48,
                height: 56,
                borderRadius: BorderRadius.default,
                borderWidth: 0.5,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: digit ? Colors.accent : Colors.backgroundGray,
                borderColor: digit ? Colors.accent : Colors.border,
              }}
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

        <View style={{ marginTop: Spacing.xs }}>
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={!isCodeComplete || isVerifying}
            style={{
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg + 2,
              backgroundColor: isCodeComplete && !isVerifying ? Colors.black : Colors.borderLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text 
              style={{
                ...Fonts.button,
                fontSize: 16,
                color: isCodeComplete && !isVerifying ? Colors.white : Colors.textTertiary,
                textAlign: 'center',
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-8">
          <TouchableOpacity 
            onPress={handleResendCode} 
            activeOpacity={canResend ? 0.7 : 1}
            disabled={!canResend}
          >
            <Text style={{ ...Fonts.body, color: Colors.textPrimary }}>
              Didn't receive a code?{' '}
              {canResend ? (
                <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.accent }}>
                  Resend
                </Text>
              ) : (
                <Text style={{ ...Fonts.body, color: Colors.textTertiary }}>
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