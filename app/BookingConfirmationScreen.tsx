import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowRight, CheckCircle, CheckCircle2, FileText, Wrench, Circle } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View, RefreshControl, ActivityIndicator } from 'react-native';
import { serviceRequestService, profileService } from '@/services/api';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';

type ProgressStepStatus = 'completed' | 'in-progress' | 'pending';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: ProgressStepStatus;
  statusText: string;
  statusColor: string;
  icon?: any;
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffMinutes > 0) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    return 'Just now';
  } catch {
    return 'Recently';
  }
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    serviceType?: string;
    selectedDate?: string;
    selectedTime?: string;
    providerCount?: string;
  }>();
  const [animatedSteps, setAnimatedSteps] = useState<number[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [acceptedProviders, setAcceptedProviders] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const requestId = params.requestId ? parseInt(params.requestId, 10) : null;
    if (!requestId || isNaN(requestId)) {
      setIsLoading(false);
      return;
    }
    try {
      const [req, provs, quots] = await Promise.all([
        serviceRequestService.getRequestDetails(requestId),
        serviceRequestService.getAcceptedProviders(requestId),
        serviceRequestService.getQuotations(requestId),
      ]);
      setRequest(req);
      setAcceptedProviders(Array.isArray(provs) ? provs : []);
      setQuotations(Array.isArray(quots) ? quots : []);
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      setRequest(null);
      setAcceptedProviders([]);
      setQuotations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [params.requestId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await profileService.getCurrentUserProfile();
        const fn = profile?.firstName || profile?.data?.firstName || '';
        const ln = profile?.lastName || profile?.data?.lastName || '';
        setUserName(`${fn} ${ln}`.trim() || 'there');
      } catch {
        setUserName('there');
      }
    })();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const progressSteps = useMemo((): ProgressStep[] => {
    const providerCount = params.providerCount ? parseInt(params.providerCount, 10) : (request?.nearbyProviders?.length ?? acceptedProviders.length ?? 0);
    const totalSent = providerCount > 0 ? providerCount : (acceptedProviders.length || 0);
    const sentText = totalSent > 0
      ? `Sent to ${totalSent} nearby ${totalSent === 1 ? 'provider' : 'providers'}. They will respond shortly.`
      : 'Submitted. Nearby providers will be notified and can respond.';

    const hasAccepted = acceptedProviders.length > 0 || (request?.status && !['pending'].includes(request.status));
    const quotationCount = quotations.filter(q => q.sentAt || (q.status && q.status !== null)).length;
    const hasQuotationSent = quotationCount > 0;
    const quotationAccepted = quotations.some(q => q.status === 'accepted');
    const status = request?.status || 'pending';

    return [
      {
        id: 'step-1',
        title: 'Job Request Submitted',
        description: sentText,
        status: 'completed',
        statusText: `Completed - ${formatTimeAgo(request?.createdAt || new Date().toISOString())}`,
        statusColor: '#DCFCE7',
        icon: CheckCircle2,
      },
      {
        id: 'step-2',
        title: 'Inspection & Quotation',
        description: hasAccepted
          ? hasQuotationSent
            ? quotationCount > 0
              ? `${quotationCount} quotation${quotationCount === 1 ? '' : 's'} received. Review and accept to proceed.`
              : 'Provider sent a quotation. Review cost and details, then accept.'
            : 'Provider will inspect and send a quotation. You will receive it shortly.'
          : 'Waiting for providers to review and accept your request.',
        status: (hasAccepted && !quotationAccepted) ? 'in-progress' : quotationAccepted ? 'completed' : 'pending',
        statusText: quotationAccepted
          ? `Completed - ${formatTimeAgo(request?.updatedAt || '')}`
          : hasQuotationSent
            ? `In Progress - ${quotationCount} quotation${quotationCount === 1 ? '' : 's'} received`
            : hasAccepted
              ? 'In Progress'
              : 'Pending',
        statusColor: quotationAccepted ? '#DCFCE7' : (hasAccepted || hasQuotationSent) ? '#DBEAFE' : '#F3F4F6',
        icon: FileText,
      },
      {
        id: 'step-3',
        title: 'Work In Progress',
        description: status === 'in_progress' || status === 'reviewing'
          ? 'Provider is on site. You can track progress and chat.'
          : status === 'scheduled' || quotationAccepted
            ? 'Complete payment to authorize the provider to start.'
            : 'Provider will start after you accept quotation and complete payment.',
        status: ['in_progress', 'reviewing'].includes(status) ? 'in-progress' : ['scheduled', 'completed'].includes(status) ? 'completed' : 'pending',
        statusText: status === 'in_progress' || status === 'reviewing' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Pending',
        statusColor: ['in_progress', 'reviewing', 'scheduled', 'completed'].includes(status) ? '#DCFCE7' : '#DBEAFE',
        icon: Wrench,
      },
      {
        id: 'step-4',
        title: 'Job Completed',
        description: status === 'completed'
          ? 'Job completed. Payment released to provider. Thank you!'
          : status === 'reviewing'
            ? 'Provider finished. Confirm when satisfied to release payment.'
            : 'Provider will complete the work. You will confirm to release payment.',
        status: status === 'completed' ? 'completed' : status === 'reviewing' ? 'in-progress' : 'pending',
        statusText: status === 'completed' ? `Completed - ${formatTimeAgo(request?.updatedAt || '')}` : status === 'reviewing' ? 'Awaiting your confirmation' : 'Pending',
        statusColor: status === 'completed' ? '#DCFCE7' : status === 'reviewing' ? '#DBEAFE' : '#F3F4F6',
        icon: CheckCircle,
      },
    ];
  }, [request, quotations, acceptedProviders, params.providerCount]);

  useEffect(() => {
    haptics.success();
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
    ]).start();
    progressSteps.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSteps(prev => prev.includes(index) ? prev : [...prev, index]);
        if (index > 0) haptics.light();
      }, 300 + index * 150);
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    setAnimatedSteps([]);
  }, [progressSteps.length]);

  const handleContinue = () => {
    haptics.selection();
    if (params.requestId) {
      router.replace({
        pathname: '/OngoingJobDetails',
        params: { requestId: params.requestId, fromBooking: '1' },
      } as any);
    } else {
      router.push('/(tabs)/jobs' as any);
    }
  };

  const getStepColor = (status: ProgressStepStatus) => {
    switch (status) {
      case 'completed': return '#6A9B00';
      case 'in-progress': return '#F59E0B';
      default: return '#D1D5DB';
    }
  };

  const getStepTextColor = (status: ProgressStepStatus) => {
    switch (status) {
      case 'completed': return '#166534';
      case 'in-progress': return '#92400E';
      default: return '#6B7280';
    }
  };

  const displayService = params.serviceType || request?.categoryName || request?.jobTitle || 'plumbing service';
  const displayDate = params.selectedDate
    ? (() => {
        try {
          const d = new Date(params.selectedDate);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]} ${d.getDate()}`;
        } catch {
          return params.selectedDate;
        }
      })()
    : (request?.scheduledDate ? (() => {
        try {
          const d = new Date(request.scheduledDate);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]} ${d.getDate()}`;
        } catch {
          return request.scheduledDate;
        }
      })() : 'Dec 12');

  if (params.requestId && isLoading) {
    return (
      <SafeAreaWrapper className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6A9B00" />
          <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>Loading timeline...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper className="flex-1 bg-white">
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 20 }}
          refreshControl={
            params.requestId ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6A9B00']} />
            ) : undefined
          }
        >
          <View className="items-center mb-6">
            <Text className="text-4xl text-[#6A9B00] mb-4" style={{ fontFamily: 'Poppins-Bold' }}>
              Booking Successful!
            </Text>
          </View>

          <View className="bg-gray-100 rounded-2xl px-4 py-4 mb-8 border border-gray-200">
            <Text className="text-base text-black leading-6" style={{ fontFamily: 'Poppins-Regular' }}>
              Hi <Text style={{ fontFamily: 'Poppins-Bold' }}>{userName}</Text>, your{' '}
              <Text style={{ fontFamily: 'Poppins-Bold', textDecorationLine: 'underline' }}>
                {displayService}
              </Text>{' '}
              has been booked for{' '}
              <Text style={{ fontFamily: 'Poppins-Bold', textDecorationLine: 'underline' }}>
                {displayDate}
              </Text>
              . Our service provider will contact you soon.{params.requestId ? ' Pull down to refresh for the latest status.' : ''}
            </Text>
          </View>

          <View className="mb-8">
            {progressSteps.map((step, index) => {
              const isAnimated = animatedSteps.includes(index);
              const stepColor = getStepColor(step.status);
              const textColor = getStepTextColor(step.status);
              const isLast = index === progressSteps.length - 1;
              const IconComponent = step.icon || Circle;
              const iconSize = step.status === 'completed' ? 20 : step.status === 'in-progress' ? 18 : 16;

              return (
                <View key={step.id} className="flex-row mb-4">
                  <View className="items-center mr-5">
                    <Animated.View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isAnimated ? stepColor : '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isAnimated && step.status !== 'pending' ? 0 : 2,
                        borderColor: '#E5E7EB',
                        opacity: isAnimated ? 1 : 0.6,
                        shadowColor: isAnimated && step.status !== 'pending' ? stepColor : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isAnimated && step.status !== 'pending' ? 0.2 : 0.05,
                        shadowRadius: 4,
                        elevation: isAnimated && step.status !== 'pending' ? 4 : 1,
                      }}
                    >
                      <IconComponent
                        size={iconSize}
                        color={step.status === 'completed' || step.status === 'in-progress' ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </Animated.View>
                    {!isLast && (
                      <View
                        style={{
                          width: 3,
                          flex: 1,
                          backgroundColor: isAnimated && step.status !== 'pending' ? stepColor : '#E5E7EB',
                          minHeight: 45,
                          marginTop: 8,
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </View>
                  <View className="flex-1 pb-6">
                    <Text className="text-base mb-1" style={{ fontFamily: 'Poppins-Bold', color: '#111827' }}>
                      {step.title}
                    </Text>
                    <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins-Medium', color: '#6B7280' }}>
                      {step.description}
                    </Text>
                    <AnimatedStatusChip
                      status={step.statusText}
                      statusColor={step.statusColor}
                      textColor={textColor}
                      size="small"
                      animated={isAnimated}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            className="bg-black rounded-xl py-4 items-center justify-center flex-row"
          >
            <Text className="text-white text-base mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              {params.requestId ? 'View Job Details' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaWrapper>
  );
}
