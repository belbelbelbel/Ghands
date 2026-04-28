import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowRight, CalendarDays, CheckCircle, CheckCircle2, Circle, Clock3, FileText, Wrench } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { serviceRequestService, profileService, authService } from '@/services/api';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { formatTimeAgo } from '@/utils/dateFormatting';

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

  // Dev-only: short client token snippet for backend debugging (never log full token)
  useEffect(() => {
    if (!__DEV__) return;
    (async () => {
      try {
        const token = await authService.getAuthToken();
        console.log('[ClientTokenSnippet]', token ? `${String(token).slice(0, 16)}...` : null);
      } catch {
        console.log('[ClientTokenSnippet]', null);
      }
    })();
  }, []);

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

  // After booking, do not pop back through map / photos / date — go to Jobs tab
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        router.replace('/(tabs)/jobs' as any);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [router])
  );

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
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    setAnimatedSteps([]);
    const timers = Array.from({ length: progressSteps.length }, (_, index) =>
      setTimeout(() => {
        setAnimatedSteps(prev => prev.includes(index) ? prev : [...prev, index]);
        if (index > 0) haptics.light();
      }, 300 + index * 150)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
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
  const displayProviderCount = params.providerCount
    ? parseInt(params.providerCount, 10)
    : (request?.nearbyProviders?.length ?? acceptedProviders.length ?? 0);
  const providerSummary = displayProviderCount > 0
    ? `${displayProviderCount} ${displayProviderCount === 1 ? 'provider' : 'providers'} notified`
    : 'Providers being matched';
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
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 116, paddingTop: 20 }}
          refreshControl={
            params.requestId ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6A9B00']} />
            ) : undefined
          }
        >
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#E7EBDf',
                padding: 18,
                shadowColor: '#111827',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.04,
                shadowRadius: 18,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: '#F2F8EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <CheckCircle2 size={30} color="#6A9B00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, lineHeight: 30, fontFamily: 'Poppins-Bold', color: '#111827', letterSpacing: -0.6 }}>
                    Booking confirmed
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 20, fontFamily: 'Poppins-Regular', color: '#667085' }}>
                    We&apos;ll notify you as providers respond.
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#EEF1E8', marginVertical: 16 }} />

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Wrench size={17} color="#6A9B00" />
                  <Text style={{ marginLeft: 9, flex: 1, fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 14 }} numberOfLines={1}>
                    {displayService}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF5', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11 }}>
                    <CalendarDays size={16} color="#6A9B00" />
                    <Text style={{ marginLeft: 8, fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 12 }}>
                      {displayDate}
                    </Text>
                  </View>
                  <View style={{ flex: 1.35, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAF5', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11 }}>
                    <Clock3 size={16} color="#6A9B00" />
                    <Text style={{ marginLeft: 8, fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 12 }} numberOfLines={1}>
                      {providerSummary}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
            <Text style={{ fontFamily: 'Poppins-Bold', color: '#111827', fontSize: 20, letterSpacing: -0.3 }}>
              Next steps
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#667085', fontSize: 13, marginTop: 3, marginBottom: 16 }}>
              Track provider responses and continue from the job details screen.
            </Text>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                borderWidth: 1,
                borderColor: '#E7EBDf',
                overflow: 'hidden',
              }}
            >
              {progressSteps.map((step, index) => {
                const isAnimated = animatedSteps.includes(index);
                const stepColor = getStepColor(step.status);
                const textColor = getStepTextColor(step.status);
                const isLast = index === progressSteps.length - 1;
                const IconComponent = step.icon || Circle;

                return (
                  <View key={step.id}>
                    <View
                      style={{
                        flexDirection: 'row',
                        paddingHorizontal: 15,
                        paddingVertical: 15,
                      }}
                    >
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <Animated.View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: isAnimated ? stepColor : '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isAnimated ? 1 : 0.65,
                          }}
                        >
                          <IconComponent
                            size={16}
                            color={step.status === 'pending' ? '#9CA3AF' : '#FFFFFF'}
                          />
                        </Animated.View>
                        {!isLast && (
                          <View
                            style={{
                              width: 2,
                              flex: 1,
                              minHeight: 22,
                              backgroundColor: step.status === 'pending' ? '#E5E7EB' : stepColor,
                              marginTop: 7,
                              borderRadius: 2,
                            }}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 14.5 }}>
                          {step.title}
                        </Text>
                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#667085', fontSize: 12.5, lineHeight: 19, marginTop: 3, marginBottom: 8 }}>
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
                    {!isLast && <View style={{ height: 1, backgroundColor: '#EEF1E8', marginLeft: 61 }} />}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 24,
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTopWidth: 1,
            borderTopColor: '#EEF1E8',
          }}
        >
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#050505',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, marginRight: 8, fontFamily: 'Poppins-SemiBold' }}>
              {params.requestId ? 'View job details' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaWrapper>
  );
}
