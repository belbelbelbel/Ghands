import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, BorderRadius } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Shield } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreatePINScreen() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);
  const confirmInputRefs = useRef<TextInput[]>([]);

  const handlePinChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length <= 1) {
      if (isConfirming) {
        const newConfirmPin = [...confirmPin];
        newConfirmPin[index] = numericValue;
        setConfirmPin(newConfirmPin);
        setError(null);

        // Auto-focus next input
        if (numericValue && index < 3) {
          confirmInputRefs.current[index + 1]?.focus();
        }

        // Check if PIN is complete
        if (index === 3 && numericValue) {
          if (newConfirmPin.join('') === pin.join('')) {
            setShowSuccessModal(true);
          } else {
            setError('PIN mismatch');
            setConfirmPin(['', '', '', '']);
            confirmInputRefs.current[0]?.focus();
          }
        }
      } else {
        const newPin = [...pin];
        newPin[index] = numericValue;
        setPin(newPin);

        // Auto-focus next input
        if (numericValue && index < 3) {
          inputRefs.current[index + 1]?.focus();
        }

        // If PIN is complete, move to confirmation
        if (index === 3 && numericValue) {
          setIsConfirming(true);
          setTimeout(() => {
            confirmInputRefs.current[0]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (isConfirming) {
      if (key === 'Backspace' && !confirmPin[index] && index > 0) {
        confirmInputRefs.current[index - 1]?.focus();
      } else if (key === 'Backspace' && index === 0 && confirmPin[0] === '') {
        setIsConfirming(false);
        setPin(['', '', '', '']);
        inputRefs.current[3]?.focus();
      }
    } else {
      if (key === 'Backspace' && !pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const currentPin = isConfirming ? confirmPin : pin;
  const currentRefs = isConfirming ? confirmInputRefs : inputRefs;

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Create PIN
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 }}>
          {/* Security Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={60} color="#3B82F6" />
            </View>
          </View>

          {/* Heading */}
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Secure Your Wallet
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              textAlign: 'center',
              marginBottom: 40,
              lineHeight: 20,
            }}
          >
            Create a 4-digit PIN to protect your wallet and transactions.
          </Text>

          {/* PIN Input Label */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-SemiBold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            {isConfirming ? 'Confirm PIN' : 'Enter PIN'}
          </Text>

          {/* PIN Input Fields */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, gap: 12 }}>
            {currentPin.map((digit, index) => (
              <View
                key={index}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: error ? Colors.error : digit ? Colors.accent : Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.white,
                }}
              >
                <TextInput
                  ref={(ref) => {
                    if (ref) currentRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  style={{
                    fontSize: 24,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    textAlign: 'center',
                    width: '100%',
                  }}
                  selectTextOnFocus
                  autoFocus={index === 0 && !isConfirming}
                />
              </View>
            ))}
          </View>

          {/* Error Message and Forgot PIN */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            {error ? (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.error,
                }}
              >
                {error}
              </Text>
            ) : (
              <View />
            )}
            <TouchableOpacity activeOpacity={0.7}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                }}
              >
                Forgot PIN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleSuccessClose}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={1}
            onPress={handleSuccessClose}
          >
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                minWidth: 280,
                marginHorizontal: 40,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Check size={30} color={Colors.white} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                Your PIN has been created
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  textAlign: 'center',
                }}
              >
                successfully
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
}
