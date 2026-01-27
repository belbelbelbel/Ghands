import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, MessageCircle, Phone, CheckCircle2, Edit, MessageSquare, Activity, FileText, CreditCard, Wrench, CheckCircle, Circle, Wallet, Receipt } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Animated, Modal } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { providerService, serviceRequestService, ServiceRequest, Quotation, apiClient } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import MaterialsAccordion from '@/components/MaterialsAccordion';
import { calculateDistance, estimateTravelTime, formatDistance, formatTravelTime, openNavigation, openMaps } from '@/utils/navigationUtils';
import { authService } from '@/services/api';
import { makeCall } from '@/utils/callUtils';

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
};

export default function ProviderJobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const [workOrderStatus, setWorkOrderStatus] = useState<'pending' | 'in_progress' | 'active'>('pending');

  // Update work order status based on request and quotation status
  useEffect(() => {
    if (request && quotation) {
      if (quotation.status === 'accepted') {
        // Work order is in progress (yellow) when quotation accepted
        if (request.status === 'in_progress' || request.status === 'completed') {
          setWorkOrderStatus('active'); // Green when job started
        } else {
          setWorkOrderStatus('in_progress'); // Yellow when quotation accepted but not started
        }
      } else {
        setWorkOrderStatus('pending');
      }
    } else {
      setWorkOrderStatus('pending');
    }
  }, [request, quotation]);

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

  // Load request details
  useEffect(() => {
    if (params.requestId) {
      loadRequestDetails();
    }
  }, [params.requestId]);

  const loadRequestDetails = async () => {
    if (!params.requestId) return;
    
    setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);
      
      // Validate requestId
      if (isNaN(requestId) || requestId <= 0) {
        showError('Invalid request ID');
        setIsLoading(false);
        return;
      }
      
      if (__DEV__) {
        console.log('🔍 [ProviderJobDetailsScreen] Loading request details:', {
          requestId,
          requestIdType: typeof requestId,
          paramsRequestId: params.requestId,
        });
      }
      
      let requestDetails: ServiceRequest | null = null;
      let usedFallback = false;
      
      // Try to get request details directly
      try {
        requestDetails = await serviceRequestService.getRequestDetails(requestId);
      } catch (directError: any) {
        // If direct call fails with 500, try to get from accepted requests
        const status = (directError as any)?.status || (directError as any)?.response?.status;
        if (status === 500 || status === 404) {
          // Suppress error logging for expected 500 errors that will use fallback
          // This is expected behavior when providers access client endpoints
          
          try {
            // Fallback: Get from accepted requests list
            const acceptedRequests = await providerService.getAcceptedRequests();
            requestDetails = acceptedRequests.find(req => req.id === requestId) || null;
            
            if (!requestDetails) {
              throw new Error('Request not found in accepted requests');
            }
            
            usedFallback = true; // Mark that we used fallback successfully
            setIsFromAcceptedRequests(true); // Mark that this request is from accepted requests (provider has accepted)
            // Don't log error since fallback succeeded - this is expected behavior
          } catch (fallbackError) {
            // Both methods failed - only log if fallback also failed
            if (__DEV__) {
              console.error('🔍 [ProviderJobDetailsScreen] Both direct and fallback failed:', {
                directError: directError?.message,
                fallbackError: fallbackError,
              });
            }
            throw directError; // Throw original error
          }
        } else {
          // Not a 500/404, throw the error
          throw directError;
        }
      }
      
      // If we successfully used fallback, suppress the error log from the API service
      // The error was already handled and we got the data successfully
      if (usedFallback && __DEV__) {
        console.log('ℹ️ [ProviderJobDetailsScreen] Using fallback data - direct endpoint not accessible to providers');
      }
      
      if (!requestDetails) {
        showError('Job details not found');
        setIsLoading(false);
        return;
      }
      
      setRequest(requestDetails);
      
      // Check if this request is in accepted requests (even if direct call succeeded)
      // This helps determine if provider has already accepted it
      if (!isFromAcceptedRequests) {
        try {
          const acceptedRequests = await providerService.getAcceptedRequests();
          const isAccepted = acceptedRequests.some(req => req.id === requestId);
          if (isAccepted) {
            setIsFromAcceptedRequests(true);
            if (__DEV__) {
              console.log('✅ [ProviderJobDetailsScreen] Request found in accepted requests');
            }
          }
        } catch (error) {
          // Silently fail - not critical
        }
      }
      
      // Distance calculation will happen in useEffect when both locations are available
      // This ensures it works even if providerLocation loads after requestDetails
      
      // If request is accepted, try to load quotation
      if (requestDetails.status === 'accepted' || requestDetails.status === 'in_progress' || isFromAcceptedRequests) {
        loadQuotation(requestId);
        // Also load quotations list to get QuotationWithProvider
        try {
          const quotations = await serviceRequestService.getQuotations(requestId);
          if (quotations && quotations.length > 0 && providerId) {
            const providerQuotation = quotations.find(q => q.provider?.id === providerId);
            if (providerQuotation) {
              setQuotationWithProvider(providerQuotation);
            }
          }
        } catch {
          // Quotation might not exist yet
        }
      }
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        setIsLoading(false);
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
            return;
          }
          // If we have a token but still getting 500, it might be a backend issue
          // Show a more specific error message
          showError('Unable to load job details. The job may have been removed or you may not have access to it.');
          setIsLoading(false);
          return;
        } catch (tokenError) {
          // Can't get token = redirect
          await handleAuthErrorRedirect(router);
          setIsLoading(false);
          return;
        }
      }
      
      // Only log/show error if fallback didn't succeed
      // If we used fallback successfully, don't show error to user
      if (!usedFallback) {
        const status = (error as any)?.status || (error as any)?.response?.status;
        
        // For 500 errors, check if we should show error or if fallback should handle it
        if (status === 500) {
          // 500 errors are often expected for provider access - don't show error
          // The fallback mechanism should have handled it
          if (__DEV__) {
            console.warn('⚠️ [ProviderJobDetailsScreen] 500 error occurred - this may be expected for provider access');
          }
        } else {
          // For non-500 errors, show error to user
          if (__DEV__) {
      console.error('Error loading request details:', error);
          }
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
        }
      }
      // If usedFallback is true, we successfully got data from fallback, so no error to show
    } finally {
      setIsLoading(false);
    }
  };

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
      await providerService.acceptRequest(requestId);
      
      haptics.success();
      
      if (proceedType === 'visit') {
        showSuccess('Request accepted! You can now schedule a visit for inspection.');
        // Navigate to schedule visit or stay on page
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
      
      haptics.success();
      showSuccess('Request rejected successfully');
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      if (__DEV__) {
      console.error('Error rejecting request:', error);
      }
      haptics.error();
      
      const errorMessage = getSpecificErrorMessage(error, 'reject_request');
      showError(errorMessage);
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
      title: 'Job Request Received',
      description: 'Awaiting your quotation',
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
      const isThisProviderSelected = request.selectedProvider?.id && 
        providerId === request.selectedProvider.id;
      
      if (isThisProviderSelected && request.status === 'accepted') {
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

    // Step 2: Inspection & Quotation
    // Show as yellow (in progress) when provider has accepted but quotation not sent/accepted yet
    // Show as green when quotation is accepted
    if (isFromAcceptedRequests || request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') {
      // Provider has accepted - check if quotation exists and is accepted
      if (quotationWithProvider && quotationWithProvider.status === 'accepted') {
        // Quotation accepted - green (completed)
        timeline.push({
          id: 'step-2',
          title: 'Inspection & Quotation',
          description: 'Waiting for client approval & payment.',
          status: `Completed - ${formatTimeAgo(quotationWithProvider.sentAt || request.updatedAt || '')}`,
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          lineColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: FileText,
          canEdit: true, // Can edit even when completed
        });
      } else if (quotationWithProvider && (quotationWithProvider.sentAt || quotationWithProvider.status !== 'draft')) {
        // Quotation sent but not accepted yet - yellow (in progress)
        timeline.push({
          id: 'step-2',
          title: 'Inspection & Quotation',
          description: 'Waiting for client approval & payment.',
          status: `Sent - ${formatTimeAgo(quotationWithProvider.sentAt || '')}`,
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          lineColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: FileText,
          canEdit: true, // Can edit while waiting
        });
      } else {
        // Provider accepted but no quotation sent yet - yellow (in progress)
        timeline.push({
          id: 'step-2',
          title: 'Inspection & Quotation',
          description: 'Waiting for client approval & payment.',
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          lineColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: FileText,
          canEdit: true, // Can edit/send quotation
        });
      }
    } else {
      // Provider hasn't accepted yet - gray (pending)
      timeline.push({
        id: 'step-2',
        title: 'Inspection & Quotation',
        description: 'Send quotation to client',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        lineColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
        canEdit: false,
      });
    }

    // Step 3: Quotation Accepted (only show if quotation is accepted)
    if (quotationWithProvider && quotationWithProvider.status === 'accepted') {
      timeline.push({
        id: 'step-3',
        title: 'Quotation Accepted',
        description: 'Client Accepted your quote',
        status: `Completed - ${formatTimeAgo(quotationWithProvider.sentAt || request.updatedAt || '')}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
      
      // Step 3.5: Work order assigned (shows after quotation accepted)
      // Yellow when quotation accepted, green when Start button clicked
      const workOrderIsActive = workOrderStatus === 'active' || request.status === 'in_progress' || request.status === 'completed';
      timeline.push({
        id: 'step-3.5',
        title: 'Work order assigned',
        description: 'Payment secured in Escrow. You are authorized to start.',
        status: workOrderIsActive ? `Completed - ${formatTimeAgo(request.updatedAt || '')}` : 'In Progress',
        accent: workOrderIsActive ? '#DCFCE7' : '#FEF9C3',
        dotColor: workOrderIsActive ? '#6A9B00' : '#F59E0B',
        lineColor: workOrderIsActive ? '#6A9B00' : '#F59E0B',
        isActive: !workOrderIsActive,
        isCompleted: workOrderIsActive,
        icon: CheckCircle2,
        showStartButton: !workOrderIsActive, // Show Start button when not active
      });
    } else if (quotationWithProvider && (quotationWithProvider.sentAt || quotationWithProvider.status !== 'draft')) {
      // Quotation sent but not accepted yet - don't show Quotation Accepted or Work order
      // (they will appear once quotation is accepted)
    } else {
      // No quotation sent yet - show pending
      timeline.push({
        id: 'step-3',
        title: 'Quotation Accepted',
        description: 'Waiting for client to accept quotation',
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
    // Show as yellow when work order is active (Start button clicked)
    // Show as green when job is completed
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'You are Onsite!',
        status: 'Completed',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        lineColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else if (request.status === 'in_progress' || workOrderStatus === 'active') {
      // Job in progress - yellow
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'You are Onsite!',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        lineColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'Waiting for work order to start',
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
        description: 'Job Approved',
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
        description: 'Job Approved',
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
  }, [request, quotationWithProvider, selectionCountdown, providerId]);

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

  // Get user info from request
  const user = request?.user || {};
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
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
  const formatDateForStatus = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };
  
  const statusDate = request?.scheduledDate ? formatDateForStatus(request.scheduledDate) : '';

  // Determine current status message for provider
  const statusMessage = useMemo(() => {
    if (!request) return null;

    // If job is completed
    if (request.status === 'completed') {
      return {
        title: 'Job completed',
        message: `Job was completed successfully`,
        showDetails: false,
      };
    }

    // If job is in progress
    if (request.status === 'in_progress') {
      return {
        title: 'Job in progress',
        message: `You are currently working on this job`,
        showDetails: true,
      };
    }

    // If quotation was accepted
    if (quotationWithProvider?.status === 'accepted' || (request.status === 'accepted' && quotation)) {
      return {
        title: 'Quotation accepted',
        message: `${clientName} accepted your quotation`,
        showDetails: true,
        logisticsFee: quotation?.total || quotationWithProvider?.total,
      };
    }

    // If quotation was sent but not accepted yet
    if (quotationWithProvider && quotationWithProvider.status === 'pending') {
      return {
        title: 'Quotation sent',
        message: `Waiting for ${clientName} to approve the quotation`,
        showDetails: true,
        logisticsFee: quotationWithProvider.total,
      };
    }

    // If provider was selected by client but hasn't accepted yet
    if (request.selectedAt && !request.selectedProvider && selectionCountdown !== null && selectionCountdown > 0) {
      return {
        title: 'You were selected',
        message: `Waiting for you to accept the selection`,
        showDetails: true,
      };
    }

    // If provider has accepted but no quotation sent yet
    if (isFromAcceptedRequests && !quotationWithProvider) {
      return {
        title: 'Request accepted',
        message: `Waiting for you to send a quotation`,
        showDetails: true,
      };
    }

    // If request is pending and provider hasn't accepted
    if (request.status === 'pending' && !isFromAcceptedRequests) {
      return {
        title: 'New request',
        message: `Waiting for you to accept this request`,
        showDetails: true,
      };
    }

    // Default fallback
    return {
      title: 'Request received',
      message: `Processing your request`,
      showDetails: true,
    };
  }, [request, quotationWithProvider, clientName, isFromAcceptedRequests, selectionCountdown, quotation]);

  if (isLoading) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.white}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginTop: 16 }}>
            Loading job details...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!request) {
    return (
      <SafeAreaWrapper backgroundColor={Colors.white}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 8 }}>
            Job not found
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 20 }}>
            The job details could not be loaded. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: Colors.accent,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: BorderRadius.default,
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
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
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            marginBottom: 8,
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
            Job Details
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
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
                fontSize: 15,
                fontFamily: activeTab === 'Updates' ? 'Poppins-Bold' : 'Poppins-Regular',
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
                fontSize: 15,
                fontFamily: activeTab === 'Quotations' ? 'Poppins-Bold' : 'Poppins-Regular',
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
            paddingHorizontal: 20,
            paddingBottom: 120,
          }}
        >
          {activeTab === 'Updates' ? (
            <>
          {/* Work Order Assigned Card - Show when quotation exists */}
          {quotation && (
            <View
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: BorderRadius.xl,
                padding: 16,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#F97316',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#F97316',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <CheckCircle2 size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Work Order Assigned
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  Review details and accept to proceed.
                </Text>
              </View>
            </View>
          )}

          {/* Client Information Section */}
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
                  }}
                >
                  {user.email || 'Client'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: 2,
                  }}
                >
                  Member since
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Jan 2023
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
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
                  flex: 1,
                  backgroundColor: Colors.accent,
                  borderRadius: BorderRadius.default,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Phone size={18} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Colors.accent,
                  borderRadius: BorderRadius.default,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: '/ChatScreen',
                    params: {
                      clientName: 'Lawal Johnson',
                      providerId: 'provider-1',
                    },
                  } as any);
                }}
              >
                <MessageCircle size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Message Card - Above Timeline */}
          {statusMessage && (
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
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                {statusMessage.title}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginBottom: statusMessage.showDetails ? 12 : 0,
                }}
              >
                {statusMessage.message}
              </Text>
              
              {statusMessage.showDetails && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {/* Date and Time */}
                  {(statusDate || scheduledTime) && (
                    <View
                      style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
                      <Calendar size={16} color="#3B82F6" style={{ marginRight: 8 }} />
                      <Text
                        style={{
                          fontSize: 13,
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
                  
                  {/* Logistics Fee */}
                  {statusMessage.logisticsFee && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Wallet size={16} color={Colors.accent} style={{ marginRight: 8 }} />
                      <Text
                        style={{
                          fontSize: 13,
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
          )}

          {/* Timeline Section - Right after status message */}
          {request && timelineSteps.length > 0 && (
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
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 16,
                }}
              >
                Job Timeline
              </Text>
              {timelineSteps.map((step, index) => {
                const isLast = index === timelineSteps.length - 1;
                const IconComponent = step.icon || Circle;
                const iconSize = step.isCompleted || step.isActive ? 20 : 16;
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
                    <View style={{ alignItems: 'center', marginRight: 16 }}>
                      <Animated.View
              style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
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
                            width: 3,
                            flex: 1,
                            backgroundColor: step.isCompleted ? step.lineColor : step.isActive ? step.lineColor : '#E5E7EB',
                            marginTop: 8,
                            borderRadius: 2,
                            minHeight: 40,
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
                          fontSize: 14,
                          fontFamily: 'Poppins-Bold',
                          color: Colors.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {step.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Poppins-Regular',
                            color: Colors.textSecondaryDark,
                            marginBottom: 4,
                            flex: 1,
                          }}
                        >
                          {step.description}
                        </Text>
                        {/* Edit button for Inspection & Quotation */}
                        {(step as any).canEdit && step.id === 'step-2' && (
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
                              marginLeft: 8,
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: 'Poppins-SemiBold',
                                color: '#3B82F6',
                                marginRight: 4,
                              }}
                            >
                              Edit
                            </Text>
                            <Edit size={14} color="#3B82F6" />
                          </TouchableOpacity>
                        )}
                        {/* Start button for Work order assigned */}
                        {(step as any).showStartButton && step.id === 'step-3.5' && (
                          <TouchableOpacity
                            onPress={async () => {
                              haptics.success();
                              try {
                                // Update work order status to active
                                setWorkOrderStatus('active');
                                // Update request status to in_progress
                                if (params.requestId) {
                                  // TODO: Call API to update work order status
                                  // await providerService.startWorkOrder(parseInt(params.requestId, 10));
                                  showSuccess('Work order started! Job is now in progress.');
                                  // Reload to update timeline
                                  setTimeout(() => {
                                    loadRequestDetails();
                                  }, 500);
                                }
                              } catch (error) {
                                showError('Failed to start work order. Please try again.');
                              }
                            }}
                            style={{
                              backgroundColor: Colors.accent,
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: BorderRadius.default,
                              marginLeft: 8,
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: 'Poppins-SemiBold',
                                color: Colors.white,
                              }}
                            >
                              Start
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {step.status && (
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Poppins-Regular',
                            color: step.isCompleted ? Colors.accent : step.isActive ? '#F59E0B' : Colors.textTertiary,
                            marginTop: 4,
                          }}
                        >
                          {step.status}
                        </Text>
                      )}
                    </Animated.View>
                  </Animated.View>
                );
              })}
              
              {/* Mark as Complete Button - Only show when job is in progress */}
              {request && request.status === 'in_progress' && (
                <TouchableOpacity
                  onPress={async () => {
                    haptics.light();
                    try {
                      if (params.requestId) {
                        // TODO: Call API to mark job as complete
                        // await serviceRequestService.completeRequest(parseInt(params.requestId, 10));
                        showSuccess('Job marked as complete!');
                        loadRequestDetails();
                      }
                    } catch (error) {
                      showError('Failed to mark job as complete. Please try again.');
                    }
                  }}
                  style={{
                    backgroundColor: Colors.backgroundGray,
                    paddingVertical: 14,
                    borderRadius: BorderRadius.default,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 16,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    Mark as complete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Work Order Details Section */}
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
                marginBottom: 12,
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
                marginBottom: 12,
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
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 10,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                lineHeight: 20,
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
              padding: 14,
              marginBottom: 16,
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
          ) : (
            /* Quotations Tab Content */
            <>
              {quotation ? (
                <>
              {/* Work Order Assigned Banner */}
              {quotation && (
                <View
                  style={{
                    backgroundColor: '#FFF7ED',
                    borderRadius: BorderRadius.xl,
                    padding: 16,
                    marginBottom: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: '#F97316',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: '#F97316',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <CheckCircle2 size={20} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      Work Order Assigned
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Regular',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      Review details and accept to proceed.
                    </Text>
                  </View>
                </View>
              )}

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
                      {user.email || 'Client'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                        ⭐ 4.8 (127 reviews)
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => makeCall(clientName, user.phone || '')}
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
              {quotation && (
                <View
                  style={{
                    borderRadius: BorderRadius.xl,
                    overflow: 'hidden',
                    marginBottom: 16,
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
                        ₦{quotation.laborCost?.toFixed(2) || '0.00'}
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
                        ₦{quotation.logisticsCost?.toFixed(2) || '0.00'}
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
                          ₦{quotation.materialsCost?.toFixed(2) || '0.00'}
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
                        ₦{quotation.serviceCharge?.toFixed(2) || '0.00'}
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
                        ₦{quotation.tax?.toFixed(2) || '0.00'}
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
                        ₦{quotation.total?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
                </>
              ) : (
                /* No Quotation - Empty State */
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 20,
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 24,
                    }}
                  >
                    <FileText size={40} color={Colors.textSecondaryDark} />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginBottom: 8,
                      textAlign: 'center',
                    }}
                  >
                    No Quotation Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      textAlign: 'center',
                      marginBottom: 32,
                      lineHeight: 20,
                    }}
                  >
                    A quotation hasn't been sent for this job yet.{'\n'}
                    Once a quotation is sent and accepted, you'll see the details here.
                  </Text>
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
                      backgroundColor: Colors.accent,
                      paddingVertical: 14,
                      paddingHorizontal: 32,
                      borderRadius: BorderRadius.default,
                      alignItems: 'center',
                      justifyContent: 'center',
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
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Bottom Action Buttons - Fixed */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Job Status Icon - Small icon in top right of bottom section */}
          {request && (isFromAcceptedRequests || request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') && (
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: 20,
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
              {/* Request Changes Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFF7ED',
                  paddingVertical: 12,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: '#F97316',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
                  // TODO: Implement request changes functionality
                }}
              >
                <CheckCircle2 size={16} color="#F97316" style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: '#F97316',
                  }}
                >
                  Request changes
                </Text>
              </TouchableOpacity>

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

              {/* Start Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  paddingVertical: 14,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.success();
                  // TODO: Implement start job functionality
                  showSuccess('Job started!');
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Start
                </Text>
              </TouchableOpacity>
            </>
          ) : request && request.status === 'completed' ? (
            <>
              {/* View Receipt Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  paddingVertical: 14,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginBottom: 12,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
                  router.push({
                    pathname: '/ProviderReceiptScreen' as any,
                    params: {
                      requestId: params.requestId,
                    },
                  } as any);
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                    marginRight: 8,
                  }}
                >
                  View receipt
                </Text>
                <ArrowRight size={16} color={Colors.white} />
              </TouchableOpacity>

              {/* Report Issue Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#FEE2E2',
                  paddingVertical: 14,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.error,
                  marginBottom: 12,
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
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
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.error,
                  }}
                >
                  Report Issue
                </Text>
              </TouchableOpacity>

              {/* Job Completed Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#4B5563',
                  paddingVertical: 14,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.success();
                  // Job is already completed
                  showSuccess('Job completed successfully!');
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Job Completed
                </Text>
              </TouchableOpacity>
            </>
          ) : request && (isFromAcceptedRequests || request.status === 'accepted' || request.status === 'in_progress') ? (
            <>
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
          ) : request && request.status === 'pending' && !isFromAcceptedRequests ? (
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
            paddingHorizontal: 20,
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
                I'm ready to give a price
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
    </SafeAreaWrapper>
  );
}
