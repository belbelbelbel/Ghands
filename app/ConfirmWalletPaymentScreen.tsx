import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { walletService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { CheckCircle, Lock, RefreshCw, Wallet, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type PaymentStep = 'processing' | 'verifying' | 'completing' | 'success';

export default function ConfirmWalletPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    amount?: string;
    quotationId?: string;
    providerName?: string;
    serviceName?: string;
  }>();
  const { toast, showError, showSuccess, hideToast } = useToast();

  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('processing');
  const [pin, setPin] = useState(['', '', '', '']);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<{
    message: string;
    isInsufficientBalance: boolean;
  } | null>(null);
  const pinInputRefs = useRef<TextInput[]>([]);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const amount = params.amount ? parseFloat(params.amount) : 0;
  const hasEnoughBalance = balance >= amount && amount > 0;

  const loadBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const wallet = await walletService.getWallet();
      const b = typeof wallet.balance === 'number' ? wallet.balance : parseFloat(String(wallet.balance)) || 0;
      setBalance(b);
    } catch (error) {
      if (__DEV__) console.error('Error loading balance:', error);
      setBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [loadBalance])
  );

  const handlePayNow = () => {
    setPaymentError(null);
    setShowPinModal(true);
    setPin(['', '', '', '']);
    setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
  };

  const handlePinChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 1) {
      const newPin = [...pin];
      newPin[index] = numericValue;
      setPin(newPin);
      if (numericValue && index < 3) pinInputRefs.current[index + 1]?.focus();
      if (index === 3 && numericValue) handleProcessPayment(newPin.join(''));
    }
  };

  const handlePinKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleProcessPayment = async (pinValue: string) => {
    if (!pinValue || pinValue.length !== 4 || !/^\d{4}$/.test(pinValue)) {
      showError('Please enter a valid 4-digit PIN.');
      return;
    }
    if (!params.requestId || !params.amount) {
      showError('Missing payment information. Please try again.');
      return;
    }
    const requestId = parseInt(params.requestId, 10);
    const amountNum = parseFloat(params.amount);
    if (isNaN(requestId) || isNaN(amountNum) || amountNum <= 0) {
      showError('Invalid payment information.');
      return;
    }

    setIsProcessingPayment(true);
    setShowPinModal(false);
    setShowProcessingModal(true);
    setPaymentStep('processing');

    try {
      const response = await walletService.payForService({
        requestId,
        amount: amountNum,
        pin: pinValue,
      });

      setTimeout(() => { setPaymentStep('verifying'); haptics.light(); }, 1500);
      setTimeout(() => { setPaymentStep('completing'); haptics.light(); }, 3000);
      setTimeout(() => { setPaymentStep('success'); haptics.success(); }, 4000);
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
      const isPinError = /pin|wrong pin|invalid pin|pin not set/i.test(errorMessage);
      if (isPinError) {
        haptics.error();
        showError('PIN is incorrect or not set. Please create or update your PIN.');
        setTimeout(() => {
          router.push({
            pathname: '/CreatePINScreen' as any,
            params: {
              returnTo: '/ConfirmWalletPaymentScreen',
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

      const errorMsg = getSpecificErrorMessage(error, 'pay_for_service') || errorMessage || 'Payment failed. Please try again.';
      const isInsufficientBalance = /insufficient|balance/i.test(errorMessage) || /insufficient|balance/i.test(errorMsg);
      haptics.error();
      showError(errorMsg);
      setPaymentError({
        message: isInsufficientBalance
          ? 'Insufficient wallet balance. Please top up your wallet to continue.'
          : errorMsg,
        isInsufficientBalance,
      });
    }
  };

  const handleCancelPin = () => {
    setShowPinModal(false);
    setPin(['', '', '', '']);
    setPaymentError(null);
  };

  const goToTopUp = () => {
    haptics.light();
    router.push({
      pathname: '/TopUpScreen' as any,
      params: {
        returnTo: '/ConfirmWalletPaymentScreen',
        returnParams: JSON.stringify({
          requestId: params.requestId,
          amount: params.amount,
          quotationId: params.quotationId,
          providerName: params.providerName,
          serviceName: params.serviceName,
        }),
      },
    } as any);
  };

  useEffect(() => {
    if (showProcessingModal && paymentStep !== 'success') {
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [showProcessingModal, paymentStep]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const stepMessages: Record<PaymentStep, { title: string; subtitle: string }> = {
    processing: { title: 'Processing Payment', subtitle: 'Please wait while we process your payment...' },
    verifying: { title: 'Verifying Payment', subtitle: 'Confirming transaction details...' },
    completing: { title: 'Completing Transaction', subtitle: 'Finalizing your payment...' },
    success: { title: 'Payment Successful!', subtitle: 'Your payment has been processed successfully' },
  };
  const stepMessage = stepMessages[paymentStep];

  return (
    <SafeAreaWrapper>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          Pay from Wallet
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner */}
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
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Poppins-Regular', color: Colors.textPrimary }}>
                {paymentError.message}
              </Text>
              <TouchableOpacity onPress={() => setPaymentError(null)} style={{ padding: 4 }}>
                <X size={18} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
            </View>
            {paymentError.isInsufficientBalance && (
              <TouchableOpacity
                onPress={goToTopUp}
                style={{
                  marginTop: 12,
                  backgroundColor: Colors.accent,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                  Top Up Wallet
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Balance & amount card */}
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: 20,
            padding: 24,
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} color={Colors.white} />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.7)' }}>
                Wallet Balance
              </Text>
              {isLoadingBalance ? (
                <ActivityIndicator size="small" color={Colors.white} style={{ marginTop: 4 }} />
              ) : (
                <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.white }}>
                  ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              )}
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 16 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              Amount to pay
            </Text>
            <Text style={{ fontSize: 24, fontFamily: 'Poppins-Bold', color: Colors.white }}>
              ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Insufficient balance */}
        {!isLoadingBalance && !hasEnoughBalance && amount > 0 && (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: BorderRadius.md,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.error, marginBottom: 8 }}>
              Insufficient Balance
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: Colors.textPrimary, marginBottom: 16 }}>
              You need ₦{(amount - balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })} more to complete this payment. Top up your wallet to continue.
            </Text>
            <TouchableOpacity
              onPress={goToTopUp}
              style={{
                backgroundColor: Colors.accent,
                paddingVertical: 14,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                Top Up Wallet
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pay Now - only when sufficient balance */}
        {!isLoadingBalance && hasEnoughBalance && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={16} color={Colors.textSecondaryDark} />
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginLeft: 8 }}>
                Secure payment - amount will be deducted from your wallet
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePayNow}
              style={{
                backgroundColor: Colors.black,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                Pay ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Now
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Processing Modal */}
      <Modal visible={showProcessingModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: 20, padding: 32, alignItems: 'center', minWidth: 300 }}>
            {paymentStep === 'success' ? (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle size={48} color={Colors.accent} />
              </View>
            ) : (
              <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 20 }}>
                <RefreshCw size={64} color={Colors.accent} />
              </Animated.View>
            )}
            <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 6 }}>{stepMessage.title}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center' }}>{stepMessage.subtitle}</Text>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide" onRequestClose={handleCancelPin}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingTop: 24, paddingBottom: 40, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>Enter Wallet PIN</Text>
              <TouchableOpacity onPress={handleCancelPin} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginBottom: 24, textAlign: 'center' }}>
              Enter your 4-digit wallet PIN to confirm payment
            </Text>
            <View style={{ backgroundColor: Colors.backgroundGray, borderRadius: BorderRadius.default, padding: 16, marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginBottom: 4 }}>Payment Amount</Text>
              <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
                ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
              {[0, 1, 2, 3].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { if (ref) pinInputRefs.current[index] = ref; }}
                  value={pin[index]}
                  onChangeText={(v) => handlePinChange(v, index)}
                  onKeyPress={({ nativeEvent }) => handlePinKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  style={{
                    flex: 1,
                    height: 56,
                    borderWidth: 2,
                    borderColor: pin[index] ? Colors.accent : Colors.border,
                    borderRadius: BorderRadius.default,
                    textAlign: 'center',
                    fontSize: 24,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                  textContentType="none"
                  autoComplete="off"
                />
              ))}
            </View>
            {isProcessingPayment && (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 8 }}>Processing payment...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
    </SafeAreaWrapper>
  );
}
