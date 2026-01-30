import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, BorderRadius } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Shield } from 'lucide-react-native';
import React, { useRef, useState, useEffect } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { walletService } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';

export default function CreatePINScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnTo?: string;
    returnParams?: string;
  }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null);

  const inputRefs = useRef<TextInput[]>([]);
  const confirmInputRefs = useRef<TextInput[]>([]);

  // Check if PIN is already set
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const wallet = await walletService.getWallet();
        setIsPinSet(wallet.isPinSet);
      } catch (error) {
        // If error, assume PIN is not set (for first time setup)
        setIsPinSet(false);
      }
    };
    checkPinStatus();
  }, []);

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
            // PINs match - save to backend (call without await since onChangeText is sync)
            handleSavePin(pin.join(''), newConfirmPin.join('')).catch((err) => {
              // Error is already handled in handleSavePin
              console.error('Error saving PIN:', err);
            });
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

  const handleSavePin = async (pinValue: string, confirmPinValue: string) => {
    if (pinValue.length !== 4 || confirmPinValue.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError('PINs do not match');
      return;
    }

    setIsSavingPin(true);
    setError(null);
    haptics.light();

    try {
      // Save PIN to backend
      await walletService.setPin({
        pin: pinValue,
        confirmPin: confirmPinValue,
      });

      haptics.success();
      setShowSuccessModal(true);
      setIsPinSet(true);
    } catch (error: any) {
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'set_pin') || error?.message || 'Failed to save PIN. Please try again.';
      
      // Check if PIN is already set - offer to change it
      if (errorMessage.toLowerCase().includes('already set') || errorMessage.toLowerCase().includes('change pin')) {
        setError('PIN is already set. Please use "Change PIN" from Security settings.');
      } else {
        setError(errorMessage);
        // Reset confirmation PIN on error
        setConfirmPin(['', '', '', '']);
        confirmInputRefs.current[0]?.focus();
      }
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // If there's a return path, navigate back to it (e.g., payment screen)
    if (params.returnTo && params.returnParams) {
      try {
        const returnParams = JSON.parse(params.returnParams);
        router.replace({
          pathname: params.returnTo as any,
          params: returnParams,
        } as any);
      } catch {
        router.back();
      }
    } else {
      router.back();
    }
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
                  opacity: isSavingPin ? 0.5 : 1,
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
                  editable={!isSavingPin}
                />
              </View>
            ))}
          </View>

          {/* Loading indicator when saving PIN */}
          {isSavingPin && (
            <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 16 }}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginTop: 8,
                }}
              >
                Saving PIN...
              </Text>
            </View>
          )}

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
