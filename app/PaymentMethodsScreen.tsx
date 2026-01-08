import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Plus, CheckCircle, Lock, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View, Animated } from 'react-native';

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
    amount?: string;
    providerName?: string;
    serviceName?: string;
    transactionId?: string;
  }>();
  
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('processing');
  const [selectedMethod, setSelectedMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleRemove = (id: string) => {
    // Handle remove payment method
    haptics.light();
  };

  const handlePaymentMethodSelect = (method: typeof PAYMENT_METHODS[0]) => {
    haptics.selection();
    setSelectedMethod(method);
    setShowProcessingModal(true);
    setPaymentStep('processing');
    startPaymentFlow();
  };

  const startPaymentFlow = () => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    // Step 1: Processing payment (1.5 seconds)
    const timeout1 = setTimeout(() => {
      setPaymentStep('verifying');
      haptics.light();
    }, 1500);
    timeoutRefs.current.push(timeout1);

    // Step 2: Verifying payment (1.5 seconds)
    const timeout2 = setTimeout(() => {
      setPaymentStep('completing');
      haptics.light();
    }, 3000);
    timeoutRefs.current.push(timeout2);

    // Step 3: Completing transaction (1 second)
    const timeout3 = setTimeout(() => {
      setPaymentStep('success');
      haptics.success();
    }, 4000);
    timeoutRefs.current.push(timeout3);

    // Step 4: Navigate to success screen (1.5 seconds after success)
    const timeout4 = setTimeout(() => {
      setShowProcessingModal(false);
      const transactionId = `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      router.replace({
        pathname: '/PaymentSuccessfulScreen' as any,
        params: {
          transactionId,
          providerName: params.providerName || 'Elite Plumbing Services',
          serviceName: params.serviceName || 'Pipe Repair & Installation',
          amount: params.amount || '485.00',
        },
      });
    }, 5500);
    timeoutRefs.current.push(timeout4);
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
        <Text className="text-xl font-bold text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          Payment methods
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
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
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 8,
                textAlign: 'center',
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
    </SafeAreaWrapper>
  );
}

