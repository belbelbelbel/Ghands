import { QuotationCardSkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { ProviderQuotationListItem, providerService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'accepted':
      return {
        color: '#16A34A',
        bgColor: '#DCFCE7',
        icon: CheckCircle2,
        label: 'Accepted',
      };
    case 'rejected':
      return {
        color: '#DC2626',
        bgColor: '#FEE2E2',
        icon: XCircle,
        label: 'Rejected',
      };
    case 'pending':
    default:
      return {
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: Clock,
        label: 'Pending',
      };
  }
};

export default function ProviderQuotationsScreen() {
  const router = useRouter();
  const { toast, showError, hideToast } = useToast();
  const [quotations, setQuotations] = useState<ProviderQuotationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await providerService.getProviderQuotations();
      setQuotations(data);
    } catch (error: any) {
      const errorMessage = getSpecificErrorMessage(error, 'get_provider_quotations');
      showError(errorMessage);
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      loadQuotations();
    }, [loadQuotations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await loadQuotations();
    setRefreshing(false);
    haptics.success();
  }, [loadQuotations]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      if (activeFilter === 'all') return true;
      return quote.status === activeFilter;
    });
  }, [quotations, activeFilter]);

  const renderQuotationCard = useCallback((quotation: ProviderQuotationListItem) => {
    const statusConfig = getStatusConfig(quotation.status);
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        key={quotation.id}
        activeOpacity={0.7}
        onPress={() => {
          haptics.light();
          router.push({
            pathname: '/ProviderJobDetailsScreen',
            params: { requestId: quotation.requestId.toString() },
          } as any);
        }}
        style={{
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.xl,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        {/* Header: Request Info & Status */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {quotation.request?.jobTitle || `Request #${quotation.requestId}`}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
              }}
              numberOfLines={1}
            >
              {quotation.user?.firstName} {quotation.user?.lastName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusConfig.bgColor,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: BorderRadius.xl,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <StatusIcon size={14} color={statusConfig.color} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-SemiBold',
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Quotation Details */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 2,
              }}
            >
              Total Amount
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
              }}
            >
              ₦{formatCurrency(quotation.total)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 2,
              }}
            >
              Sent
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Medium',
                color: Colors.textPrimary,
              }}
            >
              {formatDate(quotation.sentAt)}
            </Text>
          </View>
        </View>

        {/* Accepted/Rejected Date */}
        {quotation.status === 'accepted' && quotation.acceptedAt && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}
          >
            <CheckCircle2 size={14} color="#16A34A" style={{ marginRight: 6 }} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Medium',
                color: '#16A34A',
              }}
            >
              Accepted on {formatDate(quotation.acceptedAt)}
            </Text>
          </View>
        )}

        {quotation.status === 'rejected' && quotation.rejectedAt && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}
          >
            <XCircle size={14} color="#DC2626" style={{ marginRight: 6 }} />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Medium',
                color: '#DC2626',
              }}
            >
              Rejected on {formatDate(quotation.rejectedAt)}
            </Text>
          </View>
        )}

        {/* View Details Arrow */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins-SemiBold',
              color: Colors.accent,
              marginRight: 4,
            }}
          >
            View Details
          </Text>
          <ArrowRight size={14} color={Colors.accent} />
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        {/* Header - Title Only (No back arrow or icon since it's a tab) */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            backgroundColor: Colors.white,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
            }}
          >
            My Quotations
          </Text>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: Colors.white,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const filterLabels: Record<typeof filter, string> = {
              all: 'All',
              pending: 'Pending',
              accepted: 'Accepted',
              rejected: 'Rejected',
            };

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  haptics.selection();
                  setActiveFilter(filter);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: BorderRadius.default,
                  backgroundColor: isActive ? Colors.accent : 'transparent',
                  alignItems: 'center',
                  marginRight: filter !== 'rejected' ? 8 : 0,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isActive ? 'Poppins-SemiBold' : 'Poppins-Medium',
                    color: isActive ? Colors.white : Colors.textSecondaryDark,
                  }}
                >
                  {filterLabels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
        >
          {isLoading && quotations.length === 0 ? (
            <>
              <QuotationCardSkeleton />
              <QuotationCardSkeleton />
              <QuotationCardSkeleton />
            </>
          ) : filteredQuotations.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 60,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                marginTop: 20,
              }}
            >
              <FileText size={48} color={Colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                No quotations found
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                {activeFilter === 'all'
                  ? "You haven't sent any quotations yet. Start accepting requests and send quotations to get started."
                  : `No ${activeFilter} quotations found.`}
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                  marginBottom: 12,
                }}
              >
                {filteredQuotations.length} {filteredQuotations.length === 1 ? 'quotation' : 'quotations'}
              </Text>
              {filteredQuotations.map((quotation) => (
                <React.Fragment key={quotation.id}>
                  {renderQuotationCard(quotation)}
                </React.Fragment>
              ))}
            </>
          )}
        </ScrollView>
      </View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
