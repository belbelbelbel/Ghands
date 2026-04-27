import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowRight, CalendarDays, CheckCircle, CheckCircle2, Circle, Clock3, FileText, Sparkles, Wrench } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <SafeAreaWrapper className="flex-1 bg-[#F7F9F2]">
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 118, paddingTop: 18 }}
          refreshControl={
            params.requestId ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6A9B00']} />
            ) : undefined
          }
        >
          <View style={{ paddingHorizontal: 18 }}>
            <LinearGradient
              colors={['#111807', '#345F00', '#6A9B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 32,
                paddingTop: 28,
                paddingHorizontal: 22,
                paddingBottom: 22,
                overflow: 'hidden',
                shadowColor: '#345F00',
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.22,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  top: -45,
                  right: -30,
                }}
              />
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 39,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.26)',
                }}
              >
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={34} color="#6A9B00" />
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    marginBottom: 12,
                  }}
                >
                  <Sparkles size={14} color="#E9FFB5" />
                  <Text
                    style={{
                      marginLeft: 6,
                      color: '#E9FFB5',
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: 12,
                    }}
                  >
                    Request sent successfully
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 34,
                    lineHeight: 40,
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontFamily: 'Poppins-Bold',
                    letterSpacing: -1,
                  }}
                >
                  Booking Confirmed
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    color: 'rgba(255,255,255,0.82)',
                    textAlign: 'center',
                    fontSize: 14,
                    lineHeight: 21,
                    fontFamily: 'Poppins-Medium',
                  }}
                >
                  Hi {userName}, we&apos;ll keep this timeline updated as providers respond.
                </Text>
              </View>

              <View
                style={{
                  marginTop: 22,
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  borderRadius: 22,
                  padding: 16,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: '#EEF7DF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Wrench size={19} color="#6A9B00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', color: '#6B7280', fontSize: 12 }}>
                      Service
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#111827', fontSize: 15 }} numberOfLines={1}>
                      {displayService}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F7F9F2',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: '#E6EBD8',
                    }}
                  >
                    <CalendarDays size={17} color="#6A9B00" />
                    <Text style={{ marginTop: 7, fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 13 }}>
                      {displayDate}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1.25,
                      backgroundColor: '#F7F9F2',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: '#E6EBD8',
                    }}
                  >
                    <Clock3 size={17} color="#6A9B00" />
                    <Text style={{ marginTop: 7, fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 13 }}>
                      {providerSummary}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={{ paddingHorizontal: 18, marginTop: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#111827', fontSize: 22, letterSpacing: -0.4 }}>
                What happens next
              </Text>
              <Text style={{ fontFamily: 'Poppins-Medium', color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                Pull down to refresh whenever you want the latest status.
              </Text>
            </View>

            {progressSteps.map((step, index) => {
              const isAnimated = animatedSteps.includes(index);
              const stepColor = getStepColor(step.status);
              const textColor = getStepTextColor(step.status);
              const isLast = index === progressSteps.length - 1;
              const IconComponent = step.icon || Circle;
              const iconSize = step.status === 'completed' ? 20 : step.status === 'in-progress' ? 18 : 16;

              return (
                <View
                  key={step.id}
                  style={{
                    flexDirection: 'row',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: step.status === 'pending' ? '#EEF0EA' : 'rgba(106,155,0,0.18)',
                    shadowColor: '#111827',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.05,
                    shadowRadius: 16,
                    elevation: 2,
                  }}
                >
                  <View style={{ alignItems: 'center', marginRight: 14 }}>
                    <Animated.View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
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
                          width: 2,
                          height: 38,
                          backgroundColor: isAnimated && step.status !== 'pending' ? stepColor : '#E5E7EB',
                          marginTop: 8,
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingTop: 2 }}>
                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#111827', fontSize: 16, marginBottom: 5 }}>
                      {step.title}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Medium', color: '#667085', fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
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

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 24,
            backgroundColor: 'rgba(247,249,242,0.96)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(17,24,39,0.06)',
          }}
        >
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#050505',
              borderRadius: 18,
              paddingVertical: 17,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.22,
              shadowRadius: 14,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, marginRight: 8, fontFamily: 'Poppins-SemiBold' }}>
              {params.requestId ? 'View Job Details' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaWrapper>
  );
}
