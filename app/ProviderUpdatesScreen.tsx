import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, FileText, CheckCircle, CreditCard, Wrench, Circle, Clock } from 'lucide-react-native';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Animated, ActivityIndicator } from 'react-native';
import { haptics } from '@/hooks/useHaptics';
import { providerService, serviceRequestService, ServiceRequest, QuotationWithProvider, authService } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return 'Recently';
  }
};

export default function ProviderUpdatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { showError } = useToast();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotation, setQuotation] = useState<QuotationWithProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectionCountdown, setSelectionCountdown] = useState<number | null>(null);
  const [providerId, setProviderId] = useState<number | null>(null);

  // Load provider ID
  useEffect(() => {
    const loadProviderId = async () => {
      try {
        const id = await authService.getCompanyId();
        setProviderId(id);
      } catch {
        setProviderId(null);
      }
    };
    loadProviderId();
  }, []);

  // Load request data
  const loadRequestData = useCallback(async () => {
    if (!params.requestId) return;

    setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);
      
      // Try to get request details directly
      let requestDetails: ServiceRequest | null = null;
      try {
        requestDetails = await serviceRequestService.getRequestDetails(requestId);
      } catch (directError: any) {
        // If direct call fails, try to get from accepted requests
        const status = (directError as any)?.status || (directError as any)?.response?.status;
        if (status === 500 || status === 404) {
          try {
            const acceptedRequests = await providerService.getAcceptedRequests();
            requestDetails = acceptedRequests.find(req => req.id === requestId) || null;
          } catch {
            throw directError;
          }
        } else {
          throw directError;
        }
      }

      if (!requestDetails) {
        showError('Request not found');
        setIsLoading(false);
        return;
      }

      setRequest(requestDetails);

      // Load quotation if available
      try {
        const quotations = await serviceRequestService.getQuotations(requestId);
        if (quotations && quotations.length > 0 && providerId) {
          // Find quotation from this provider
          const providerQuotation = quotations.find(q => q.provider?.id === providerId);
          if (providerQuotation) {
            setQuotation(providerQuotation);
          } else {
            setQuotation(null);
          }
        } else {
          setQuotation(null);
        }
      } catch {
        // Quotation might not exist yet
        setQuotation(null);
      }
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [params.requestId, providerId, showError, router]);

  // Countdown timer for selection (if provider was selected by client)
  const startCountdownTimer = useCallback(() => {
    if (!request?.selectedAt || request?.selectedProvider) {
      setSelectionCountdown(null);
      return;
    }

    const updateCountdown = () => {
      try {
        // Prefer backend's selectionTimeoutAt if available
        let timeoutTime: number;
        if (request.selectionTimeoutAt) {
          timeoutTime = new Date(request.selectionTimeoutAt).getTime();
        } else {
          const selectedTime = new Date(request.selectedAt!).getTime();
          timeoutTime = selectedTime + (5 * 60 * 1000); // 5 minutes
        }
        
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timeoutTime - now) / 1000));

        if (remaining > 0) {
          setSelectionCountdown(remaining);
        } else {
          setSelectionCountdown(null);
          loadRequestData();
        }
      } catch (error) {
        setSelectionCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [request?.selectedAt, request?.selectionTimeoutAt, request?.selectedProvider, loadRequestData]);

  // Start countdown when selection is active
  useEffect(() => {
    if (request?.selectedAt && !request.selectedProvider && request.status === 'pending') {
      const cleanup = startCountdownTimer();
      return cleanup;
    } else {
      setSelectionCountdown(null);
    }
  }, [request?.selectedAt, request?.selectedProvider, request?.status, request?.selectionTimeoutAt, startCountdownTimer]);

  // Generate dynamic timeline from request data
  const timelineSteps = useMemo(() => {
    if (!request) return [];

    const timeline = [];

    // Step 1: Job Request Received (always completed for provider)
    timeline.push({
      id: 'step-1',
      title: 'Job Request Received',
      description: 'You received this service request',
      status: `Completed - ${formatTimeAgo(request.createdAt || new Date().toISOString())}`,
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
      lineColor: '#6A9B00',
      isActive: false,
      isCompleted: true,
      icon: CheckCircle2,
    });

    // Step 1.5: Provider Selected by Client (if applicable)
    if (request?.selectedProvider || request?.selectedAt) {
      // Check if this provider is the selected one
      const isThisProviderSelected = request.selectedProvider?.id && 
        providerId === request.selectedProvider.id;
      
      if (isThisProviderSelected && request.status === 'accepted') {
        // Provider accepted the selection
        timeline.push({
          id: 'step-1.5',
          title: 'You Were Selected',
          description: 'Client selected you and you accepted',
          status: `Completed - ${formatTimeAgo(request.updatedAt || request.selectedAt || '')}`,
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          lineColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: CheckCircle2,
        });
      } else if (request.selectedAt && selectionCountdown !== null && selectionCountdown > 0) {
        // Selection pending with countdown
        const mins = Math.floor(selectionCountdown / 60);
        const secs = selectionCountdown % 60;
        timeline.push({
          id: 'step-1.5',
          title: 'You Were Selected',
          description: `Client selected you. Accept within ${mins}:${secs.toString().padStart(2, '0')}`,
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          lineColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      } else if (request.selectedAt) {
        // Selection pending (no countdown)
        timeline.push({
          id: 'step-1.5',
          title: 'You Were Selected',
          description: 'Client selected you. You have 5 minutes to accept',
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          lineColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      }
    }

    // Step 2: Quotation Sent
    if (quotation && (quotation.sentAt || quotation.status !== 'draft')) {
      if (quotation.status === 'accepted') {
        timeline.push({
          id: 'step-2',
          title: 'Quotation Sent & Accepted',
          description: 'Client accepted your quotation',
          status: `Completed - ${formatTimeAgo(quotation.sentAt || request.updatedAt || '')}`,
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          lineColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: FileText,
        });
      } else {
        timeline.push({
          id: 'step-2',
          title: 'Quotation Sent',
          description: 'Waiting for client to accept',
          status: `Sent - ${formatTimeAgo(quotation.sentAt || '')}`,
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          lineColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: FileText,
        });
      }
    } else if (request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') {
      // Quotation was accepted (status moved forward)
      timeline.push({
        id: 'step-2',
        title: 'Quotation Accepted',
        description: 'Client accepted your quotation',
        status: `Completed - ${formatTimeAgo(request.updatedAt || '')}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: FileText,
      });
    } else {
      // Quotation not sent yet
      timeline.push({
        id: 'step-2',
        title: 'Quotation',
        description: 'Send quotation to client',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        lineColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 3: Payment Confirmed
    if (request.status === 'in_progress' || request.status === 'completed') {
      timeline.push({
        id: 'step-3',
        title: 'Payment Confirmed',
        description: 'Payment secured and confirmed',
        status: `Completed - ${formatTimeAgo(request.updatedAt || '')}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CreditCard,
      });
    } else {
      timeline.push({
        id: 'step-3',
        title: 'Payment Confirmed',
        description: 'Waiting for payment confirmation',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        lineColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 4: Job in Progress
    if (request.status === 'in_progress') {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'You are on site',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        lineColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else if (request.status === 'completed') {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'You were on site',
        status: 'Completed',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'Waiting for quotation acceptance',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        lineColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 5: Complete
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-5',
        title: 'Complete',
        description: 'Job completed and approved',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else {
      timeline.push({
        id: 'step-5',
        title: 'Complete',
        description: 'Job will be marked complete after service',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        lineColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    return timeline;
  }, [request, quotation, selectionCountdown, providerId]);

  // Create animation values for timeline
  const timelineAnimations = useMemo(
    () => timelineSteps.map(() => new Animated.Value(0)),
    [timelineSteps]
  );

  const lineAnimations = useMemo(
    () => timelineSteps.slice(0, -1).map(() => new Animated.Value(0)),
    [timelineSteps]
  );

  // Animate timeline on mount and when steps change
  useEffect(() => {
    if (timelineSteps.length === 0) return;

    const timelineSequence = timelineAnimations.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
        delay: index * 120,
      })
    );
    Animated.stagger(100, timelineSequence).start(() => {
      haptics.light();
    });

    const lineSequence = lineAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: (index + 1) * 120 + 200,
        useNativeDriver: false,
      })
    );
    Animated.stagger(100, lineSequence).start();
  }, [timelineSteps, timelineAnimations, lineAnimations]);

  // Load data on mount
  useEffect(() => {
    if (params.requestId) {
      loadRequestData();
    }
  }, [params.requestId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (params.requestId) {
        const timer = setTimeout(() => {
          loadRequestData();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [params.requestId, loadRequestData])
  );

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
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Updates
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textTertiary, marginTop: 16 }}>
              Loading updates...
            </Text>
          </View>
        ) : !request ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textTertiary }}>
              Unable to load job details
            </Text>
            <TouchableOpacity
              onPress={loadRequestData}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: Colors.accent,
                borderRadius: BorderRadius.default,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 120,
            }}
          >
            {/* Timeline Section */}
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
              {timelineSteps.map((step, index) => {
                const isLast = index === timelineSteps.length - 1;
                const IconComponent = step.icon || Circle;
                const iconSize = step.isCompleted || step.isActive ? 14 : 12;
                const animation = timelineAnimations[index];
                const lineAnim = !isLast ? lineAnimations[index] : null;
                
                return (
                  <Animated.View 
                    key={step.id} 
                    style={{ 
                      flexDirection: 'row', 
                      marginBottom: isLast ? 0 : 12,
                      opacity: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                      transform: [{
                        translateX: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      }],
                    }}
                  >
                    {/* Timeline Indicator */}
                    <View style={{ alignItems: 'center', marginRight: 12 }}>
                      <Animated.View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: step.isCompleted ? step.dotColor : step.isActive ? step.dotColor : '#F3F4F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: step.isCompleted || step.isActive ? 0 : 2,
                          borderColor: '#E5E7EB',
                          shadowColor: step.isCompleted || step.isActive ? step.dotColor : '#000',
                          shadowOffset: {
                            width: 0,
                            height: 2,
                          },
                          shadowOpacity: step.isCompleted || step.isActive ? 0.2 : 0.05,
                          shadowRadius: 4,
                          elevation: step.isCompleted || step.isActive ? 4 : 1,
                          transform: [{
                            scale: animation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          }],
                        }}
                      >
                        <IconComponent 
                          size={iconSize} 
                          color={step.isCompleted || step.isActive ? Colors.white : '#9CA3AF'} 
                        />
                      </Animated.View>
                      {!isLast && (
                        <Animated.View
                          style={{
                            width: 2,
                            flex: 1,
                            backgroundColor: step.isCompleted ? step.lineColor : step.isActive ? step.lineColor : '#E5E7EB',
                            marginTop: 6,
                            borderRadius: 1,
                            minHeight: 36,
                            opacity: lineAnim ? lineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }) : 1,
                            transform: lineAnim ? [{
                              scaleY: lineAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }),
                            }] : [],
                          }}
                        />
                      )}
                    </View>

                    {/* Timeline Content */}
                    <Animated.View 
                      style={{ 
                        flex: 1,
                        opacity: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.textPrimary,
                          marginBottom: 2,
                        }}
                      >
                        {step.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textSecondaryDark,
                          marginBottom: 4,
                        }}
                      >
                        {step.description}
                      </Text>
                      {step.status && (
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Regular',
                            color: step.isCompleted ? Colors.accent : step.isActive ? '#F59E0B' : Colors.textTertiary,
                          }}
                        >
                          {step.status}
                        </Text>
                      )}
                    </Animated.View>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
