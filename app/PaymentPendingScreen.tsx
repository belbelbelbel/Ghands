import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Hourglass, Lock, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';

export default function PaymentPendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    transactionId?: string;
    amount?: string;
    providerName?: string;
  }>();

  const transactionData = {
    transactionId: params.transactionId || 'TXN-2024-001547',
    totalPayment: params.amount || '125,000',
    initiatedDate: 'May 2025',
    providerName: params.providerName || "John's Plumbing",
    serviceFee: '450.00',
    platformFee: '25.00',
    totalAmount: '485.00',
    paymentMethod: '**** **** **** 4532',
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
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Payment Pending Status */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.backgroundGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Hourglass size={40} color={Colors.textSecondaryDark} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Payment Pending
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              textAlign: 'center',
              lineHeight: 20,
              paddingHorizontal: 20,
            }}
          >
            Your payment is held securely and will be released to the provider once you mark the job as complete.
          </Text>
        </View>

        {/* Payment Summary Card */}
        <View
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 20,
          }}
        >
          {/* Total Payment */}
          <View
            style={{
              marginBottom: 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
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
              Total Payment
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 4,
              }}
            >
              ₦{transactionData.totalPayment}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
              }}
            >
              Initiated on {transactionData.initiatedDate}
            </Text>
          </View>

          {/* Service Provider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.black,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <User size={20} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {transactionData.providerName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Service Provider
              </Text>
            </View>
          </View>

          {/* Fee Breakdown */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Service Fee
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                ₦{transactionData.serviceFee}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Platform Fee
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                ₦{transactionData.platformFee}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                Total Amount
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                ₦{transactionData.totalAmount}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
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
                {transactionData.paymentMethod}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Transaction ID
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {transactionData.transactionId}
              </Text>
            </View>
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

        {/* Pay Now Button */}
        <Button
          title="Pay Now"
          onPress={() => {
            // Handle pay now action
            router.back();
          }}
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

