import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
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
      router.push('/provider/ProfileSetupScreen');
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
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-black mb-4" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Verify Phone Number</Text>

        <Text className="text-base text-black mb-2" style={{
          fontFamily: 'Poppins-Medium',
        }}>
          OTP Code has been sent to
        </Text>
        <Text className="text-base font-bold text-black mb-8" style={{
          fontFamily: 'Poppins-Bold',
        }}>
          +234 912 012 4567
        </Text>

        <View className="flex-row justify-between mb-6 px-4">
          {otp.map((digit, index) => (
            <View 
              key={index} 
              className={`w-14 h-14 rounded-xl border items-center justify-center ${
                digit ? 'bg-[#6A9B00] border-[#6A9B00]' : 'bg-white border-gray-300'
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
                className="text-xl font-bold text-center w-full"
                style={{
                  fontFamily: 'Poppins-Bold',
                  color: digit ? '#FFFFFF' : '#000000',
                }}
                placeholderTextColor="#9CA3AF"
                selectTextOnFocus
                autoFocus={index === 0}
              />
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-center mb-4">
          <Clock size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2" style={{ fontFamily: 'Poppins-Medium' }}>
            {String(Math.floor(resendTimer / 60)).padStart(2, '0')}:{String(resendTimer % 60).padStart(2, '0')}
          </Text>
        </View>

        <Text className="text-base text-black text-center mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
          Didn't get the code?
        </Text>
        <TouchableOpacity onPress={handleResendCode} disabled={!canResend} activeOpacity={0.7}>
          <Text className="text-[#6A9B00] text-base font-bold text-center mb-8" style={{ fontFamily: 'Poppins-Bold' }}>
            Resend OTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!isCodeComplete}
          className={`rounded-xl py-4 px-6 ${
            isCodeComplete ? 'bg-[#6A9B00]' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
        >
          <Text 
            className={`text-center text-lg font-semibold ${
              isCodeComplete ? 'text-white' : 'text-gray-500'
            }`}
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Confirm
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

