import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { haptics } from '@/hooks/useHaptics';
import { Colors } from '@/lib/designSystem';
import type { QuotationWithProvider, ServiceRequest } from '@/services/api';

type TimelineHeaderData = {
  title: string;
  subtitle?: string;
  statusPill?: string;
  pillBg?: string;
  pillText?: string;
  timestamp?: string | null;
  provider?: any;
  showPayButton?: boolean;
  payAmount?: number;
  acceptedQuotation?: any;
};

type MappedProviderSummary = {
  providerId: number;
  distanceKm?: number;
  minutesAway?: number;
};

type TimelineStatusCardProps = {
  header: TimelineHeaderData;
  quotations: QuotationWithProvider[] | any[];
  acceptedProviders: any[];
  mappedProviders: MappedProviderSummary[];
  request: ServiceRequest | null;
  requestId?: string | string[];
};

const TimelineStatusCardComponent = ({
  header,
  quotations,
  acceptedProviders,
  mappedProviders,
  request,
  requestId,
}: TimelineStatusCardProps) => {
  const router = useRouter();

  const { shouldHide, isQuotationPending } = useMemo(() => {
    const qList = Array.isArray(quotations) ? quotations : [];
    const hasQ = qList.some((q: any) => {
      if (!q || typeof q !== 'object') return false;
      if (q.sentAt || q.submittedAt) return true;
      if (q.status && q.status !== 'draft') return true;
      if (q.total != null && q.total > 0) return true;
      return false;
    });

    const isQuotationPendingValue = (acceptedProviders?.length || 0) > 0 && !hasQ;

    const isQuotationReceivedHeader =
      (header as any).title === 'Quotation received' && hasQ;

    return {
      shouldHide: isQuotationReceivedHeader,
      isQuotationPending: isQuotationPendingValue,
    };
  }, [quotations, acceptedProviders, header]);

  if (!header || shouldHide) {
    return null;
  }

  const provider = (header as any).provider;
  const pillBg = (header as any).pillBg ?? (provider ? '#FEF9C3' : '#F3F4F6');
  const pillText = (header as any).pillText ?? (provider ? '#92400E' : '#6B7280');
  const statusPill =
    (header as any).statusPill ?? (provider ? 'Provider accepted' : 'Pending');

  const normalizedRequestId =
    typeof requestId === 'string' ? requestId : requestId?.[0];

  const handlePressProvider = () => {
    if (!provider) return;
    haptics.light();
    router.push({
      pathname: '/ProviderDetailScreen',
      params: {
        providerName: provider?.name,
        providerId: provider?.id?.toString(),
      },
    } as any);
  };

  const handlePressChat = () => {
    if (!provider) return;
    haptics.light();
    router.push({
      pathname: '/ChatScreen',
      params: {
        providerName: provider?.name,
        providerId: provider?.id?.toString(),
        requestId: normalizedRequestId,
      },
    } as any);
  };

  const handlePressPay = () => {
    if (!(header as any).showPayButton || !(header as any).payAmount || !(header as any).acceptedQuotation) {
      return;
    }
    haptics.light();
    const quote = (header as any).acceptedQuotation;
    router.push({
      pathname: '/ConfirmWalletPaymentScreen' as any,
      params: {
        requestId: normalizedRequestId,
        amount: String((header as any).payAmount),
        quotationId: quote?.id?.toString(),
        providerName: quote?.provider?.name || 'Service Provider',
        serviceName: request?.jobTitle || 'Service Request',
        paymentType: 'service' as const,
      },
    } as any);
  };

  const providerSummary =
    provider &&
    (mappedProviders.find(m => m.providerId === provider.id) ?? mappedProviders[0]);

  return (
    <View
      style={{
        marginBottom: isQuotationPending ? 8 : 24,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
      }}
    >
      <View className="px-5 pt-5 pb-2">
        {provider ? (
          <View className="flex-row items-start">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePressProvider}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../assets/images/plumbericon2.png')}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-base text-black mb-1"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  {provider?.name || 'Professional Service Provider'}
                </Text>
                {providerSummary?.distanceKm != null && (
                  <Text
                    className="text-xs text-gray-400 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {providerSummary.distanceKm.toFixed(1)} km away • ~
                    {providerSummary.minutesAway} min
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={handlePressChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: pillBg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-SemiBold',
                  color: pillText,
                }}
              >
                {statusPill}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-end">
            <View
              style={{
                backgroundColor: pillBg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-SemiBold',
                  color: pillText,
                }}
              >
                {statusPill}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View className="px-5 mt-2 mb-5">
        <View
          style={{
            backgroundColor: '#E0F2FE',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 6,
            }}
          >
            {header.title}
          </Text>
          {header.subtitle ? (
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: '#374151',
                lineHeight: 21,
              }}
            >
              {header.subtitle}
            </Text>
          ) : null}
          {(header as any).timestamp ? (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: '#6B7280',
                marginTop: 8,
              }}
            >
              {(header as any).timestamp}
            </Text>
          ) : null}
          {(header as any).showPayButton && (header as any).payAmount > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePressPay}
              style={{
                marginTop: 14,
                backgroundColor: Colors.accent,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                }}
              >
                Pay Now (₦
                {(((header as any).payAmount || 0) as number).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                )
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const TimelineStatusCard = React.memo(TimelineStatusCardComponent);

export default TimelineStatusCard;

