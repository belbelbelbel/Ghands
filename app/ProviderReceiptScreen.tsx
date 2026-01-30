import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, FileText, Share2 } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { providerService, serviceRequestService } from '@/services/api';

// Helper function to format dates
const formatDate = (date: Date, format: string = 'MMM dd, yyyy'): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  if (format.includes('MMMM')) {
    return format
      .replace('MMMM', fullMonths[month])
      .replace('dd', day.toString().padStart(2, '0'))
      .replace('yyyy', year.toString())
      .replace('MMM', months[month])
      .replace('MM', (month + 1).toString().padStart(2, '0'))
      .replace('h:mm a', `${displayHours}:${displayMinutes} ${period}`);
  }
  
  return format
    .replace('MMM', months[month])
    .replace('MM', (month + 1).toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('yyyy', year.toString())
    .replace('h:mm a', `${displayHours}:${displayMinutes} ${period}`);
};

interface ReceiptData {
  receiptNumber: string;
  jobTitle: string;
  clientName: string;
  serviceDate: string;
  serviceTime: string;
  laborCost: number;
  materials: Array<{ name: string; quantity: number; price: number }>;
  platformFee: number;
  tax: number;
  totalAmount: number;
  paymentStatus: string;
  paymentDate: string;
}

export default function ProviderReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load receipt data from API
  const loadReceiptData = useCallback(async () => {
    if (!params.requestId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const requestId = parseInt(params.requestId, 10);
      if (isNaN(requestId)) {
        throw new Error('Invalid request ID');
      }

      // Fetch request details and quotation in parallel
      const [request, quotation] = await Promise.all([
        serviceRequestService.getRequestDetails(requestId).catch(() => null),
        providerService.getQuotation(requestId).catch(() => null),
      ]);

      if (!request || !quotation) {
        throw new Error('Unable to load receipt data');
      }

      // Format dates
      const serviceDate = request.scheduledDate 
        ? formatDate(new Date(request.scheduledDate), 'MMMM dd, yyyy')
        : request.createdAt 
        ? formatDate(new Date(request.createdAt), 'MMMM dd, yyyy')
        : 'N/A';
      
      const serviceTime = request.scheduledTime || 'N/A';
      
      const paymentDate = quotation.acceptedAt
        ? formatDate(new Date(quotation.acceptedAt), 'MMM dd, yyyy \'at\' h:mm a')
        : quotation.sentAt
        ? formatDate(new Date(quotation.sentAt), 'MMM dd, yyyy \'at\' h:mm a')
        : 'N/A';

      // Calculate materials total
      const materials = (quotation.materials || []).map((mat) => ({
        name: mat.name || 'Material',
        quantity: mat.quantity || 0,
        price: mat.unitPrice || 0,
      }));

      // Build receipt data
      const receipt: ReceiptData = {
        receiptNumber: `RCP-${requestId}-${Date.now().toString().slice(-6)}`,
        jobTitle: request.jobTitle || request.description || 'Service Request',
        clientName: request.clientName || 'Client',
        serviceDate,
        serviceTime,
        laborCost: quotation.laborCost || 0,
        materials,
        platformFee: quotation.serviceCharge || 0,
        tax: quotation.tax || 0,
        totalAmount: quotation.total || 0,
        paymentStatus: quotation.status === 'accepted' ? 'Paid' : quotation.status === 'pending' ? 'Pending' : 'Unpaid',
        paymentDate,
      };

      setReceiptData(receipt);
    } catch (error: any) {
      console.error('Error loading receipt data:', error);
      Alert.alert('Error', 'Failed to load receipt data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [params.requestId]);

  useEffect(() => {
    loadReceiptData();
  }, [loadReceiptData]);

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
            paddingTop: 12,
            paddingBottom: 10,
            backgroundColor: Colors.white,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 16,
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
            paddingTop: 14,
            paddingBottom: 100,
          }}
        >
          {/* Receipt Card */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 14,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {/* Receipt Header */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <FileText size={22} color={Colors.white} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 3,
                }}
              >
                Job Receipt
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Receipt #{receiptData.receiptNumber}
              </Text>
            </View>

            {/* Job Details */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
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
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
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
                  marginTop: 10,
                  paddingTop: 10,
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
                      fontSize: 15,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    Total Amount:
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
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
                padding: 10,
                marginBottom: 14,
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
          <View style={{ gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleDownloadReceipt}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: BorderRadius.xl,
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Download size={16} color={Colors.white} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                  marginLeft: 6,
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
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
              }}
              activeOpacity={0.8}
            >
              <Share2 size={16} color={Colors.accent} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                  marginLeft: 6,
                }}
              >
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push({
                  pathname: '/ReportIssueScreen',
                  params: {
                    requestId: receiptData.receiptNumber,
                    jobTitle: receiptData.jobTitle,
                    orderNumber: receiptData.receiptNumber,
                    cost: `₦${formatCurrency(receiptData.totalAmount)}`,
                    assignee: receiptData.clientName,
                    completionDate: receiptData.paymentDate,
                  },
                } as any);
              }}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.error,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.error,
                }}
              >
                Report Issue
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
