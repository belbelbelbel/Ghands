import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, FileText, Share2 } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Share, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import {
  providerService,
  serviceRequestService,
  type Quotation,
  type ProviderQuotationListItem,
  type ServiceRequest,
} from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorMessages';

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
  const { showError, showSuccess } = useToast();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load receipt data from API (tolerant: singular quotation endpoint often 404s; use list + request fallback)
  const loadReceiptData = useCallback(async () => {
    if (!params.requestId) {
      setIsLoading(false);
      return;
    }

    const parseMoney = (v: unknown): number => {
      if (v == null) return 0;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      if (typeof v === 'string') {
        const n = parseFloat(String(v).replace(/[₦$,\s]/g, '').trim());
        return Number.isNaN(n) ? 0 : n;
      }
      return 0;
    };

    const isQuotationEmpty = (q: Quotation | null): boolean =>
      !q ||
      (q.total === 0 && q.laborCost === 0 && !(q.materials?.length));

    const quotationFromListItem = (pick: any, requestId: number): Quotation => ({
      id: Number(pick.id) || 0,
      requestId,
      laborCost: parseMoney(pick.laborCost),
      logisticsCost: parseMoney(pick.logisticsCost),
      materials: Array.isArray(pick.materials) ? pick.materials : [],
      findingsAndWorkRequired: pick.findingsAndWorkRequired || '',
      serviceCharge: parseMoney(pick.serviceCharge),
      tax: parseMoney(pick.tax),
      total: parseMoney(pick.total),
      status: pick.status || 'pending',
      sentAt: pick.sentAt || new Date().toISOString(),
      acceptedAt: pick.acceptedAt ?? null,
      rejectedAt: pick.rejectedAt ?? null,
      message: pick.message,
    });

    const requestFromProviderQuotationItem = (
      item: ProviderQuotationListItem
    ): ServiceRequest => {
      const r = item.request;
      const st = String(r?.status || 'completed').toLowerCase();
      const allowed: ServiceRequest['status'][] = [
        'pending',
        'accepted',
        'inspecting',
        'quoting',
        'scheduled',
        'in_progress',
        'reviewing',
        'completed',
        'cancelled',
      ];
      const status = (allowed.includes(st as ServiceRequest['status'])
        ? st
        : 'completed') as ServiceRequest['status'];
      return {
        id: r.id,
        categoryName: '',
        jobTitle: r.jobTitle || 'Service Request',
        description: r.description || '',
        status,
        createdAt: item.sentAt,
        updatedAt: item.sentAt,
        user: item.user as ServiceRequest['user'],
      };
    };

    try {
      setIsLoading(true);
      const requestId = parseInt(params.requestId, 10);
      if (isNaN(requestId)) {
        throw new Error('Invalid request ID');
      }

      let request: ServiceRequest | null = null;
      let quotationFromProviderRow: Quotation | null = null;

      try {
        request = await serviceRequestService.getRequestDetails(requestId);
      } catch {
        request = null;
      }

      if (!request) {
        request = await providerService.getAcceptedRequestById(requestId);
      }

      if (!request) {
        const quoteItem = await providerService.getQuotationListItemForRequest(requestId);
        if (quoteItem) {
          request = requestFromProviderQuotationItem(quoteItem);
          quotationFromProviderRow = quotationFromListItem(quoteItem, requestId);
        }
      }

      if (!request) {
        throw new Error(
          'Could not load this receipt. Your session is fine — the server had trouble returning job details. Pull to refresh or try again shortly.'
        );
      }

      let quotation: Quotation | null = quotationFromProviderRow;

      if (!quotation) {
        try {
          quotation = await providerService.getQuotation(requestId);
        } catch {
          quotation = null;
        }
      }

      if (isQuotationEmpty(quotation)) {
        try {
          const list = await serviceRequestService.getQuotations(requestId);
          const pick =
            list.find((q) => q.status === 'accepted') ||
            list.find((q) => q.status === 'pending') ||
            list[0];
          if (pick) {
            quotation = quotationFromListItem(pick, requestId);
          }
        } catch {
          /* keep previous quotation or null */
        }
      }

      if (isQuotationEmpty(quotation) && quotationFromProviderRow) {
        quotation = quotationFromProviderRow;
      }

      const rawRequest = request as any;
      const totalFromRequest =
        parseMoney(rawRequest.totalCost) ||
        parseMoney(rawRequest.total_amount) ||
        parseMoney(rawRequest.paymentAmount) ||
        parseMoney(rawRequest.amount);

      // Format dates
      const serviceDate = request.scheduledDate
        ? formatDate(new Date(request.scheduledDate), 'MMMM dd, yyyy')
        : request.createdAt
          ? formatDate(new Date(request.createdAt), 'MMMM dd, yyyy')
          : 'N/A';

      const serviceTime = request.scheduledTime || 'N/A';

      const paymentDate = quotation?.acceptedAt
        ? formatDate(new Date(quotation.acceptedAt), "MMM dd, yyyy 'at' h:mm a")
        : quotation?.sentAt
          ? formatDate(new Date(quotation.sentAt), "MMM dd, yyyy 'at' h:mm a")
          : rawRequest.updatedAt
            ? formatDate(new Date(rawRequest.updatedAt), "MMM dd, yyyy 'at' h:mm a")
            : 'N/A';

      const materials = (quotation?.materials || []).map((mat) => ({
        name: mat.name || 'Material',
        quantity: mat.quantity || 0,
        price: mat.unitPrice || 0,
      }));

      const laborCost = quotation?.laborCost ?? 0;
      const platformFee = quotation?.serviceCharge ?? 0;
      const tax = quotation?.tax ?? 0;
      let totalAmount = quotation?.total ?? 0;
      if (totalAmount <= 0 && totalFromRequest > 0) {
        totalAmount = totalFromRequest;
      }

      let paymentStatus = 'Details unavailable';
      if (quotation) {
        paymentStatus =
          quotation.status === 'accepted' ? 'Paid' : quotation.status === 'pending' ? 'Pending' : 'Unpaid';
      } else if (request.status === 'completed') {
        paymentStatus = 'Completed';
      }

      const clientFirst = rawRequest.user?.firstName || rawRequest.client?.firstName;
      const clientLast = rawRequest.user?.lastName || rawRequest.client?.lastName;
      const clientFromUser = [clientFirst, clientLast].filter(Boolean).join(' ').trim();

      const receipt: ReceiptData = {
        receiptNumber: `RCP-${requestId}-${Date.now().toString().slice(-6)}`,
        jobTitle: request.jobTitle || request.description || 'Service Request',
        clientName:
          rawRequest.clientName ||
          rawRequest.client?.name ||
          clientFromUser ||
          'Client',
        serviceDate,
        serviceTime,
        laborCost,
        materials,
        platformFee,
        tax,
        totalAmount,
        paymentStatus,
        paymentDate,
      };

      setReceiptData(receipt);
    } catch (error: any) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('Receipt load failed:', error?.message || error);
      }
      showError(getErrorMessage(error, 'Failed to load receipt data. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [params.requestId]);

  useEffect(() => {
    loadReceiptData();
  }, [loadReceiptData]);

  const materialTotal = (receiptData?.materials ?? []).reduce(
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
    showSuccess('Receipt will be downloaded shortly.');
  };

  const handleShareReceipt = async () => {
    if (!receiptData) return;
    try {
      await Share.share({
        message: `Job Receipt\nReceipt Number: ${receiptData.receiptNumber}\nTotal Amount: ₦${formatCurrency(receiptData.totalAmount)}`,
        title: 'Job Receipt',
      });
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to share receipt'));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ marginTop: 12, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark }}>
            Loading receipt...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!receiptData) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <FileText size={44} color={Colors.textTertiary} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            Unable to load receipt
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setReceiptData(null);
              setIsLoading(true);
              loadReceiptData();
            }}
            style={{
              marginTop: 18,
              backgroundColor: Colors.accent,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: 'Poppins-SemiBold', color: Colors.white }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

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
