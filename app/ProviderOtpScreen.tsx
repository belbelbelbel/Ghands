import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors, Fonts, Spacing, BorderRadius } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProviderOtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
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
      
      if (numericValue && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = () => {
    const code = otp.join('');
    if (code.length === 4) {
      router.push('/ProviderProfileSetupScreen');
    }
  };

  const handleResendCode = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isCodeComplete = otp.join('').length === 4;

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: 40 }}>
        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.xs,
        }}>Verify Phone Number</Text>

        <Text style={{
          ...Fonts.body,
          color: Colors.textPrimary,
          marginBottom: 2,
        }}>
          OTP Code has been sent to
        </Text>
        <Text style={{
          ...Fonts.body,
          fontFamily: 'Poppins-Bold',
          color: Colors.textPrimary,
          marginBottom: Spacing.lg,
        }}>
          +234 912 012 4567
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg + 2, paddingHorizontal: Spacing.xs + 4 }}>
          {otp.map((digit, index) => (
            <View 
              key={index} 
              style={{
                width: 56,
                height: 56,
                borderRadius: BorderRadius.default,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: digit ? Colors.accent : Colors.backgroundLight,
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
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: digit ? Colors.white : Colors.textPrimary,
                  textAlign: 'center',
                  width: '100%',
                }}
                placeholderTextColor={Colors.tabInactive}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs + 4 }}>
          <Clock size={16} color={Colors.error} />
          <Text style={{ ...Fonts.bodySmall, color: Colors.error, marginLeft: Spacing.xs + 2, fontFamily: 'Poppins-Medium' }}>
            {String(Math.floor(resendTimer / 60)).padStart(2, '0')}:{String(resendTimer % 60).padStart(2, '0')}
          </Text>
        </View>

        <Text style={{ ...Fonts.body, color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 }}>
          Didn't get the code?
        </Text>
        <TouchableOpacity onPress={handleResendCode} disabled={!canResend} activeOpacity={0.7}>
          <Text style={{ ...Fonts.body, fontFamily: 'Poppins-Bold', color: Colors.accent, textAlign: 'center', marginBottom: Spacing.lg }}>
            Resend OTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!isCodeComplete}
          style={{
            borderRadius: BorderRadius.default,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg + 2,
            backgroundColor: isCodeComplete ? Colors.accent : Colors.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text 
            style={{
              ...Fonts.button,
              fontSize: 16,
              color: isCodeComplete ? Colors.textPrimary : Colors.textTertiary,
              textAlign: 'center',
            }}
          >
            Confirm
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

