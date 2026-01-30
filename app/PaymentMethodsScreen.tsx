import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { walletService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, ChevronRight, Lock, Plus, RefreshCw, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PAYMENT_METHODS = [
  {
    id: '1',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
  {
    id: '2',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
  {
    id: '3',
    type: 'VISA',
    lastFour: '4532',
    expires: '12/26',
    lastUsed: '2 days ago',
  },
];

type PaymentStep = 'processing' | 'verifying' | 'completing' | 'success';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    amount?: string;
    quotationId?: string;
    providerName?: string;
    serviceName?: string;
    transactionId?: string;
  }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('processing');
  const [selectedMethod, setSelectedMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Persistent payment error state - stays visible until user dismisses or retries
  const [paymentError, setPaymentError] = useState<{
    message: string;
    isInsufficientBalance: boolean;
  } | null>(null);
  const pinInputRefs = useRef<TextInput[]>([]);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleRemove = (id: string) => {
    // Handle remove payment method
    haptics.light();
  };

  const handlePaymentMethodSelect = (method: typeof PAYMENT_METHODS[0]) => {
    haptics.selection();
    setSelectedMethod(method);
    // Clear any previous payment errors when user selects a new payment method
    setPaymentError(null);
    // Show PIN modal first
    setShowPinModal(true);
    setPin(['', '', '', '']);
    if (pinInputRefs.current[0]) {
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  };

  const handlePinChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newPin = [...pin];
      newPin[index] = numericValue;
      setPin(newPin);

      // Auto-focus next input
      if (numericValue && index < 3) {
        pinInputRefs.current[index + 1]?.focus();
      }

      // If PIN is complete, process payment
      if (index === 3 && numericValue) {
        handleProcessPayment(newPin.join(''));
      }
    }
  };

  const handlePinKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleProcessPayment = async (pinValue: string) => {
    // Validate PIN first - must be exactly 4 digits
    if (!pinValue || pinValue.length !== 4 || !/^\d{4}$/.test(pinValue)) {
      showError('Please enter a valid 4-digit PIN.');
      return;
    }

    // Validate payment parameters
    if (!params.requestId || !params.amount) {
      showError('Missing payment information. Please try again.');
      return;
    }

    const requestId = parseInt(params.requestId, 10);
    const amount = parseFloat(params.amount);

    // Validate requestId and amount are valid numbers
    if (isNaN(requestId) || isNaN(amount) || amount <= 0) {
      showError('Invalid payment information. Please check the amount and try again.');
      return;
    }

    setIsProcessingPayment(true);
    setShowPinModal(false);
    setShowProcessingModal(true);
    setPaymentStep('processing');

    try {

      // Call the payment API
      const response = await walletService.payForService({
        requestId,
        amount,
        pin: pinValue,
      });

      // Payment successful - show success animation
      setTimeout(() => {
        setPaymentStep('verifying');
        haptics.light();
      }, 1500);

      setTimeout(() => {
        setPaymentStep('completing');
        haptics.light();
      }, 3000);

      setTimeout(() => {
        setPaymentStep('success');
        haptics.success();
      }, 4000);

      // Navigate to success screen
      setTimeout(() => {
        setShowProcessingModal(false);
        router.replace({
          pathname: '/PaymentSuccessfulScreen' as any,
          params: {
            transactionId: response.reference,
            providerName: params.providerName || 'Service Provider',
            serviceName: params.serviceName || 'Service Request',
            amount: params.amount,
            requestId: params.requestId,
          },
        });
      }, 5500);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      setIsProcessingPayment(false);
      setShowProcessingModal(false);
      setShowPinModal(false);
      setPin(['', '', '', '']);
      
      const errorMessage = error?.message || error?.details?.data?.error || '';
      const isPinError = errorMessage.toLowerCase().includes('pin') || 
                        errorMessage.toLowerCase().includes('wrong pin') ||
                        errorMessage.toLowerCase().includes('invalid pin') ||
                        errorMessage.toLowerCase().includes('pin not set');
      
      // If PIN error, redirect to Create PIN screen with return path
      if (isPinError) {
        haptics.error();
        showError('PIN is incorrect or not set. Please create or update your PIN.');
        setTimeout(() => {
          router.push({
            pathname: '/CreatePINScreen' as any,
            params: {
              // Pass return path so user can come back to payment after creating PIN
              returnTo: '/PaymentMethodsScreen',
              returnParams: JSON.stringify({
                requestId: params.requestId,
                amount: params.amount,
                quotationId: params.quotationId,
                providerName: params.providerName,
                serviceName: params.serviceName,
              }),
            },
          } as any);
        }, 1500);
        return;
      }
      
      // Handle other payment failures - STAY on payment screen, show persistent error
      const errorMsg = getSpecificErrorMessage(error, 'pay_for_service') || errorMessage || 'Payment failed. Please try again.';
      const isInsufficientBalance = errorMessage.toLowerCase().includes('insufficient') || 
                                    errorMessage.toLowerCase().includes('balance') ||
                                    errorMsg.toLowerCase().includes('insufficient') ||
                                    errorMsg.toLowerCase().includes('balance');
      
      haptics.error();
      showError(errorMsg);
      
      // Set persistent error state - stays visible until user dismisses or retries
      setPaymentError({
        message: isInsufficientBalance 
          ? 'Insufficient wallet balance. Please top up your wallet to continue with payment.'
          : errorMsg,
        isInsufficientBalance,
      });
      
      // DO NOT navigate away - user stays on payment screen to:
      // 1. See the error clearly
      // 2. Top up wallet if needed (via banner button)
      // 3. Retry payment after fixing the issue
      // This prevents timeline from showing incorrect states
    }
  };

  const handleCancelPin = () => {
    setShowPinModal(false);
    setPin(['', '', '', '']);
    setSelectedMethod(null);
    // Clear payment error when user cancels PIN entry
    setPaymentError(null);
  };


  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Spinning animation for loader
  useEffect(() => {
    if (showProcessingModal && paymentStep !== 'success') {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [showProcessingModal, paymentStep]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStepMessage = () => {
    switch (paymentStep) {
      case 'processing':
        return { title: 'Processing Payment', subtitle: 'Please wait while we process your payment...' };
      case 'verifying':
        return { title: 'Verifying Payment', subtitle: 'Confirming transaction details...' };
      case 'completing':
        return { title: 'Completing Transaction', subtitle: 'Finalizing your payment...' };
      case 'success':
        return { title: 'Payment Successful!', subtitle: 'Your payment has been processed successfully' };
      default:
        return { title: 'Processing...', subtitle: 'Please wait' };
    }
  };

  const stepMessage = getStepMessage();

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
        <TouchableOpacity 
          onPress={() => {
            haptics.light();
            router.back();
          }} 
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold', letterSpacing: -0.3 }}>
          Payment methods
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Persistent Payment Error Banner - Professional Design */}
        {paymentError && (
          <View
            style={{
              backgroundColor: paymentError.isInsufficientBalance ? '#FEF2F2' : '#FFF4E6',
              borderLeftWidth: 4,
              borderLeftColor: paymentError.isInsufficientBalance ? Colors.error : '#F59E0B',
              borderRadius: BorderRadius.md,
              padding: 16,
              marginTop: 16,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: paymentError.isInsufficientBalance ? 12 : 0 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: paymentError.isInsufficientBalance ? Colors.error : '#F59E0B',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <X size={14} color={Colors.white} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: paymentError.isInsufficientBalance ? Colors.error : '#F59E0B',
                    }}
                  >
                    Payment Error
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textPrimary,
                    lineHeight: 20,
                    marginLeft: 32,
                  }}
                >
                  {paymentError.message}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaymentError(null)}
                style={{
                  padding: 4,
                  borderRadius: 12,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                }}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
            </View>
            
            {/* Top Up Wallet Button - Only shown for insufficient balance */}
            {paymentError.isInsufficientBalance && (
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  // Pass return path so user can come back to payment after topping up
                  router.push({
                    pathname: '/TopUpScreen' as any,
                    params: {
                      returnTo: '/PaymentMethodsScreen',
                      returnParams: JSON.stringify({
                        requestId: params.requestId,
                        amount: params.amount,
                        quotationId: params.quotationId,
                        providerName: params.providerName,
                        serviceName: params.serviceName,
                      }),
                    },
                  } as any);
                }}
                style={{
                  marginTop: 12,
                  backgroundColor: Colors.accent,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: Colors.accent,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                    letterSpacing: 0.3,
                  }}
                >
                  Top Up Wallet
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => handlePaymentMethodSelect(method)}
            activeOpacity={0.8}
            className="bg-gray-50 rounded-2xl px-4 py-5 mb-4 border border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-600 rounded-xl w-12 h-12 items-center justify-center mr-4">
                  <Text 
                    className="text-white font-bold text-xs" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    VISA
                  </Text>
                </View>
                <View className="flex-1">
                  <Text 
                    className="text-base font-bold text-black mb-1" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    Visa •••• {method.lastFour}
                  </Text>
                  <Text 
                    className="text-sm text-gray-500 mb-1" 
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Expires {method.expires}
                  </Text>
                  <Text 
                    className="text-sm text-gray-500" 
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Last used: {method.lastUsed}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemove(method.id);
                }}
                activeOpacity={0.7}
              >
                <Text 
                  className="text-[#6A9B00] text-sm" 
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.push('/AddCardDetailsScreen' as any);
          }}
          activeOpacity={0.7}
          className="border-2 border-dashed border-gray-300 rounded-2xl px-4 py-5 flex-row items-center justify-between mb-4"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 items-center justify-center mr-4">
              <Plus size={24} color="#9CA3AF" />
            </View>
            <Text 
              className="text-gray-500 text-base" 
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Add Payment Method
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Processing Modal */}
      <Modal
        visible={showProcessingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              minWidth: 300,
              maxWidth: '90%',
            }}
          >
            {/* Icon/Animation */}
            {paymentStep === 'success' ? (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <CheckCircle size={48} color={Colors.accent} />
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                <Animated.View
                  style={{
                    transform: [{ rotate: spin }],
                  }}
                >
                  <RefreshCw size={64} color={Colors.accent} />
                </Animated.View>
              </View>
            )}

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 6,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              {stepMessage.title}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              {stepMessage.subtitle}
            </Text>

            {/* Progress Steps */}
            <View style={{ width: '100%', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: ['verifying', 'completing', 'success'].indexOf(paymentStep) >= 0
                        ? Colors.accent
                        : paymentStep === 'processing'
                        ? '#FEF3C7'
                        : Colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {['verifying', 'completing', 'success'].indexOf(paymentStep) >= 0 ? (
                      <CheckCircle size={16} color={Colors.white} />
                    ) : (
                      <Lock size={16} color={paymentStep === 'processing' ? '#D97706' : Colors.textSecondaryDark} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins-Medium',
                      color: ['verifying', 'completing', 'success'].indexOf(paymentStep) >= 0
                        ? Colors.accent
                        : paymentStep === 'processing'
                        ? '#D97706'
                        : Colors.textSecondaryDark,
                      textAlign: 'center',
                    }}
                  >
                    Processing
                  </Text>
                </View>

                <View style={{ flex: 1, height: 2, backgroundColor: ['verifying', 'completing', 'success'].indexOf(paymentStep) >= 0 ? Colors.accent : Colors.border, marginTop: 16, marginHorizontal: 8 }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: ['completing', 'success'].indexOf(paymentStep) >= 0
                        ? Colors.accent
                        : paymentStep === 'verifying'
                        ? '#FEF3C7'
                        : Colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {['completing', 'success'].indexOf(paymentStep) >= 0 ? (
                      <CheckCircle size={16} color={Colors.white} />
                    ) : (
                      <Lock size={16} color={paymentStep === 'verifying' ? '#D97706' : Colors.textSecondaryDark} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins-Medium',
                      color: ['completing', 'success'].indexOf(paymentStep) >= 0
                        ? Colors.accent
                        : paymentStep === 'verifying'
                        ? '#D97706'
                        : Colors.textSecondaryDark,
                      textAlign: 'center',
                    }}
                  >
                    Verifying
                  </Text>
                </View>

                <View style={{ flex: 1, height: 2, backgroundColor: ['completing', 'success'].indexOf(paymentStep) >= 0 ? Colors.accent : Colors.border, marginTop: 16, marginHorizontal: 8 }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: paymentStep === 'success'
                        ? Colors.accent
                        : paymentStep === 'completing'
                        ? '#FEF3C7'
                        : Colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {paymentStep === 'success' ? (
                      <CheckCircle size={16} color={Colors.white} />
                    ) : (
                      <Lock size={16} color={paymentStep === 'completing' ? '#D97706' : Colors.textSecondaryDark} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins-Medium',
                      color: paymentStep === 'success'
                        ? Colors.accent
                        : paymentStep === 'completing'
                        ? '#D97706'
                        : Colors.textSecondaryDark,
                      textAlign: 'center',
                    }}
                  >
                    Completing
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method Info */}
            {selectedMethod && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: 4,
                  }}
                >
                  Payment Method
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Visa •••• {selectedMethod.lastFour}
                </Text>
              </View>
            )}
          </View>
        </View>
        </Modal>

        {/* PIN Input Modal */}
        <Modal
          visible={showPinModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelPin}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: Colors.white,
                borderTopLeftRadius: BorderRadius.xl,
                borderTopRightRadius: BorderRadius.xl,
                paddingTop: 24,
                paddingBottom: 40,
                paddingHorizontal: 20,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  Enter Wallet PIN
                </Text>
                <TouchableOpacity
                  onPress={handleCancelPin}
                  style={{
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                Enter your 4-digit wallet PIN to confirm payment
              </Text>

              {/* Amount Display */}
              {params.amount && (
                <View
                  style={{
                    backgroundColor: Colors.backgroundGray,
                    borderRadius: BorderRadius.default,
                    padding: 16,
                    marginBottom: 24,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 4,
                    }}
                  >
                    Payment Amount
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    ₦{new Intl.NumberFormat('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(parseFloat(params.amount))}
                  </Text>
                </View>
              )}

              {/* PIN Input Fields */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  gap: 12,
                }}
              >
                {[0, 1, 2, 3].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) pinInputRefs.current[index] = ref;
                    }}
                    value={pin[index]}
                    onChangeText={(value) => handlePinChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handlePinKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry={true}
                    style={{
                      flex: 1,
                      height: 56,
                      borderWidth: 2,
                      borderColor:
                        pin[index]
                          ? Colors.accent
                          : Colors.border,
                      borderRadius: BorderRadius.default,
                      textAlign: 'center',
                      fontSize: 24,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      backgroundColor: Colors.white,
                    }}
                    textContentType="none"
                    autoComplete="off"
                  />
                ))}
              </View>

              {/* Processing Indicator */}
              {isProcessingPayment && (
                <View
                  style={{
                    alignItems: 'center',
                    marginTop: 16,
                  }}
                >
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginTop: 8,
                    }}
                  >
                    Processing payment...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={hideToast}
        />
      </SafeAreaWrapper>
    );
  }

