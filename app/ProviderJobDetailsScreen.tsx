import { SageHeroPanel } from '@/components/provider/SageHeroPanel';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { ProviderJobUpdatesTabSkeleton, QuotationListSkeleton } from '@/components/LoadingSkeleton';
import { ProviderJobNotFoundState } from '@/components/ProviderJobFallbackStates';
import { useSkeletonGate } from '@/hooks/useSkeletonGate';
import ProviderNoQuotationState from '@/components/ProviderNoQuotationState';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { JOB_TIMELINE, timelineChipText } from '@/lib/jobTimelineTheme';
import { CLIENT_HOME_SCROLL_GUTTER } from '@/lib/tabletLayout';
import { providerListCard } from '@/lib/providerSurfaceStyles';
import { surfaceElevation } from '@/lib/surfaceStyles';
import { Quotation, QuotationWithProvider, ServiceRequest, authService, providerService, serviceRequestService } from '@/services/api';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { makeCall } from '@/utils/callUtils';
import { formatDateLong, formatDateShort, formatTimeAgo } from '@/utils/dateFormatting';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { AuthError } from '@/utils/errors';
import { calculateDistance, estimateTravelTime, formatDistance, formatTravelTime, openMaps, openNavigation } from '@/utils/navigationUtils';
import { navigateBack, NAV_FALLBACK } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, ArrowLeft, ArrowRight, Calendar, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock, Edit, ExternalLink, FileText, MapPin, MapPinned, MessageCircle, MessageSquare, Navigation, Phone, Receipt, Send, Wallet, Wrench, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

const formatDate = (dateString: string): string => formatDateLong(dateString) || dateString;

const formatVisitSchedule = (scheduledDate?: string | null, scheduledTime?: string | null) => {
  const dateText = formatDateShort(scheduledDate) || scheduledDate || '';
  const timeText = scheduledTime || '';
  if (dateText && timeText) return `${dateText} at ${timeText}`;
  return dateText || timeText || 'the scheduled time';
};

/** True when a quotation record exists on the server beyond a draft (sent / awaiting client / decided). */
function recordShowsSentQuotation(
  q: { sentAt?: string | null; status?: string | null; id?: number | null } | null | undefined
): boolean {
  if (!q) return false;
  if (q.sentAt) return true;
  const s = (q.status || '').toString().toLowerCase();
  if (!s || s === 'draft') return false;
  return ['pending', 'accepted', 'rejected', 'expired'].includes(s);
}

export default function ProviderJobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [travelTimeMinutes, setTravelTimeMinutes] = useState<number | null>(null);
  const [isFromAcceptedRequests, setIsFromAcceptedRequests] = useState(false);
  const [selectionCountdown, setSelectionCountdown] = useState<number | null>(null);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [quotationWithProvider, setQuotationWithProvider] = useState<QuotationWithProvider | null>(null);
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [showProceedModal, setShowProceedModal] = useState(false);
  const [showCompletedActionsModal, setShowCompletedActionsModal] = useState(false);
  const [workOrderStatus, setWorkOrderStatus] = useState<'pending' | 'in_progress' | 'active'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [statusDetailsExpanded, setStatusDetailsExpanded] = useState(false);

  const isInitialLoadPending = isLoading || !hasAttemptedLoad;
  const { showSkeleton: showUpdatesSkeleton } = useSkeletonGate(
    isInitialLoadPending,
    !request,
    { delayMs: 100, minVisibleMs: 280 }
  );

  const handleBack = useCallback(() => {
    haptics.light();
    navigateBack(router, NAV_FALLBACK.providerJobs);
  }, [router]);

  // Update work order status based on request status
  // CRITICAL: Request status is the source of truth - if 'in_progress' or 'completed', work order is active
  // Keep 'active' when user clicked Start even if backend hasn't updated yet (avoids flicker back)
  useEffect(() => {
    if (request) {
      if (request.status === 'in_progress' || request.status === 'completed') {
        setWorkOrderStatus('active');
      } else if (request.status === 'scheduled') {
        setWorkOrderStatus((prev) =>
          prev === 'active' ? prev : 'pending'
        ); // Don't reset if user just clicked Start
      } else {
        setWorkOrderStatus('pending');
      }
    } else {
      setWorkOrderStatus('pending');
    }
  }, [request, quotation, quotationWithProvider]);

  // Load provider location and ID for distance calculations
  useEffect(() => {
    const loadProviderLocation = async () => {
      try {
        const id = await authService.getCompanyId();
        if (id) {
          setProviderId(id);
          const provider = await providerService.getProvider(id);
          if (provider?.latitude && provider?.longitude) {
            setProviderLocation({
              latitude: provider.latitude,
              longitude: provider.longitude,
            });
          }
        }
      } catch (error) {
        // Silently fail
      }
    };
    loadProviderLocation();
  }, []);

  // Recalculate distance when provider location or request location changes
  useEffect(() => {
    if (providerLocation && request?.location?.latitude && request?.location?.longitude) {
      const distance = calculateDistance(
        providerLocation.latitude,
        providerLocation.longitude,
        request.location.latitude,
        request.location.longitude
      );
      setDistanceKm(distance);
      setTravelTimeMinutes(estimateTravelTime(distance));
    }
  }, [providerLocation, request?.location?.latitude, request?.location?.longitude]);

  // Countdown timer for selection (if provider was selected by client)
  const startCountdownTimer = useCallback(() => {
    if (!request?.selectedAt || !providerId) {
      setSelectionCountdown(null);
      return;
    }

    // Check if this provider is the selected one
    // If selectedProvider exists, check if it matches this provider
    // If selectedProvider doesn't exist but selectedAt does, client selected this provider and is waiting for acceptance
    const isThisProviderSelected = request.selectedProvider 
      ? request.selectedProvider.id === providerId 
      : true; // If no selectedProvider yet, assume this provider was selected (pending acceptance)
    
    if (!isThisProviderSelected || request.selectedProvider) {
      // Either not selected, or already accepted (selectedProvider exists)
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
          loadRequestDetails();
        }
      } catch (error) {
        setSelectionCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [request?.selectedAt, request?.selectionTimeoutAt, request?.selectedProvider, providerId]);

  // Start countdown when selection is active
  useEffect(() => {
    // Only start countdown if:
    // 1. Client selected a provider (selectedAt exists)
    // 2. Provider hasn't accepted yet (selectedProvider doesn't exist or doesn't match this provider)
    // 3. Status is still pending
    // 4. We have providerId
    if (request?.selectedAt && !request.selectedProvider && request.status === 'pending' && providerId) {
      const cleanup = startCountdownTimer();
      return cleanup;
    } else {
      setSelectionCountdown(null);
    }
  }, [request?.selectedAt, request?.selectedProvider, request?.status, request?.selectionTimeoutAt, providerId, startCountdownTimer]);

  // Load quotation & provider-specific quotation in the background
  const loadQuotationWithProvider = useCallback(
    async (requestId: number) => {
      setIsLoadingQuotation(true);
      try {
        // Main quotation data for this request
        const quotationData = await providerService.getQuotation(requestId);
        setQuotation(quotationData);

        // Create quotationWithProvider from the quotation data we have
        // This avoids the expensive getQuotations() call while still providing the data needed for timeline
        if (quotationData && providerId) {
          // Convert Quotation to QuotationWithProvider format for timeline compatibility
          // Get provider name from request if available
          const providerName = request?.providerName || '';
          const providerQuotation: QuotationWithProvider = {
            id: quotationData.id,
            provider: {
              id: providerId,
              name: providerName,
              verified: false, // Not critical for timeline
              phoneNumber: '', // Not critical for timeline
            },
            laborCost: quotationData.laborCost,
            logisticsCost: quotationData.logisticsCost,
            materials: quotationData.materials || [],
            findingsAndWorkRequired: quotationData.findingsAndWorkRequired || '',
            serviceCharge: quotationData.serviceCharge,
            tax: quotationData.tax,
            total: quotationData.total,
            status: quotationData.status,
            sentAt: quotationData.sentAt,
          };
          setQuotationWithProvider(providerQuotation);
        } else {
          setQuotationWithProvider(null);
        }
      } catch (error: any) {
        // Quotation might not exist yet – that's OK
        setQuotation(null);
        setQuotationWithProvider(null);
      } finally {
        setIsLoadingQuotation(false);
      }
    },
    [providerId, request]
  );

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!params.requestId) return;
    
    setRefreshing(true);
    haptics.light();
    
    try {
      const requestId = parseInt(params.requestId, 10);
      if (!isNaN(requestId) && requestId > 0) {
        // Reload both request details and quotations
        await loadRequestDetails();
        await loadQuotationWithProvider(requestId);
      }
    } catch (error) {
      // Errors are handled in individual load functions
    } finally {
      setRefreshing(false);
    }
  }, [params.requestId, loadQuotationWithProvider]);


  // Track last load time and action cooldown to prevent excessive refresh/glitching
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const hasInitialLoadRef = useRef<boolean>(false);
  const actionCooldownUntilRef = useRef<number>(0); // Skip refresh for 2.5s after Start/Mark complete
  const locallyStartedRequestIdRef = useRef<number | null>(null);

  const loadRequestDetails = useCallback(async (options?: { silent?: boolean }) => {
    if (!params.requestId) return;
    
    const silent = options?.silent;
    
    // Prevent rapid double-calls - 1.5s throttle to avoid glitching after actions
    const now = Date.now();
    if (isLoadingRef.current || (now - lastLoadTimeRef.current < 1500)) {
      return;
    }
    
    isLoadingRef.current = true;
    lastLoadTimeRef.current = now;
    
    let requestDetails: ServiceRequest | null = null;

    // Mark that we've started a load attempt
    setHasAttemptedLoad(true);

    // Only show loading spinner on initial load, not on silent refreshes
    if (!silent && !hasInitialLoadRef.current) {
      setIsLoading(true);
    }
    try {
      const requestId = parseInt(params.requestId, 10);
      
      // Validate requestId
        if (isNaN(requestId) || requestId <= 0) {
          showError('Invalid request ID');
          setIsLoading(false);
          isLoadingRef.current = false;
          return;
        }
      
      
      // 1) Try provider accepted list (primary source)
      const acceptedRequests = await providerService.getAcceptedRequests();
      requestDetails = acceptedRequests.find((req) => req.id === requestId) || null;
      let loadedFromAcceptedList = !!requestDetails;

      // 2) If not there, fall back to available requests (pending invites)
      if (!requestDetails) {
        const availableRequests = await providerService.getAvailableRequests();
        requestDetails = availableRequests.find((req) => req.id === requestId) || null;
        if (requestDetails) {
          setIsFromAcceptedRequests(false);
        }
      } else {
        setIsFromAcceptedRequests(true);
      }

      // 3) Primary single-job fetch from provider-scoped endpoint.
      // This covers cases where the backend has moved the job out of
      // "accepted" and "available" lists (e.g. after visit requested / scheduled),
      // but the provider should still be able to open the job.
      if (!requestDetails) {
        try {
          const fullDetails = await providerService.getRequestById(requestId);
          if (fullDetails) {
            requestDetails = fullDetails as ServiceRequest;
            const status = (fullDetails as any).status?.toString().toLowerCase();
            if (
              status === 'accepted' ||
              status === 'scheduled' ||
              status === 'in_progress' ||
              status === 'reviewing' ||
              status === 'completed'
            ) {
              setIsFromAcceptedRequests(true);
            } else {
              setIsFromAcceptedRequests(false);
            }
          }
        } catch (err: any) {
          if (__DEV__) {
            const token = await authService.getAuthToken();
            const companyId = await authService.getCompanyId();
            console.log('❌ [ProviderJobDetails] getRequestById failed', {
              requestId,
              message: err?.message,
              status: err?.status,
              details: err?.details,
              tokenSnippet: token ,
              companyId,
            });
          }
          // Ignore here – we'll handle missing details below with a user-friendly message.
        }
      }

      // 4) Final fallback to shared request-service details endpoint.
      if (!requestDetails) {
        try {
          const fullDetails = await serviceRequestService.getRequestDetails(requestId);
          if (fullDetails) {
            requestDetails = fullDetails as ServiceRequest;
            const status = (fullDetails as any).status?.toString().toLowerCase();
            if (
              status === 'accepted' ||
              status === 'scheduled' ||
              status === 'in_progress' ||
              status === 'reviewing' ||
              status === 'completed'
            ) {
              setIsFromAcceptedRequests(true);
            } else {
              setIsFromAcceptedRequests(false);
            }
          }
        } catch (err: any) {
          if (__DEV__) {
            const companyId = await authService.getCompanyId();
            console.log('❌ [ProviderJobDetails] getRequestDetails fallback failed', {
              requestId,
              message: err?.message,
              status: err?.status,
              details: err?.details,
              companyId,
            });
          }
          // Ignore here – we'll handle missing details below with a user-friendly message.
        }
      }

      if (!requestDetails) {
        showError('Job details not found. Please refresh or try again.');
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      const backendStatus = (requestDetails.status || '').toString().toLowerCase();
      const shouldKeepLocalStart =
        locallyStartedRequestIdRef.current === requestId &&
        (backendStatus === 'scheduled' || backendStatus === 'accepted');
      const stableRequestDetails = shouldKeepLocalStart
        ? { ...requestDetails, status: 'in_progress' as any }
        : requestDetails;
      setRequest(stableRequestDetails);
      
      // Distance calculation will happen in useEffect when both locations are available
      // This ensures it works even if providerLocation loads after requestDetails
      
      // If request is accepted / in progress, start loading quotation info in the background
      // We DON'T await this so the main job details render quickly and quotation shows its own loader.
      // Use local flags + status (not React state) — `isFromAcceptedRequests` here would be stale
      // on the same tick as `setIsFromAcceptedRequests(true)`.
      const statusLower = (stableRequestDetails.status || '').toString().toLowerCase();
      const shouldLoadQuotation =
        loadedFromAcceptedList ||
        ['accepted', 'scheduled', 'in_progress', 'reviewing', 'completed'].includes(statusLower);
      if (shouldLoadQuotation) {
        loadQuotationWithProvider(requestId);
      }
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      // Check if it's a 500 error - might indicate invalid token or missing data
      const status = (error as any)?.status || (error as any)?.response?.status;
      if (status === 500) {
        // Check if we have a token - if not, redirect
        try {
          const token = await authService.getAuthToken();
          if (!token) {
            await handleAuthErrorRedirect(router);
            setIsLoading(false);
            isLoadingRef.current = false;
            return;
          }
          // If we have a token but still getting 500, it might be a backend issue
          // Show a more specific error message
          showError('Unable to load job details. The job may have been removed or you may not have access to it.');
          setIsLoading(false);
          isLoadingRef.current = false;
          return;
        } catch (tokenError) {
          // Can't get token = redirect
          await handleAuthErrorRedirect(router);
          setIsLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }
      
      if (__DEV__) {
        console.error('Error loading job details:', error);
      }
      showError(getSpecificErrorMessage(error, 'get_request_details'));
    } finally {
      if (!silent && !hasInitialLoadRef.current) {
        setIsLoading(false);
      }
      isLoadingRef.current = false;
      hasInitialLoadRef.current = true; // Mark that initial load is complete
    }
  }, [params.requestId, showError, router, isFromAcceptedRequests, loadQuotationWithProvider]);

  // Keep refs for stable useFocusEffect callback (avoids re-run when loadRequestDetails identity changes)
  const loadRequestDetailsRef = useRef(loadRequestDetails);
  const loadQuotationWithProviderRef = useRef(loadQuotationWithProvider);
  loadRequestDetailsRef.current = loadRequestDetails;
  loadQuotationWithProviderRef.current = loadQuotationWithProvider;

  // Load fresh data when screen gains focus - but NOT during action cooldown (Start/Mark complete)
  useFocusEffect(
    useCallback(() => {
      if (!params.requestId) return;
      const requestId = parseInt(params.requestId, 10);
      if (isNaN(requestId) || requestId <= 0) return;

      const now = Date.now();
      // Skip during action cooldown (user just clicked Start or Mark complete)
      if (now < actionCooldownUntilRef.current) return;
      if (isLoadingRef.current || (now - lastLoadTimeRef.current < 2500)) return;

      const isFirstLoad = !hasInitialLoadRef.current;
      const timer = setTimeout(() => {
        loadRequestDetailsRef.current({ silent: !isFirstLoad });
        loadQuotationWithProviderRef.current(requestId);
      }, 150);
      return () => clearTimeout(timer);
    }, [params.requestId])
  );

  const loadQuotation = async (requestId: number) => {
    setIsLoadingQuotation(true);
    try {
      const quotationData = await providerService.getQuotation(requestId);
      setQuotation(quotationData);
    } catch (error: any) {
      // Quotation might not exist yet, that's okay
      setQuotation(null);
    } finally {
      setIsLoadingQuotation(false);
    }
  };

  const handleProceedClick = () => {
    haptics.light();
    setShowProceedModal(true);
  };

  const handleAcceptRequest = async (proceedType: 'visit' | 'quote') => {
    if (!params.requestId || isAccepting || isRejecting) return;

    setIsAccepting(true);
    setShowProceedModal(false);
    haptics.light();

    try {
      const requestId = parseInt(params.requestId, 10);
      try {
        await providerService.acceptRequest(requestId);
      } catch (acceptErr: any) {
        const msg = (acceptErr?.message || acceptErr?.details?.data?.message || '').toLowerCase();
        const alreadyAccepted =
          msg.includes('already accepted') ||
          msg.includes('not available for acceptance') ||
          msg.includes('already accepted by');
        if (alreadyAccepted) {
          haptics.success();
          showSuccess('Request already accepted. Proceeding...');
          if (proceedType === 'visit') {
            setTimeout(() => {
              router.push({
                pathname: '/RequestVisitScreen' as any,
                params: { requestId: params.requestId, jobTitle: request?.jobTitle },
              } as any);
            }, 500);
          } else {
            setTimeout(() => {
              router.push({
                pathname: '/SendQuotationScreen' as any,
                params: {
                  requestId: params.requestId,
                  jobTitle: request?.jobTitle,
                  returnToTab: 'Quotations',
                },
              } as any);
            }, 500);
          }
          loadRequestDetails();
          setIsAccepting(false);
          return;
        }
        throw acceptErr;
      }

      haptics.success();
      
      if (proceedType === 'visit') {
        showSuccess('Request accepted! You can now schedule a visit for inspection.');
        // Navigate to Request Visit screen
      setTimeout(() => {
          router.push({
            pathname: '/RequestVisitScreen' as any,
            params: {
              requestId: params.requestId,
              jobTitle: request?.jobTitle,
            },
          } as any);
        }, 1000);
      } else {
        showSuccess('Request accepted! You can now send a quotation.');
        // Navigate to send quotation screen
        setTimeout(() => {
          router.push({
            pathname: '/SendQuotationScreen' as any,
            params: {
              requestId: params.requestId,
              jobTitle: request?.jobTitle,
              returnToTab: 'Quotations',
            },
          } as any);
        }, 1000);
      }
      
      // Reload request data
      loadRequestDetails();
    } catch (error: any) {
      if (__DEV__) {
      console.error('Error accepting request:', error);
      }
      haptics.error();
      
      const errorMessage = getSpecificErrorMessage(error, 'accept_request');
      showError(errorMessage);
      setIsAccepting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!params.requestId || isAccepting || isRejecting) return;

    setIsRejecting(true);
    haptics.light();

    try {
      const requestId = parseInt(params.requestId, 10);
      await providerService.rejectRequest(requestId);
      try {
        const stored = await AsyncStorage.getItem('@ghands:provider_rejected_request_ids');
        const ids = (stored ? JSON.parse(stored) : []) as string[];
        const id = String(requestId);
        if (!ids.includes(id)) {
          ids.push(id);
          await AsyncStorage.setItem('@ghands:provider_rejected_request_ids', JSON.stringify(ids));
        }
      } catch {
        // ignore
      }
      haptics.success();
      showSuccess('Request rejected successfully');
      router.back();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error rejecting request:', error);
      }
      haptics.error();
      showError(getSpecificErrorMessage(error, 'reject_request'));
    } finally {
      setIsRejecting(false);
    }
  };

  // Generate dynamic timeline from request data (similar to ProviderUpdatesScreen)
  const timelineSteps = useMemo(() => {
    if (!request) return [];

    const timeline = [];

    // Step 1: Job Request Received (always completed for provider)
    timeline.push({
      id: 'step-1',
      title: 'Request received',
      description: 'Review the job.',
      status: formatTimeAgo(request.createdAt || request.updatedAt),
      accent: JOB_TIMELINE.completeSoft,
      dotColor: JOB_TIMELINE.sage,
      lineColor: JOB_TIMELINE.sage,
      isActive: false,
      isCompleted: true,
      icon: CheckCircle2,
    });

    // Step 1.5: Provider Selected by Client (if applicable)
    if (request?.selectedProvider || request?.selectedAt) {
      const isThisProviderSelected = request.selectedProvider?.id && 
        providerId === request.selectedProvider.id;
      
      if (isThisProviderSelected && request.status === 'accepted') {
        timeline.push({
          id: 'step-1.5',
          title: 'Selected',
          description: 'You accepted the job.',
          status: formatTimeAgo(request.updatedAt || request.selectedAt || ''),
          accent: JOB_TIMELINE.completeSoft,
          dotColor: JOB_TIMELINE.sage,
          lineColor: JOB_TIMELINE.sage,
          isActive: false,
          isCompleted: true,
          icon: CheckCircle2,
        });
      } else if (request.selectedAt && selectionCountdown !== null && selectionCountdown > 0) {
        const mins = Math.floor(selectionCountdown / 60);
        const secs = selectionCountdown % 60;
        timeline.push({
          id: 'step-1.5',
          title: 'Selected',
          description: `Accept within ${mins}:${secs.toString().padStart(2, '0')}`,
          status: 'Waiting',
          accent: '#FEF9C3',
          dotColor: JOB_TIMELINE.activeDot,
          lineColor: JOB_TIMELINE.activeDot,
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      } else if (request.selectedAt) {
        timeline.push({
          id: 'step-1.5',
          title: 'Selected',
          description: 'Client is waiting for your response.',
          status: 'Waiting',
          accent: '#FEF9C3',
          dotColor: JOB_TIMELINE.activeDot,
          lineColor: JOB_TIMELINE.activeDot,
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      }
    }

    // Step 2a: Inspection (visit) - separate from quotation
    const requestIndicatesQuotationAccepted = request.status === 'scheduled' ||
                                               request.status === 'in_progress' ||
                                               request.status === 'reviewing' ||
                                               request.status === 'completed';
    const isQuotationAccepted =
      (quotationWithProvider && quotationWithProvider.status === 'accepted') ||
      (quotation && quotation.status === 'accepted') ||
      requestIndicatesQuotationAccepted;
    const quotationSent =
      recordShowsSentQuotation(quotation) || recordShowsSentQuotation(quotationWithProvider);
    // A sent quotation / post-quote status means the provider already engaged — keep steps linear.
    const providerHasAccepted =
      isFromAcceptedRequests ||
      request.status === 'accepted' ||
      requestIndicatesQuotationAccepted ||
      quotationSent;
    const visitRequest = (request as any).visitRequest;
    const visitStatus = (visitRequest?.logisticsStatus || '').toString().toLowerCase();
    const visitDeclined = ['cancelled', 'declined', 'rejected'].includes(visitStatus);
    const hasVisitRequested = !!(visitRequest && (
      visitRequest.scheduledDate ||
      visitRequest.scheduledTime ||
      visitRequest.requestedAt ||
      visitRequest.logisticsStatus ||
      visitRequest.logisticsCost != null
    ));
    const visitPaid = visitRequest?.logisticsStatus === 'paid';
    const visitScheduleText = formatVisitSchedule(visitRequest?.scheduledDate, visitRequest?.scheduledTime);

    if (providerHasAccepted) {
      if (quotationSent) {
        timeline.push({
          id: 'step-2',
          title: 'Inspection',
          description: hasVisitRequested ? 'Visit handled.' : 'Quoted directly.',
          status: 'Done',
          accent: JOB_TIMELINE.completeSoft,
          dotColor: JOB_TIMELINE.sage,
          lineColor: JOB_TIMELINE.sage,
          isActive: false,
          isCompleted: true,
          icon: MapPinned,
          showRequestVisit: false,
        });
      } else if (visitDeclined) {
        timeline.push({
          id: 'step-2',
          title: 'Inspection',
          description: 'Client declined the visit.',
          status: 'Active',
          accent: '#FEF9C3',
          dotColor: JOB_TIMELINE.activeDot,
          lineColor: JOB_TIMELINE.activeDot,
          isActive: true,
          isCompleted: false,
          icon: MapPinned,
          showRequestVisit: false,
        });
      } else if (hasVisitRequested) {
        timeline.push({
          id: 'step-2',
          title: 'Inspection',
          description: visitPaid
            ? `Visit confirmed for ${visitScheduleText}.`
            : `Visit requested for ${visitScheduleText}.`,
          status: visitPaid ? 'Done' : 'Waiting',
          accent: visitPaid ? 'rgba(79, 103, 57, 0.14)' : '#FEF9C3',
          dotColor: visitPaid ? JOB_TIMELINE.sage : JOB_TIMELINE.activeDot,
          lineColor: visitPaid ? JOB_TIMELINE.sage : JOB_TIMELINE.activeDot,
          isActive: !visitPaid,
          isCompleted: visitPaid,
          icon: MapPinned,
          showRequestVisit: false, // Visit already requested - don't show button again
        });
      } else {
        timeline.push({
          id: 'step-2',
          title: 'Inspection',
          description: 'Request a visit or quote directly.',
          status: 'Active',
          accent: '#FEF9C3',
          dotColor: JOB_TIMELINE.activeDot,
          lineColor: JOB_TIMELINE.activeDot,
          isActive: true,
          isCompleted: false,
          icon: MapPinned,
          showRequestVisit: true,
        });
      }
    } else {
      timeline.push({
        id: 'step-2',
        title: 'Inspection',
        description: 'Accept before taking action.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: MapPinned,
        showRequestVisit: false,
      });
    }

    // Step 2b: Quotation
    if (providerHasAccepted) {
      if (quotationSent) {
        const jobComplete = request.status === 'completed';
        const quotationDescription = jobComplete
          ? 'Accepted and paid.'
          : isQuotationAccepted
            ? 'Quotation accepted.'
            : 'Waiting for client review.';
        const quotationStatus = jobComplete
          ? 'Done'
          : formatTimeAgo(quotationWithProvider?.sentAt || quotation?.sentAt || request.updatedAt || '');

        timeline.push({
          id: 'step-2b',
          title: 'Quotation',
          description: quotationDescription,
          status: quotationStatus,
          accent: JOB_TIMELINE.completeSoft,
          dotColor: JOB_TIMELINE.sage,
          lineColor: JOB_TIMELINE.sage,
          isActive: false,
          isCompleted: true,
          icon: FileText,
          canEdit: !jobComplete && !isQuotationAccepted,
        });
      } else {
        timeline.push({
          id: 'step-2b',
          title: 'Quotation',
          description: hasVisitRequested && !visitPaid
            ? 'Visit payment comes first.'
            : 'Prepare the quote.',
          status: hasVisitRequested && !visitPaid ? 'Pending' : 'Active',
          accent: hasVisitRequested && !visitPaid ? '#F3F4F6' : '#FEF9C3',
          dotColor: hasVisitRequested && !visitPaid ? JOB_TIMELINE.pendingDot : JOB_TIMELINE.activeDot,
          lineColor: hasVisitRequested && !visitPaid ? JOB_TIMELINE.pendingDot : JOB_TIMELINE.activeDot,
          isActive: !(hasVisitRequested && !visitPaid),
          isCompleted: false,
          icon: FileText,
          canEdit: !(hasVisitRequested && !visitPaid),
        });
      }
    } else {
      timeline.push({
        id: 'step-2b',
        title: 'Quotation',
        description: 'Send quote after accepting.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: FileText,
        canEdit: false,
      });
    }

    // Step 3: Quotation Accepted
    if (isQuotationAccepted) {
      timeline.push({
        id: 'step-3',
        title: 'Quote accepted',
        description: request.status === 'completed' ? 'Paid and confirmed.' : 'Waiting for payment.',
        status: request.status === 'completed'
          ? 'Done'
          : formatTimeAgo(quotationWithProvider?.sentAt || quotation?.sentAt || request.updatedAt || ''),
        accent: JOB_TIMELINE.completeSoft,
        dotColor: JOB_TIMELINE.sage,
        lineColor: JOB_TIMELINE.sage,
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else if (quotationSent) {
      // Quotation sent but not accepted yet - YELLOW (waiting for client to accept)
      timeline.push({
        id: 'step-3',
        title: 'Client approval',
        description: 'Waiting for acceptance.',
        status: 'Waiting',
        accent: '#FEF9C3',
        dotColor: JOB_TIMELINE.activeDot,
        lineColor: JOB_TIMELINE.activeDot,
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } else {
      // Quotation not sent yet - grey (pending)
      timeline.push({
        id: 'step-3',
        title: 'Quote accepted',
        description: 'Send quote first.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: FileText,
      });
    }
    
    // Step 4: Work order assigned (merged with payment info)
    // Payment is received when request.status is 'scheduled', 'in_progress', or 'completed'
    const isPaymentReceived = request.status === 'scheduled' ||
                              request.status === 'in_progress' ||
                              request.status === 'reviewing' ||
                              request.status === 'completed';
    
    // Show Start button - GREEN when payment received, GRAY/DISABLED when payment not received
    const workOrderIsActive = request.status === 'in_progress' ||
                              request.status === 'reviewing' ||
                              request.status === 'completed' ||
                              workOrderStatus === 'active'; // Fallback to local state if request status not updated yet
    
    if (workOrderIsActive) {
      // Start button clicked - green (completed)
      timeline.push({
        id: 'step-4',
        title: 'Work order',
        description: 'Job started.',
        status: formatTimeAgo(request.updatedAt || ''),
        accent: JOB_TIMELINE.completeSoft,
        dotColor: JOB_TIMELINE.sage,
        lineColor: JOB_TIMELINE.sage,
        isActive: false,
        isCompleted: true,
        icon: CheckCircle2,
        showStartButton: false,
      });
    } else if (isPaymentReceived) {
      // Payment received but Start not clicked - show Start button (GREEN/ENABLED)
      timeline.push({
        id: 'step-4',
        title: 'Work order',
        description: 'Payment received.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: Wallet,
        showStartButton: true,
        startButtonEnabled: true, // GREEN button - payment received, can start
      });
    } else if (isQuotationAccepted) {
      // Quotation accepted but payment not received yet - YELLOW (waiting for payment)
      timeline.push({
        id: 'step-4',
        title: 'Work order',
        description: 'Waiting for payment.',
        status: 'Waiting',
        accent: '#FEF9C3',
        dotColor: JOB_TIMELINE.activeDot,
        lineColor: JOB_TIMELINE.activeDot,
        isActive: true,
        isCompleted: false,
        icon: Clock,
        showStartButton: true,
        startButtonEnabled: false, // GRAY button - payment not received, cannot start
      });
    } else {
      // Quotation not accepted yet - grey (pending)
      timeline.push({
        id: 'step-4',
        title: 'Work order',
        description: 'Waiting for quote acceptance.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: Clock,
        showStartButton: true,
        startButtonEnabled: false, // GRAY button - payment not received, cannot start
      });
    }

    // Step 5: Job in Progress
    // Show as yellow when work order is active (Start button clicked)
    // Show as green when job is completed or provider marked complete (reviewing)
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-5',
        title: 'Work started',
        description: 'Work finished.',
        status: 'Done',
        accent: JOB_TIMELINE.completeSoft,
        dotColor: JOB_TIMELINE.sage,
        lineColor: JOB_TIMELINE.sage,
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else if (request.status === 'reviewing') {
      timeline.push({
        id: 'step-5',
        title: 'Ready for review',
        description: 'Waiting for client confirmation.',
        status: 'Review',
        accent: JOB_TIMELINE.completeSoft,
        dotColor: JOB_TIMELINE.sage,
        lineColor: JOB_TIMELINE.sage,
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else if (request.status === 'in_progress' || workOrderStatus === 'active') {
      timeline.push({
        id: 'step-5',
        title: 'Work started',
        description: 'Keep the client updated.',
        status: 'Active',
        accent: '#FEF9C3',
        dotColor: JOB_TIMELINE.activeDot,
        lineColor: JOB_TIMELINE.activeDot,
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else {
      timeline.push({
        id: 'step-5',
        title: 'Work started',
        description: 'Start after payment.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: Wrench,
      });
    }

    // Step 6: Complete
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Payment released.',
        status: formatTimeAgo(request.updatedAt || request.createdAt),
        accent: JOB_TIMELINE.completeSoft,
        dotColor: JOB_TIMELINE.sage,
        lineColor: JOB_TIMELINE.sage,
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else if (request.status === 'reviewing') {
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Waiting for client confirmation.',
        status: 'Review',
        accent: '#FEF9C3',
        dotColor: JOB_TIMELINE.activeDot,
        lineColor: JOB_TIMELINE.activeDot,
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } else {
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Final step after client approval.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: JOB_TIMELINE.pendingDot,
        lineColor: JOB_TIMELINE.railMuted,
        isActive: false,
        isCompleted: false,
        icon: CheckCircle,
      });
    }

    return timeline;
  }, [request, quotation, quotationWithProvider, selectionCountdown, providerId, isFromAcceptedRequests]);

  /** Matches timeline: provider is past “invite” — show post-accept actions, not generic Send Quotation. */
  const providerBottomBarEngaged = useMemo(() => {
    if (!request) return false;
    const st = (request.status || '').toString().toLowerCase();
    const sent =
      recordShowsSentQuotation(quotation) || recordShowsSentQuotation(quotationWithProvider);
    return (
      isFromAcceptedRequests ||
      st === 'accepted' ||
      st === 'scheduled' ||
      st === 'in_progress' ||
      st === 'reviewing' ||
      st === 'completed' ||
      !!(request as any)?.visitRequest ||
      sent
    );
  }, [request, isFromAcceptedRequests, quotation, quotationWithProvider]);

  const hasSentQuotation =
    recordShowsSentQuotation(quotation) || recordShowsSentQuotation(quotationWithProvider);
  const currentVisitRequest = (request as any)?.visitRequest;
  const currentVisitStatus = (currentVisitRequest?.logisticsStatus || '').toString().toLowerCase();
  const currentVisitDeclined = ['cancelled', 'declined', 'rejected'].includes(currentVisitStatus);
  const currentVisitRequested = !!(currentVisitRequest && (
    currentVisitRequest.scheduledDate ||
    currentVisitRequest.scheduledTime ||
    currentVisitRequest.requestedAt ||
    currentVisitRequest.logisticsStatus ||
    currentVisitRequest.logisticsCost != null
  ));
  const currentVisitPaid = currentVisitStatus === 'paid';
  const visitRequestWaitingForClient = currentVisitRequested && !currentVisitPaid && !currentVisitDeclined;
  const showTopProviderActions =
    !!request &&
    providerBottomBarEngaged &&
    !hasSentQuotation &&
    !visitRequestWaitingForClient;

  const handleSendQuote = useCallback(() => {
    haptics.light();
    router.push({
      pathname: '/SendQuotationScreen' as any,
      params: { requestId: params.requestId, jobTitle: request?.jobTitle, returnToTab: 'Quotations' },
    } as any);
  }, [params.requestId, request?.jobTitle, router]);

  const hasAnimatedTimelineRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);

  // Create animation values for timeline
  const stepCount = timelineSteps.length;
  const timelineAnimations = useMemo(
    () => Array.from(
      { length: Math.max(stepCount, 1) },
      () => new Animated.Value(hasAnimatedTimelineRef.current ? 1 : 0)
    ),
    [stepCount]
  );
  const lineAnimations = useMemo(
    () => Array.from(
      { length: Math.max(stepCount - 1, 0) },
      () => new Animated.Value(hasAnimatedTimelineRef.current ? 1 : 0)
    ),
    [stepCount]
  );

  useEffect(() => {
    if (params.requestId !== lastRequestIdRef.current) {
      lastRequestIdRef.current = params.requestId ?? null;
      hasAnimatedTimelineRef.current = false;
    }
  }, [params.requestId]);

  // Show timeline immediately — staggered entrance caused jank after skeleton dismisses.
  useEffect(() => {
    if (timelineSteps.length === 0) return;
    if (hasAnimatedTimelineRef.current) return;
    hasAnimatedTimelineRef.current = true;
    timelineAnimations.slice(0, timelineSteps.length).forEach((anim) => anim.setValue(1));
    lineAnimations.slice(0, Math.max(0, timelineSteps.length - 1)).forEach((anim) => anim.setValue(1));
  }, [timelineSteps, timelineAnimations, lineAnimations]);

  // Get user info from request
  const user = request?.user;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const clientName = `${firstName} ${lastName}`.trim() || 'Client';
  
  // Get location info
  const location = request?.location || {};
  const locationAddress = location.formattedAddress || location.address || '';
  const locationCity = location.city || '';
  const locationState = location.state || '';
  const fullLocation = locationAddress || `${locationCity}${locationCity && locationState ? ', ' : ''}${locationState}`.trim() || 'Location not specified';
  
  // Get scheduled date/time
  const scheduledDate = request?.scheduledDate ? formatDate(request.scheduledDate) : '';
  const scheduledTime = request?.scheduledTime || '';
  
  // Format date for status message (simpler format: "October 20, 2024")
  const formatDateForStatus = (dateString: string): string => formatDateShort(dateString) || dateString;
  
  const statusDate = request?.scheduledDate ? formatDateForStatus(request.scheduledDate) : '';

  // Determine current status message for provider - same design system as client (neutral/action/success)
  const statusMessage = useMemo(() => {
    if (!request) return null;

    if (request.status === 'completed') {
      return { title: 'Job completed', message: 'Job was completed successfully', showDetails: false, variant: 'success' as const };
    }

    if (request.status === 'in_progress') {
      return { title: 'Job in progress', message: 'You are currently working on this job', showDetails: true, variant: 'success' as const };
    }

    if (request.status === 'reviewing') {
      return { title: 'Work done', message: 'Waiting for client to confirm and release payment', showDetails: true, variant: 'neutral' as const };
    }

    if (request.status === 'scheduled' && workOrderStatus === 'active') {
      return { title: 'Job in progress', message: 'You are currently working on this job', showDetails: true, variant: 'success' as const };
    }

    if (request.status === 'scheduled') {
      return { title: 'Payment received', message: 'Click Start to begin the job', showDetails: true, variant: 'success' as const };
    }

    if (quotationWithProvider?.status === 'accepted' || (request.status === 'accepted' && quotation)) {
      return {
        title: 'Quotation accepted',
        message: `${clientName} accepted your quotation`,
        showDetails: true,
        logisticsFee: quotation?.total || quotationWithProvider?.total,
        variant: 'success' as const,
      };
    }

    if (quotationWithProvider && quotationWithProvider.status === 'pending') {
      return {
        title: 'Quotation sent',
        message: `Waiting for ${clientName} to approve the quotation`,
        showDetails: true,
        logisticsFee: quotationWithProvider.total,
        variant: 'neutral' as const,
      };
    }

    const statusVisitRequest = (request as any)?.visitRequest;
    const statusVisitStatus = (statusVisitRequest?.logisticsStatus || '').toString().toLowerCase();
    const statusVisitDeclined = ['cancelled', 'declined', 'rejected'].includes(statusVisitStatus);
    const statusVisitRequested = !!(statusVisitRequest && (
      statusVisitRequest.scheduledDate ||
      statusVisitRequest.scheduledTime ||
      statusVisitRequest.requestedAt ||
      statusVisitRequest.logisticsStatus ||
      statusVisitRequest.logisticsCost != null
    ));
    const statusVisitPaid = statusVisitStatus === 'paid';
    if (statusVisitRequested && !statusVisitDeclined && !quotationWithProvider) {
      return {
        title: statusVisitPaid ? 'Visit confirmed' : 'Visit request sent',
        message: statusVisitPaid
          ? 'Client confirmed the visit fee. Complete the visit before sending a quotation.'
          : 'Waiting for client to confirm and pay the visit fee.',
        showDetails: true,
        variant: statusVisitPaid ? 'success' as const : 'neutral' as const,
      };
    }

    if (request.selectedAt && !request.selectedProvider && selectionCountdown !== null && selectionCountdown > 0) {
      return { title: 'You were selected', message: 'Accept the selection to proceed', showDetails: true, variant: 'action' as const };
    }

    if (isFromAcceptedRequests && !quotationWithProvider) {
      return { title: 'Request accepted', message: 'Send a quotation or request a visit', showDetails: true, variant: 'action' as const };
    }

    if (request.status === 'pending' && !isFromAcceptedRequests) {
      return { title: 'New request', message: 'Review and accept to proceed', showDetails: true, variant: 'action' as const };
    }

    return { title: 'Request received', message: 'Processing your request', showDetails: true, variant: 'neutral' as const };
  }, [request, quotationWithProvider, clientName, isFromAcceptedRequests, selectionCountdown, quotation, workOrderStatus]);

  if (hasAttemptedLoad && !isLoading && !request) {
    return (
      <ProviderJobNotFoundState onGoBack={handleBack} />
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header - Back Button and Title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
            paddingTop: 16,
            paddingBottom: 12,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
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
            Job Details
          </Text>
          {request?.status === 'completed' && (
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setShowCompletedActionsModal(true);
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: '#EEF7EA',
                borderWidth: 1,
                borderColor: '#CDE6BC',
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#365314',
                }}
              >
                View actions
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Full-width tabs with green underline for active tab */}
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              setActiveTab('Updates');
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: activeTab === 'Updates' ? 2 : 0,
              borderBottomColor: activeTab === 'Updates' ? Colors.accent : 'transparent',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: activeTab === 'Updates' ? 'Poppins-Bold' : 'Poppins-Medium',
                color: activeTab === 'Updates' ? Colors.textPrimary : Colors.textSecondaryDark,
              }}
            >
              Updates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              setActiveTab('Quotations');
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: activeTab === 'Quotations' ? 2 : 0,
              borderBottomColor: activeTab === 'Quotations' ? Colors.accent : 'transparent',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: activeTab === 'Quotations' ? 'Poppins-Bold' : 'Poppins-Medium',
                color: activeTab === 'Quotations' ? Colors.textPrimary : Colors.textSecondaryDark,
              }}
            >
              Quotations
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
            // Increase padding when in Quotations tab with buttons at bottom
            paddingBottom: showTopProviderActions
              ? 28
              : activeTab === 'Quotations' && quotation && quotation.status === 'accepted'
                ? 200
                : 120,
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
          {activeTab === 'Updates' ? (
            showUpdatesSkeleton || !request ? (
              <ProviderJobUpdatesTabSkeleton />
            ) : (
            <>
          {/* Sync hint – when quotation accepted but status still shows waiting for payment */}
          {(() => {
            const quoteAccepted = quotation?.status === 'accepted' || quotationWithProvider?.status === 'accepted';
            const paymentNotYetReflected = request?.status === 'accepted'; // Still "accepted", not "scheduled"
            const showSyncHint = quoteAccepted && paymentNotYetReflected;
            if (!showSyncHint) return null;
            return (
              <View
                style={{
                  backgroundColor: '#E0F2FE',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Activity size={18} color="#0284C7" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Poppins-Regular', color: '#0C4A6E' }}>
                  If the client has paid, pull down to refresh for the latest status.
                </Text>
              </View>
            );
          })()}

          {/* Client Information Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(17, 24, 39, 0.045)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/images/userimg.jpg')}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  marginRight: 10,
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  {clientName}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginTop: 2,
                  }}
                >
                  Client
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  const clientName = request?.user 
                    ? `${request.user.firstName} ${request.user.lastName}`.trim() 
                    : 'Client';
                  makeCall(
                    clientName,
                    request?.user?.id?.toString(),
                    {
                      title: request?.jobTitle || 'Service Request',
                      description: request?.description,
                      orderNumber: `#WO-${request?.id}`,
                      scheduledDate: request?.scheduledDate ? formatDate(request.scheduledDate) : undefined,
                      scheduledTime: request?.scheduledTime,
                      location: request?.location?.formattedAddress || request?.location?.address,
                      status: request?.status === 'pending' ? 'Pending' : request?.status === 'accepted' ? 'Accepted' : request?.status === 'in_progress' ? 'In Progress' : 'Completed',
                      requestId: request?.id?.toString(),
                    },
                    true // isProvider
                  );
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F2F8EA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}
                activeOpacity={0.8}
                accessibilityLabel="Call client"
              >
                <Phone size={18} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F7FAF0',
                  borderWidth: 1,
                  borderColor: 'rgba(79, 103, 57, 0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}
                activeOpacity={0.8}
                accessibilityLabel="Message client"
                onPress={() => {
                  router.push({
                    pathname: '/ChatScreen',
                    params: {
                      clientName: request?.client?.name || 'Client',
                      requestId: params.requestId,
                    },
                  } as any);
                }}
              >
                <MessageCircle size={18} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {showTopProviderActions && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <TouchableOpacity
                onPress={handleSendQuote}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  backgroundColor: Colors.accent,
                  borderRadius: 18,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  shadowColor: Colors.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                }}
              >
                <Send size={17} color={Colors.white} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Send quotation
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Message Card - aligned with client job-details status card */}
          {statusMessage && statusMessage.message !== 'Review and accept to proceed' && (
            <View
              style={{
                marginBottom: 16,
                borderRadius: 18,
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                overflow: 'hidden',
                padding: 14,
              }}
            >
              <View
                style={{
                  backgroundColor: '#EEF0F3',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: -60,
                    width: 140,
                    height: 80,
                    backgroundColor: Colors.accent,
                    opacity: 0.12,
                    transform: [{ rotate: '8deg' }],
                  }}
                />

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.selection();
                      setStatusDetailsExpanded((current) => !current);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 16,
                        lineHeight: 21,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                      }}
                      numberOfLines={2}
                    >
                      {statusMessage.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: 999,
                        backgroundColor: Colors.white,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins-SemiBold',
                          color: '#6B7280',
                          marginRight: 4,
                        }}
                      >
                        Details
                      </Text>
                      {statusDetailsExpanded ? (
                        <ChevronUp size={14} color="#6B7280" />
                      ) : (
                        <ChevronDown size={14} color="#6B7280" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {statusDetailsExpanded && (
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: '#374151',
                        marginTop: 8,
                        lineHeight: 18,
                      }}
                    >
                      {statusMessage.message}
                    </Text>
                  )}
                  
                  {statusDetailsExpanded && statusMessage.showDetails && (
                    <View style={{ marginTop: 12, gap: 8 }}>
                      {(statusDate || scheduledTime) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Calendar size={15} color="#6B7280" style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              fontSize: 12,
                              lineHeight: 18,
                              fontFamily: 'Poppins-Regular',
                              color: Colors.textPrimary,
                            }}
                          >
                            {statusDate && scheduledTime
                              ? `${statusDate} @${scheduledTime}`
                              : statusDate || scheduledTime || 'Date not scheduled'}
                          </Text>
                        </View>
                      )}
                      
                      {statusMessage.logisticsFee && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Wallet size={15} color={Colors.accent} style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              fontSize: 12,
                              lineHeight: 18,
                              fontFamily: 'Poppins-Regular',
                              color: Colors.textPrimary,
                            }}
                          >
                            ₦{new Intl.NumberFormat('en-NG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(statusMessage.logisticsFee)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Timeline Section */}
          {request && timelineSteps.length > 0 && (
            <View
              style={{
                ...providerListCard,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 14,
                  letterSpacing: -0.2,
                }}
              >
                Job Timeline
              </Text>
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
                      marginBottom: isLast ? 0 : 14,
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
                    <View style={{ alignItems: 'center', marginRight: 12 }}>
                      <Animated.View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: step.isCompleted ? step.dotColor : step.isActive ? step.dotColor : '#F3F4F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: step.isCompleted || step.isActive ? 0 : 2,
                          borderColor: '#E5E7EB',
                          shadowColor: step.isCompleted || step.isActive ? step.dotColor : '#000',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0,
                          shadowRadius: 0,
                          elevation: 0,
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
                            backgroundColor: step.isCompleted
                              ? step.lineColor
                              : step.isActive
                                ? step.lineColor
                                : '#E5E7EB',
                            marginTop: 6,
                            borderRadius: 1,
                            minHeight: 30,
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

                    <Animated.View
                      style={{
                        flex: 1,
                        opacity: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.default,
                        borderWidth: 1,
                        borderColor: step.isActive
                          ? JOB_TIMELINE.activeSoft
                          : step.isCompleted
                            ? JOB_TIMELINE.completeSoft
                            : JOB_TIMELINE.rowBorder,
                        padding: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Poppins-Bold',
                            color: Colors.textPrimary,
                            lineHeight: 20,
                            flex: 1,
                            marginRight: 8,
                          }}
                          numberOfLines={2}
                        >
                          {step.title}
                        </Text>
                        {(step.isActive || step.isCompleted) && (
                          <View
                            style={{
                              backgroundColor: step.isCompleted ? JOB_TIMELINE.completeSoft : JOB_TIMELINE.activeSoft,
                              paddingHorizontal: 9,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontFamily: 'Poppins-SemiBold',
                                color: timelineChipText(step),
                              }}
                            >
                              {step.isCompleted ? 'Done' : 'Active'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text
                              style={{
                                fontSize: 12,
                                lineHeight: 18,
                                fontFamily: 'Poppins-Regular',
                                color: Colors.textSecondaryDark,
                              }}
                            >
                              {step.description}
                            </Text>
                          </View>
                          {(step as any).showRequestVisit && step.id === 'step-2' && (
                            <TouchableOpacity
                              onPress={() => {
                                haptics.light();
                                router.push({
                                  pathname: '/RequestVisitScreen' as any,
                                  params: {
                                    requestId: params.requestId,
                                    jobTitle: request?.jobTitle,
                                  },
                                } as any);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                backgroundColor: '#F2F8EA',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(79, 103, 57, 0.16)',
                              }}
                              activeOpacity={0.7}
                            >
                              <MapPin size={14} color={Colors.accent} style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                                Request visit
                              </Text>
                            </TouchableOpacity>
                          )}
                          {(step as any).canEdit && step.id === 'step-2b' && (
                            <TouchableOpacity
                              onPress={() => {
                                haptics.light();
                                router.push({
                                  pathname: '/SendQuotationScreen' as any,
                                  params: {
                                    requestId: params.requestId,
                                    jobTitle: request?.jobTitle,
                                    returnToTab: 'Quotations',
                                  },
                                } as any);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: BorderRadius.default,
                                backgroundColor: '#F2F8EA',
                                borderWidth: 1,
                                borderColor: 'rgba(79, 103, 57, 0.16)',
                              }}
                              activeOpacity={0.7}
                            >
                              <Edit size={14} color={Colors.accent} style={{ marginRight: 4 }} />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontFamily: 'Poppins-SemiBold',
                                  color: Colors.accent,
                                }}
                              >
                                Edit
                              </Text>
                            </TouchableOpacity>
                          )}
                          {(step as any).showStartButton && step.id === 'step-4' && (
                            <TouchableOpacity
                              onPress={async () => {
                                if (!(step as any).startButtonEnabled || isStartingJob) {
                                  if (!(step as any).startButtonEnabled) showError('Payment must be received before starting work.');
                                  return;
                                }
                                haptics.success();
                                actionCooldownUntilRef.current = Date.now() + 2500;
                                setIsStartingJob(true);
                                try {
                                  if (params.requestId) {
                                    const reqId = parseInt(params.requestId, 10);
                                    await providerService.startWorkOrder(reqId);
                                    showSuccess('Work order started! Job is now in progress.');
                                    locallyStartedRequestIdRef.current = reqId;
                                    setWorkOrderStatus('active');
                                    // Optimistic local update so UI changes immediately
                                    setRequest((prev) => (prev ? { ...prev, status: 'in_progress' as any } : prev));
                                    lastLoadTimeRef.current = Date.now();
                                    setTimeout(() => {
                                      loadRequestDetails({ silent: true });
                                    }, 1500);
                                  }
                                } catch (error: any) {
                                  haptics.error();
                                  const msg = (error?.message || '').toLowerCase();
                                  if (msg.includes('404') || msg.includes('not found') || msg.includes('does not exist')) {
                                    if (params.requestId) {
                                      locallyStartedRequestIdRef.current = parseInt(params.requestId, 10);
                                    }
                                    setWorkOrderStatus('active');
                                    setRequest((prev) => (prev ? { ...prev, status: 'in_progress' as any } : prev));
                                    showSuccess('Job started! (Sync pending)');
                                    setTimeout(() => loadRequestDetails(), 500);
                                  } else {
                                    showError(getSpecificErrorMessage(error, 'start_work_order'));
                                  }
                                } finally {
                                  setIsStartingJob(false);
                                }
                              }}
                              style={{
                                backgroundColor: (step as any).startButtonEnabled && !isStartingJob ? Colors.accent : Colors.backgroundGray,
                                paddingVertical: 9,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                minWidth: 76,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: (step as any).startButtonEnabled && !isStartingJob ? 1 : 0.5,
                              }}
                              activeOpacity={(step as any).startButtonEnabled && !isStartingJob ? 0.8 : 1}
                              disabled={!(step as any).startButtonEnabled || isStartingJob}
                            >
                              {isStartingJob ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                              ) : (
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontFamily: 'Poppins-SemiBold',
                                    color: (step as any).startButtonEnabled ? Colors.white : Colors.textSecondaryDark,
                                  }}
                                >
                                  Start
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      {step.status && (
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Regular',
                            color: step.isCompleted ? Colors.accent : step.isActive ? '#F59E0B' : Colors.textTertiary,
                            marginTop: 8,
                            lineHeight: 17,
                          }}
                        >
                          {step.status}
                        </Text>
                      )}
                    </Animated.View>
                  </Animated.View>
                );
              })}

              {request &&
                ['in_progress', 'reviewing', 'completed'].includes(request.status) && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (request.status !== 'in_progress' || isMarkingComplete) return;
                      haptics.light();
                      if (!params.requestId) return;
                      actionCooldownUntilRef.current = Date.now() + 2500;
                      setIsMarkingComplete(true);
                      try {
                        const reqId = parseInt(params.requestId, 10);
                        await providerService.markWorkComplete(reqId);
                        showSuccess('Work marked complete! Client will confirm to release payment.');
                        lastLoadTimeRef.current = Date.now();
                        await loadRequestDetails();
                      } catch (error: any) {
                        haptics.error();
                        const msg = (error?.message || '').toLowerCase();
                        if (msg.includes('404') || msg.includes('not found')) {
                          showSuccess('Work marked complete! (Sync pending – client can confirm when ready.)');
                          await loadRequestDetails();
                        } else {
                          showError(getSpecificErrorMessage(error, 'provider_mark_complete'));
                        }
                      } finally {
                        setIsMarkingComplete(false);
                      }
                    }}
                    disabled={
                      request.status !== 'in_progress' || isMarkingComplete
                    }
                    style={{
                      backgroundColor:
                        request.status === 'in_progress' && !isMarkingComplete
                          ? Colors.accent
                          : Colors.backgroundGray,
                      paddingVertical: 14,
                      borderRadius: BorderRadius.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 16,
                      borderWidth:
                        request.status !== 'in_progress' ? 1 : 0,
                      borderColor: Colors.border,
                    }}
                    activeOpacity={
                      request.status === 'in_progress' && !isMarkingComplete ? 0.8 : 1
                    }
                  >
                    {isMarkingComplete ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-SemiBold',
                          color:
                            request.status === 'in_progress'
                              ? Colors.white
                              : Colors.textSecondaryDark,
                        }}
                      >
                        {request.status === 'completed'
                          ? 'Job completed'
                          : request.status === 'reviewing'
                            ? 'Waiting for client confirmation'
                            : 'Mark as complete'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
            </View>
          )}

          {/* Work Order Details Section */}
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
                  fontSize: 15,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 14,
              }}
            >
              Work Order Details
            </Text>
              <View
                style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                {request.categoryName || 'Service Request'}
              </Text>
              <View
                style={{
                  backgroundColor: Colors.successLight,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: BorderRadius.xl,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.success,
                  }}
                >
                  {quotation?.status === 'accepted' ? 'Approved' : request.status === 'accepted' ? 'Accepted' : 'Pending'}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 14,
              }}
            >
              Order #{request.id || 'N/A'}
              </Text>
          </View>

          {/* Description Section */}
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
                fontSize: 15,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 14,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                lineHeight: 22,
              }}
            >
              {request.description || request.jobTitle || 'No description provided.'}
            </Text>
          </View>

          {/* Scheduled Date and Time */}
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
            {/* Date */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Calendar size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 3,
                  }}
                >
                  {scheduledDate || 'Date not scheduled'}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Scheduled date
                </Text>
              </View>
            </View>

            {/* Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Clock size={18} color={Colors.accent} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                {scheduledTime ? `From ${scheduledTime}` : 'Time not scheduled'}
              </Text>
            </View>
          </View>

          {/* Photos Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                }}
              >
                Photos
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/PhotosGalleryScreen' as any)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.accent,
                    marginRight: 4,
                  }}
                >
                  View all
                </Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: BorderRadius.default,
                    backgroundColor: Colors.backgroundGray,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Location Section */}
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
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <MapPin size={20} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {locationCity || 'Service Location'}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 8,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {fullLocation}
                </Text>
                
                {/* Distance and Time Info */}
                {(distanceKm !== null || travelTimeMinutes !== null) && (
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                    {distanceKm !== null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginRight: 4 }}>
                          Distance:
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                          {formatDistance(distanceKm)}
                </Text>
              </View>
                    )}
                    {travelTimeMinutes !== null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginRight: 4 }}>
                          Travel Time:
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                          {formatTravelTime(travelTimeMinutes)}
                        </Text>
            </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            {/* Navigation Buttons */}
            {location.latitude && location.longitude && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: Colors.black,
                    borderRadius: BorderRadius.default,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={async () => {
                    haptics.light();
                    await openNavigation(
                      location.latitude!,
                      location.longitude!,
                      fullLocation
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Navigation size={16} color={Colors.white} />
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                    Get Directions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: Colors.backgroundGray,
                    borderRadius: BorderRadius.default,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  onPress={async () => {
                    haptics.light();
                    await openMaps(
                      location.latitude!,
                      location.longitude!,
                      fullLocation
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={16} color={Colors.textPrimary} />
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textPrimary }}>
                    View Map
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View
              style={{
                height: 200,
                borderRadius: BorderRadius.default,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <MapView
                style={{ flex: 1 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: location.latitude || 6.5244,
                  longitude: location.longitude || 3.3792,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              />
            </View>
          </View>
          </>
            )
          ) : showUpdatesSkeleton || !request ? (
            <QuotationListSkeleton count={2} />
          ) : (
            /* Quotations Tab Content */
            <>
              {quotation ? (
                <>
              {/* Client Information Section */}
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
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 12,
                  }}
                >
                  Client Information
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Image
                    source={require('../assets/images/userimg.jpg')}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      marginRight: 12,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                        marginBottom: 3,
                      }}
                    >
                      {clientName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                        marginBottom: 4,
                      }}
                    >
                      {user?.email || 'Client'}
                    </Text>
                    {(request?.user as any)?.rating != null || (request?.user as any)?.totalReviews != null ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                          ⭐ {Number((request?.user as any)?.rating ?? 0).toFixed(1)} ({Number((request?.user as any)?.totalReviews ?? 0)})
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => makeCall(clientName, user?.phone || user?.phoneNumber || '')}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: Colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.7}
                    >
                      <Phone size={18} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                        router.push({
                          pathname: '/ChatScreen' as any,
                          params: {
                            clientName: clientName,
                            requestId: params.requestId,
                          },
                        } as any);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: Colors.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={18} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Work Order Details Section */}
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
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 12,
                  }}
                >
                  Work Order Details
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {request.categoryName || 'Service Request'}
                  </Text>
                  <View
                    style={{
                      backgroundColor: Colors.successLight,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: BorderRadius.xl,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.success,
                      }}
                    >
                      {quotation?.status === 'accepted' ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 12,
                  }}
                >
                  Order #{request.id || 'N/A'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Calendar size={18} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                        marginBottom: 3,
                      }}
                    >
                      {scheduledDate || 'Date not scheduled'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      Scheduled date
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Clock size={18} color={Colors.accent} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    {scheduledTime ? `From ${scheduledTime}` : 'Time not scheduled'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <MapPin size={18} color={Colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.textPrimary,
                        marginBottom: 3,
                      }}
                    >
                      {request.location?.address || 'Location not specified'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      {request.location?.address || 'Address'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quotation Summary Section */}
              {quotation && (() => {
                // Helper function to safely parse numeric values from API response
                // Handles strings, numbers, null, undefined, and converts to number
                const parseNumericValue = (value: any): number => {
                  if (value === null || value === undefined) return 0;
                  if (typeof value === 'number') return isNaN(value) ? 0 : value;
                  if (typeof value === 'string') {
                    // Remove commas and parse
                    const cleaned = value.replace(/,/g, '').trim();
                    const parsed = parseFloat(cleaned);
                    return isNaN(parsed) ? 0 : parsed;
                  }
                  return 0;
                };

                // Calculate materials cost from materials array
                const materialsCost = quotation.materials?.reduce((sum: number, mat: any) => {
                  // Try total first, then calculate from unitPrice * quantity
                  const total = parseNumericValue(mat.total) || 
                               (parseNumericValue(mat.unitPrice) * parseNumericValue(mat.quantity));
                  return sum + (total || 0);
                }, 0) || 0;
                
                // Parse all quotation values - handle strings, numbers, null, undefined
                const laborCost = parseNumericValue(quotation.laborCost);
                const logisticsCost = parseNumericValue(quotation.logisticsCost);
                const serviceCharge = parseNumericValue(quotation.serviceCharge);
                const tax = parseNumericValue(quotation.tax);
                
                // Calculate total - use quotation.total if valid, otherwise calculate
                const totalFromAPI = parseNumericValue(quotation.total);
                const calculatedTotal = laborCost + logisticsCost + materialsCost + serviceCharge + tax;
                const total = totalFromAPI > 0 ? totalFromAPI : calculatedTotal;
                
                return (
                <View
                  style={{
                    borderRadius: BorderRadius.xl,
                    overflow: 'hidden',
                    // Add extra margin when quotation is accepted (buttons will be shown at bottom)
                    marginBottom: quotation && quotation.status === 'accepted' ? 24 : 16,
                  }}
                >
                  {/* Header with green background */}
                  <View
                    style={{
                      backgroundColor: '#CAFF33',
                      padding: 16,
                      borderTopLeftRadius: BorderRadius.xl,
                      borderTopRightRadius: BorderRadius.xl,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                      }}
                    >
                      Quotation Summary
                    </Text>
                  </View>
                  {/* Content with white background */}
                  <View
                    style={{
                      backgroundColor: Colors.white,
                      padding: 16,
                      borderBottomLeftRadius: BorderRadius.xl,
                      borderBottomRightRadius: BorderRadius.xl,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderTopWidth: 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        Labor Cost
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.textPrimary,
                        }}
                      >
                        ₦{laborCost.toFixed(2)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        Logistics Cost
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.textPrimary,
                        }}
                      >
                        ₦{logisticsCost.toFixed(2)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        Materials cost
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-SemiBold',
                            color: Colors.textPrimary,
                            marginRight: 8,
                          }}
                        >
                          ₦{materialsCost.toFixed(2)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            // Show materials breakdown
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: 'Poppins-SemiBold',
                              color: '#3B82F6',
                            }}
                          >
                            Breakdown
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        Service charge
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.textPrimary,
                        }}
                      >
                        ₦{serviceCharge.toFixed(2)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.textPrimary,
                        }}
                      >
                        Tax
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Poppins-SemiBold',
                          color: Colors.textPrimary,
                        }}
                      >
                        ₦{tax.toFixed(2)}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 16,
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
                          fontSize: 18,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.textPrimary,
                        }}
                      >
                        ₦{total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
                );
              })()}
                </>
              ) : (
                <ProviderNoQuotationState
                  onSendQuotation={() => {
                      haptics.light();
                      router.push({
                        pathname: '/SendQuotationScreen' as any,
                        params: {
                          requestId: params.requestId,
                          jobTitle: request?.jobTitle,
                          returnToTab: 'Quotations',
                        },
                      } as any);
                    }}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Bottom Action Buttons - Fixed */}
        {request?.status !== 'completed' && !showTopProviderActions && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
            paddingTop: 16,
            paddingBottom: 32,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
          }}
        >
          {/* Job Status Icon - Small icon in top right of bottom section */}
          {request && (isFromAcceptedRequests || (request.status as string) === 'accepted' || (request.status as string) === 'in_progress' || (request.status as string) === 'completed') && (
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: CLIENT_HOME_SCROLL_GUTTER,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.successLight,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.success,
              }}
            >
              <CheckCircle2 size={18} color={Colors.success} />
            </View>
          )}
          {/* Selection Status (if provider was selected by client) */}
          {request?.selectedAt && providerId && !request.selectedProvider && request.status === 'pending' && selectionCountdown !== null && selectionCountdown > 0 && (
            <View
              style={{
                backgroundColor: '#FEF9C3',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: BorderRadius.default,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#F59E0B',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#F59E0B',
                  marginBottom: 4,
                }}
              >
                You Were Selected by Client
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: '#92400E',
                }}
              >
                Accept within {Math.floor(selectionCountdown / 60)}:{(selectionCountdown % 60).toString().padStart(2, '0')} to proceed
              </Text>
              {request.selectedAt && (
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: '#92400E',
                    marginTop: 4,
                  }}
                >
                  Selected {formatTimeAgo(request.selectedAt)}
                </Text>
              )}
            </View>
          )}

          {/* Show action buttons based on active tab */}
          {activeTab === 'Quotations' && quotation && quotation.status === 'accepted' ? (
            <>
              {/* Request Changes Button - Disabled when job started, provider marked complete, or work done */}
              {(() => {
                const workOrderIsActive = request && (
                  (request.status as string) === 'in_progress' ||
                  (request.status as string) === 'reviewing' ||
                  (request.status as string) === 'completed' ||
                  workOrderStatus === 'active'
                );
                const canRequestChanges = !workOrderIsActive;
                
                return (
                  <TouchableOpacity
                    style={{
                      backgroundColor: canRequestChanges ? '#FFF7ED' : Colors.backgroundGray,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      flexDirection: 'row',
                      borderWidth: 1,
                      borderColor: canRequestChanges ? '#F97316' : Colors.border,
                      opacity: canRequestChanges ? 1 : 0.5,
                    }}
                    activeOpacity={canRequestChanges ? 0.8 : 1}
                    disabled={!canRequestChanges}
                    onPress={() => {
                      if (!canRequestChanges) {
                        showError('Cannot request changes after job has started.');
                        return;
                      }
                      haptics.light();
                      // TODO: Implement request changes functionality
                    }}
                  >
                    <CheckCircle2 
                      size={16} 
                      color={canRequestChanges ? "#F97316" : Colors.textSecondaryDark} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: canRequestChanges ? '#F97316' : Colors.textSecondaryDark,
                      }}
                    >
                      Request changes
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Message Administrator Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.backgroundGray,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
                  router.push({
                    pathname: '/ChatScreen',
                    params: {
                      clientName: clientName,
                      requestId: params.requestId,
                    },
                  } as any);
                }}
              >
                <MessageSquare size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Message Administrator
                </Text>
              </TouchableOpacity>
            </>
          ) : request && providerBottomBarEngaged ? (
            <>
              {/* Request visit & Send quote - persistent actions when no quotation sent */}
              {!recordShowsSentQuotation(quotation) && !recordShowsSentQuotation(quotationWithProvider) && (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {(() => {
                    const vr = (request as any)?.visitRequest;
                    const visitStatus = (vr?.logisticsStatus || '').toString().toLowerCase();
                    const visitDeclined = ['cancelled', 'declined', 'rejected'].includes(visitStatus);
                    const visitAlreadyRequested = !!(vr && (
                      vr.scheduledDate ||
                      vr.scheduledTime ||
                      vr.requestedAt ||
                      vr.logisticsStatus ||
                      vr.logisticsCost != null
                    ));
                    if (visitAlreadyRequested || visitDeclined) return null;
                    return (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: Colors.backgroundGray,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                    activeOpacity={0.8}
                    onPress={() => {
                      haptics.light();
                      router.push({
                        pathname: '/RequestVisitScreen' as any,
                        params: { requestId: params.requestId, jobTitle: request?.jobTitle },
                      } as any);
                    }}
                  >
                    <MapPin size={16} color={Colors.accent} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                      Request visit
                    </Text>
                  </TouchableOpacity>
                    );
                  })()}
                  {!(currentVisitRequested && !currentVisitDeclined && !currentVisitPaid) && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: Colors.accent,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                    activeOpacity={0.8}
                    onPress={() => {
                      haptics.light();
                      router.push({
                        pathname: '/SendQuotationScreen' as any,
                        params: { requestId: params.requestId, jobTitle: request?.jobTitle, returnToTab: 'Quotations' },
                      } as any);
                    }}
                  >
                    <FileText size={16} color={Colors.white} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                      Send quote
                    </Text>
                  </TouchableOpacity>
                  )}
                </View>
              )}
              {/* Message Client Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
                  router.push({
                    pathname: '/ChatScreen',
                    params: {
                      clientName: clientName,
                      requestId: params.requestId,
                    },
                  } as any);
                }}
              >
                <MessageCircle size={16} color={Colors.white} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Message Client
                </Text>
              </TouchableOpacity>
            </>
          ) : request &&
            request.status === 'pending' &&
            !isFromAcceptedRequests &&
            !(request as any)?.visitRequest &&
            !recordShowsSentQuotation(quotation) &&
            !recordShowsSentQuotation(quotationWithProvider) ? (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  flexDirection: 'row',
                  opacity: isAccepting || isRejecting ? 0.6 : 1,
                }}
                onPress={handleProceedClick}
                disabled={isAccepting || isRejecting}
                activeOpacity={0.8}
              >
                {isAccepting ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                      }}
                    >
                      Processing...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.white,
                    }}
                  >
                    Proceed
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FEE2E2',
                  paddingVertical: 12,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  opacity: isAccepting || isRejecting ? 0.6 : 1,
                }}
                onPress={handleRejectRequest}
                disabled={isAccepting || isRejecting}
                activeOpacity={0.8}
              >
                {isRejecting ? (
                  <>
                    <ActivityIndicator size="small" color="#DC2626" style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#DC2626',
                      }}
                    >
                      Rejecting...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: '#DC2626',
                    }}
                  >
                    Decline
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.accent,
                paddingVertical: 12,
                borderRadius: BorderRadius.default,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                if (params.requestId) {
                  router.push({
                    pathname: '/SendQuotationScreen',
                    params: {
                      requestId: params.requestId,
                      jobTitle: request?.jobTitle,
                      returnToTab: 'Quotations',
                    },
                  } as any);
                }
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                }}
              >
                Send Quotation
              </Text>
            </TouchableOpacity>
          )}
        </View>
        )}
      </View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />

      {/* Proceed Modal */}
      <Modal
        visible={showProceedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProceedModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              How do you want to proceed?
            </Text>

            {/* Option 1: Request Visit */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  flex: 1,
                }}
              >
                I need to visit first
              </Text>
              <TouchableOpacity
                onPress={() => handleAcceptRequest('visit')}
                style={{
                  backgroundColor: Colors.backgroundGray,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: BorderRadius.default,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Request visit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Option 2: Send Quote */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  flex: 1,
                }}
              >
                I&apos;m ready to give a price
              </Text>
              <TouchableOpacity
                onPress={() => handleAcceptRequest('quote')}
                style={{
                  backgroundColor: Colors.black,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: BorderRadius.default,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                  }}
                >
                  Send Quote
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setShowProceedModal(false);
              }}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completed Actions Modal */}
      <Modal
        visible={showCompletedActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletedActionsModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            activeOpacity={1}
            onPress={() => setShowCompletedActionsModal(false)}
          />

          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 14,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <SageHeroPanel style={{ marginBottom: 12 }} useMetricsPadding>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255, 255, 255, 0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <CheckCircle2 size={22} color={Colors.white} strokeWidth={2.4} />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.white,
                      marginBottom: 4,
                    }}
                  >
                    Job completed
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: '#E5E7EB',
                      lineHeight: 18,
                    }}
                  >
                    This job is closed. View the receipt or report a problem if something needs attention.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCompletedActionsModal(false)}
                  activeOpacity={0.8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.11)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <X size={16} color={Colors.white} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </SageHeroPanel>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  ...providerListCard,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                }}
                activeOpacity={0.85}
                onPress={() => {
                  haptics.light();
                  setShowCompletedActionsModal(false);
                  router.push({
                    pathname: '/ProviderReceiptScreen' as any,
                    params: { requestId: params.requestId },
                  } as any);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Receipt size={18} color={Colors.white} strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                      View receipt
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 2, lineHeight: 16 }}>
                      Amount, service, and payment details
                    </Text>
                  </View>
                </View>
                <ArrowRight size={16} color={Colors.textSecondaryDark} strokeWidth={2.4} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  ...providerListCard,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                }}
                activeOpacity={0.85}
                onPress={() => {
                  if (!request) return;
                  haptics.light();
                  setShowCompletedActionsModal(false);
                  router.push({
                    pathname: '/ReportIssueScreen' as any,
                    params: {
                      requestId: params.requestId,
                      jobTitle: request.categoryName || 'Service Request',
                      orderNumber: `Order #${request.id || 'N/A'}`,
                      cost: quotation?.total ? `₦${quotation.total.toFixed(2)}` : 'N/A',
                      assignee: clientName,
                      completionDate: request.updatedAt ? formatDate(request.updatedAt) : 'N/A',
                    },
                  } as any);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.errorLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: Colors.errorBorder,
                    }}
                  >
                    <Activity size={18} color={Colors.error} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                      Report an issue
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 2, lineHeight: 16 }}>
                      Get support for this completed job
                    </Text>
                  </View>
                </View>
                <ExternalLink size={15} color={Colors.error} strokeWidth={2.3} />
              </TouchableOpacity>

              <View
                style={{
                  ...providerListCard,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: Colors.backgroundGray,
                  marginBottom: 0,
                }}
              >
                <CheckCircle2 size={16} color={Colors.accent} style={{ marginRight: 8, marginTop: 1 }} strokeWidth={2.4} />
                <Text style={{ flex: 1, fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, lineHeight: 17 }}>
                  Payment and completion details are saved for your records.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
