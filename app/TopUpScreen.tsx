import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedModal from '@/components/AnimatedModal';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Lock, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';

const PRESET_AMOUNTS = [12, 24, 36];

export default function TopUpScreen() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(12);
  const [customAmount, setCustomAmount] = useState<string>('12');
  const [balance] = useState(12847.50);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numericValue);
    if (numericValue && !isNaN(parseFloat(numericValue))) {
      setSelectedAmount(parseFloat(numericValue));
    }
  };

  const handleContinue = () => {
    // Navigate to payment method selection or process payment
    router.push('/PaymentMethodsScreen' as any);
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
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
            fontSize: 24,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
            flex: 1,
            textAlign: 'center',
          }}
        >
          Top Up
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Current Balance Section */}
        <View
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 32,
            position: 'relative',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 8,
            }}
          >
            Current balance
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
            >
              ₦{balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Wallet size={24} color={Colors.textSecondaryDark} />
          </View>
        </View>

        {/* Choose Amount to Add Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Choose Amount to Add
          </Text>

          {/* Preset Amount Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {PRESET_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  onPress={() => handleAmountSelect(amount)}
                  style={{
                    flex: 1,
                    backgroundColor: isSelected
                      ? Colors.accent
                      : Colors.backgroundGray,
                    borderRadius: BorderRadius.default,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: isSelected ? Colors.white : Colors.textPrimary,
                    }}
                  >
                    ₦{amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <View
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.lg,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <TextInput
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
              placeholderTextColor={Colors.textSecondaryDark}
            />
          </View>
        </View>

        {/* Select Payment Method Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Select Payment Method
          </Text>

          {/* Bank Transfer Option */}
          <TouchableOpacity
            onPress={() => {
              setShowBankTransferModal(true);
            }}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.lg,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              Bank Transfer
            </Text>
            <ChevronRight size={20} color={Colors.textSecondaryDark} />
          </TouchableOpacity>

          {/* Card Option */}
          <TouchableOpacity
            onPress={() => {
              // Navigate to card payment screen
              router.push('/PaymentMethodsScreen' as any);
            }}
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.lg,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              Card
            </Text>
            <ChevronRight size={20} color={Colors.textSecondaryDark} />
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          disabled={!selectedAmount || selectedAmount <= 0}
        />
      </ScrollView>

      {/* Bank Transfer Modal */}
      <AnimatedModal
        visible={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
        animationType="slide"
      >
        <View>
          {/* Modal Header */}
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
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                flex: 1,
                textAlign: 'center',
              }}
            >
              Account details
            </Text>
            <TouchableOpacity
              onPress={() => setShowBankTransferModal(false)}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Number */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Account Number
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                2219300511
              </Text>
            </View>
          </View>

          {/* Amount Due */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Amount Due
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                ₦{parseFloat(customAmount || selectedAmount.toString()).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Account Name */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Account Name
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                BAMCHURCH LTD
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginBottom: 8,
              }}
            >
              Payment method
            </Text>
            <View
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                Transfer
              </Text>
            </View>
          </View>

          {/* Secure Payment */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Lock size={16} color={Colors.textSecondaryDark} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textSecondaryDark,
                marginLeft: 8,
              }}
            >
              Secure Payment
            </Text>
          </View>

          {/* I have paid Button */}
          <Button
            title="I have paid"
            onPress={() => {
              Alert.alert(
                'Payment Confirmation',
                'Have you completed the bank transfer?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Yes, I have paid',
                    onPress: () => {
                      Alert.alert('Success', 'Your payment is being processed. You will receive a confirmation shortly.');
                      setShowBankTransferModal(false);
                    },
                  },
                ]
              );
            }}
            variant="secondary"
            size="large"
            fullWidth
            style={{
              backgroundColor: Colors.black,
            }}
          />
        </View>
      </AnimatedModal>
    </SafeAreaWrapper>
  );
}

