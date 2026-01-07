import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, Download, FileText, Share2 } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

export default function ProviderReceiptScreen() {
  const router = useRouter();

  const receiptData = {
    receiptNumber: 'RCP-2024-001547',
    jobTitle: 'Kitchen pipe leak repair',
    clientName: 'Lawal Johnson',
    serviceDate: 'October 20, 2024',
    serviceTime: '2:00 PM - 4:30 PM',
    laborCost: 450.00,
    materials: [
      { name: 'Pipe Connector', quantity: 1, price: 450.00 },
      { name: "Plumber's Tape", quantity: 3, price: 150.00 },
    ],
    platformFee: 25.00,
    totalAmount: 1075.00,
    paymentStatus: 'Paid',
    paymentDate: 'Oct 20, 2024 at 4:45 PM',
  };

  const materialTotal = receiptData.materials.reduce(
    (sum, mat) => sum + mat.price * mat.quantity,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download', 'Receipt will be downloaded shortly.');
  };

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        message: `Job Receipt\nReceipt Number: ${receiptData.receiptNumber}\nTotal Amount: ₦${formatCurrency(receiptData.totalAmount)}`,
        title: 'Job Receipt',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
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
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
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
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Receipt
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 100,
          }}
        >
          {/* Receipt Card */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {/* Receipt Header */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <FileText size={28} color={Colors.white} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Job Receipt
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Receipt #{receiptData.receiptNumber}
              </Text>
            </View>

            {/* Job Details */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Job Details
              </Text>
              <View
                style={{
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                  padding: 12,
                }}
              >
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 2,
                    }}
                  >
                    Job Title
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {receiptData.jobTitle}
                  </Text>
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 2,
                    }}
                  >
                    Client
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {receiptData.clientName}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 2,
                    }}
                  >
                    Service Date & Time
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {receiptData.serviceDate} • {receiptData.serviceTime}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 10,
                }}
              >
                Cost Breakdown
              </Text>

              <View style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    Labor Cost:
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    ₦{formatCurrency(receiptData.laborCost)}
                  </Text>
                </View>
              </View>

              {receiptData.materials.map((material, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      {material.name} (Qty: {material.quantity}):
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                      }}
                    >
                      ₦{formatCurrency(material.price * material.quantity)}
                    </Text>
                  </View>
                </View>
              ))}

              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: Colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    Platform Fee:
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    ₦{formatCurrency(receiptData.platformFee)}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 2,
                  borderTopColor: Colors.accent,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    Total Amount:
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.accent,
                    }}
                  >
                    ₦{formatCurrency(receiptData.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Status */}
            <View
              style={{
                backgroundColor: Colors.successLight,
                borderRadius: BorderRadius.default,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.success,
                  }}
                >
                  Payment Status: {receiptData.paymentStatus}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  {receiptData.paymentDate}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleDownloadReceipt}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: BorderRadius.xl,
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
                Download PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareReceipt}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
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
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
