import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';

export default function BankTransferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const amount = params.amount || '85,000';

  const [accountNumber] = useState('2219300511');
  const [accountName] = useState('BAMCHURCH LTD');
  const [paymentMethod] = useState('Transfer');
  const [amountDue] = useState(`₦${amount}`);

  const handleIHavePaid = () => {
    Alert.alert(
      'Payment Confirmation',
      'Have you completed the bank transfer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I have paid',
          onPress: () => {
            // Handle payment confirmation
            Alert.alert('Success', 'Your payment is being processed. You will receive a confirmation shortly.');
            router.back();
          },
        },
      ]
    );
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
          Account details
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
        {/* Account Number */}
        <View style={{ marginBottom: 20 }}>
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
              {accountNumber}
            </Text>
          </View>
        </View>

        {/* Amount Due */}
        <View style={{ marginBottom: 20 }}>
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
              {amountDue}
            </Text>
          </View>
        </View>

        {/* Account Name */}
        <View style={{ marginBottom: 20 }}>
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
              {accountName}
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
              {paymentMethod}
            </Text>
          </View>
        </View>

        {/* Secure Payment */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
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
          onPress={handleIHavePaid}
          variant="secondary"
          size="large"
          fullWidth
          style={{
            backgroundColor: Colors.black,
          }}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

