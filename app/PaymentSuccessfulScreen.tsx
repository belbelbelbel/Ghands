import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Download, Lock, Share2, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Share, Alert, Image } from 'react-native';
import { Button } from '@/components/ui/Button';

export default function PaymentSuccessfulScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    transactionId?: string;
    providerName?: string;
    serviceName?: string;
  }>();

  const transactionData = {
    transactionId: params.transactionId || 'TXN-2024-001547',
    jobTitle: params.serviceName || 'Pipe Repair & Installation',
    providerName: params.providerName || 'Elite Plumbing Services',
    serviceDate: 'December 15, 2024',
    serviceTime: '2:30 PM - 5:45 PM',
    serviceFee: '450.00',
    platformFee: '25.00',
    tax: '10.00',
    totalAmount: '485.00',
    paymentMethod: 'Credit Card •••• 4532',
    paymentDate: 'Dec 15, 2024 at 6:12 PM',
  };

  const handleDownloadReceipt = () => {
    // Handle PDF download
    Alert.alert('Download', 'Receipt will be downloaded shortly.');
  };

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        message: `Payment Receipt\nTransaction ID: ${transactionData.transactionId}\nAmount: ₦${transactionData.totalAmount}`,
        title: 'Payment Receipt',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
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
        {/* App Branding Section - Full Vertical Splash Screen Style */}
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            paddingVertical: 20,
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{
              width: 80,
              height: 80,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 6,
            }}
          >
            G-Hands
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              textAlign: 'center',
            }}
          >
            Professional Service Platform
          </Text>
        </View>
        {/* Payment Successful Card */}
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CheckCircle size={32} color={Colors.accent} />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Payment Successful
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
              }}
            >
              Your payment has been processed
            </Text>
          </View>

          {/* Service Details */}
          <View
            style={{
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                  marginBottom: 4,
                }}
              >
                Job Title
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {transactionData.jobTitle}
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                  marginBottom: 4,
                }}
              >
                Service Provider
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {transactionData.providerName}
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                  marginBottom: 4,
                }}
              >
                Service Date
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {transactionData.serviceDate}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                  marginBottom: 4,
                }}
              >
                Service Time
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {transactionData.serviceTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Details Card */}
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Payment Details
          </Text>
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
              Tax (8%)
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              ₦{transactionData.tax}
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

        {/* Transaction Information Card */}
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Transaction Information
          </Text>
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
              Payment Date
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              {transactionData.paymentDate}
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
              Status
            </Text>
            <View
              style={{
                backgroundColor: '#DCFCE7',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                }}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={handleDownloadReceipt}
            style={{
              flex: 1,
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.default,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Download size={18} color={Colors.white} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginLeft: 8,
              }}
            >
              Download PDF Receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShareReceipt}
            style={{
              flex: 1,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={Colors.accent} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.accent,
                marginLeft: 8,
              }}
            >
              Share Receipt
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.lg,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              marginBottom: 8,
            }}
          >
            Need help with this transaction?
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/SupportScreen' as any)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.accent,
              }}
            >
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

