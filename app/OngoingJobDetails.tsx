import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { analytics } from '@/services/analytics';
import { serviceRequestService, ServiceRequest, QuotationWithProvider } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Colors } from '@/lib/designSystem';
import { CheckCircle2, FileText, Wrench, CheckCircle, Clock, Circle } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

// Generate nice dummy quotations from accepted providers
const generateDummyQuotations = (acceptedProviders: any[], categoryName?: string): Quotation[] => {
  if (!acceptedProviders || acceptedProviders.length === 0) return [];

  const category = categoryName?.toLowerCase() || 'plumbing';

  // Service breakdowns based on category
  const serviceBreakdowns: Record<string, Array<{ service: string; price: string }>> = {
    plumbing: [
      { service: 'Complete faucet assessment', price: 'Free' },
      { service: 'High-quality cartridge & seals', price: '$40' },
      { service: 'Professional installation', price: '$25' },
    ],
    electrical: [
      { service: 'Electrical inspection', price: '$20' },
      { service: 'Wiring repairs', price: '$45' },
      { service: 'Safety testing', price: '$15' },
    ],
    carpentry: [
      { service: 'Material assessment', price: 'Free' },
      { service: 'Premium wood materials', price: '$55' },
      { service: 'Expert craftsmanship', price: '$35' },
    ],
    painting: [
      { service: 'Surface preparation', price: '$30' },
      { service: 'Premium paint materials', price: '$50' },
      { service: 'Professional painting', price: '$40' },
    ],
  };

  // Payment terms templates
  const paymentTermsTemplates = [
    [
      { text: '50% upfront, 50% on completion' },
      { text: 'All payment methods accepted' },
      { text: '90-day warranty on parts and labor' },
      { text: 'Money-back guarantee' },
    ],
    [
      { text: 'Full payment on completion' },
      { text: 'Cash, card, or mobile payment' },
      { text: '60-day warranty on all work' },
      { text: 'Satisfaction guaranteed' },
    ],
    [
      { text: '30% deposit, 70% on completion' },
      { text: 'Multiple payment options' },
      { text: '1-year warranty included' },
      { text: '24/7 support available' },
    ],
  ];

  // Quote amounts (varied for demo)
  const baseAmounts = [65, 75, 85, 95, 120, 150];

  return acceptedProviders.map((item, index) => {
    const breakdown = serviceBreakdowns[category] || serviceBreakdowns.plumbing;
    const paymentTerms = paymentTermsTemplates[index % paymentTermsTemplates.length];
    const baseAmount = baseAmounts[index % baseAmounts.length];
    const quoteAmount = `$${baseAmount}`;

    // Calculate total from breakdown (or use base amount)
    const totalFromBreakdown = breakdown.reduce((sum, item) => {
      const price = item.price === 'Free' ? 0 : parseFloat(item.price.replace('$', '')) || 0;
      return sum + price;
    }, 0);
    const finalAmount = totalFromBreakdown > 0 ? totalFromBreakdown : baseAmount;

    return {
      id: `quote-${item.provider.id}`,
      providerName: item.provider.name,
      providerType: 'Professional Service Provider',
      providerImage: require('../assets/images/plumbericon2.png'), // Default icon
      quoteAmount: `$${finalAmount}`,
      serviceBreakdown: breakdown.map(item => ({
        ...item,
        price: item.price === 'Free' ? 'Free' : item.price,
      })),
      paymentTerms,
      providerId: item.provider.id,
      distanceKm: item.distanceKm,
      minutesAway: item.minutesAway,
      acceptanceId: item.acceptance.id,
      acceptedAt: item.acceptance.acceptedAt,
    };
  });
};

const TAB_ITEMS: Array<'Updates' | 'Quotations'> = ['Updates', 'Quotations'];

interface ServiceBreakdownItem {
  service: string;
  price: string;
}

interface PaymentTerm {
  text: string;
}

interface Quotation {
  id: string;
  providerName: string;
  providerType: string;
  providerImage: any; // URI or require path (ImageSourcePropType)
  quoteAmount: string;
  serviceBreakdown: ServiceBreakdownItem[];
  paymentTerms: PaymentTerm[];
}

// Extended Quotation interface
interface ExtendedQuotation extends Quotation {
  providerId: number;
  distanceKm?: number;
  minutesAway?: number;
  acceptanceId?: number;
  acceptedAt?: string;
}

export default function OngoingJobDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { toast, showError, showSuccess, hideToast } = useToast();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [acceptedProviders, setAcceptedProviders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<QuotationWithProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const quoteCardAnim = useRef(new Animated.Value(1)).current;
  
  // Selection flow state
  const [isSelectingProvider, setIsSelectingProvider] = useState(false);
  const [selectionCountdown, setSelectionCountdown] = useState<number | null>(null);

  // Generate timeline from request data - Shows all steps with proper status colors
  const timelineSteps = useMemo(() => {
    if (!request) return [];

    const timeline = [];

    // Step 1: Job Request Submitted (always completed)
    // Show how many providers the request was sent to (from nearbyProviders if available)
    const totalProvidersSentTo = request.nearbyProviders?.length || acceptedProviders.length || 0;
    timeline.push({
      id: 'step-1',
      title: 'Job Request Submitted',
      description: totalProvidersSentTo > 0 
        ? `Request sent to ${totalProvidersSentTo} ${totalProvidersSentTo === 1 ? 'provider' : 'providers'}`
        : 'Job request submitted successfully',
      status: `Completed - ${formatTimeAgo(request.createdAt || new Date().toISOString())}`,
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
      isActive: false,
      isCompleted: true,
      icon: CheckCircle2,
    });

    // Step 1.5: Provider Selection (if applicable)
    if (request?.selectedProvider || request?.selectedAt) {
      if (request.status === 'accepted' && request.selectedProvider) {
        // Provider accepted selection
        timeline.push({
          id: 'step-1.5',
          title: 'Provider Selected',
          description: `${request.selectedProvider.name} accepted your selection`,
          status: `Completed - ${formatTimeAgo(request.updatedAt || request.selectedAt || '')}`,
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
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
          title: 'Provider Selected',
          description: `Waiting for provider to accept (${mins}:${secs.toString().padStart(2, '0')} remaining)`,
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      } else if (request.selectedAt) {
        // Selection pending (no countdown available)
        timeline.push({
          id: 'step-1.5',
          title: 'Provider Selected',
          description: 'Waiting for provider to accept (5 minutes)',
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      }
    }

    // Step 2: Provider Acceptance (NEW STEP - shows when providers accept)
    const hasAcceptedProviders = acceptedProviders && acceptedProviders.length > 0;
    
    // Show provider acceptance step if providers have accepted
    if (hasAcceptedProviders) {
      // Get the latest acceptance time
      const acceptanceTimes = acceptedProviders
        .filter(p => p.acceptance?.acceptedAt)
        .map(p => new Date(p.acceptance.acceptedAt).getTime());
      
      const latestAcceptance = acceptanceTimes.length > 0 
        ? Math.max(...acceptanceTimes)
        : Date.now();
      
      timeline.push({
        id: 'step-2',
        title: 'Provider Accepted',
        description: `${acceptedProviders.length} ${acceptedProviders.length === 1 ? 'provider has' : 'providers have'} accepted your request`,
        status: `Completed - ${formatTimeAgo(new Date(latestAcceptance).toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle2,
      });
      
      if (__DEV__) {
        console.log('✅ [OngoingJobDetails] Timeline: Showing Provider Accepted step', {
          count: acceptedProviders.length,
          latestAcceptance: new Date(latestAcceptance).toISOString(),
        });
      }
    } else {
      // No providers accepted yet
      timeline.push({
        id: 'step-2',
        title: 'Provider Acceptance',
        description: 'Waiting for providers to accept your request',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
      
      if (__DEV__) {
        console.log('⏳ [OngoingJobDetails] Timeline: No providers accepted yet', {
          acceptedProvidersLength: acceptedProviders?.length || 0,
          requestStatus: request?.status,
        });
      }
    }

    // Step 3: Inspection & Quotation
    // Only count quotations that have been sent (have sentAt or status is not null/draft)
    const hasQuotationSent = quotations.some(q => q.sentAt || (q.status && q.status !== 'draft' && q.status !== null));
    const quotationAccepted = quotations.some(q => q.status === 'accepted');
    
    // Priority 1: If quotation is accepted OR request status moved forward, show completed
    if (quotationAccepted || request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') {
      timeline.push({
        id: 'step-3',
        title: 'Inspection & Quotation',
        description: quotationAccepted 
          ? 'Quotation accepted by you' 
          : request.status === 'accepted' 
            ? 'Provider selected and quotation accepted'
            : 'Inspection completed and quotation accepted',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: FileText,
      });
    } 
    // Priority 2: If quotation has been sent, show "waiting for client to accept"
    else if (hasQuotationSent) {
      timeline.push({
        id: 'step-3',
        title: 'Inspection & Quotation',
        description: 'Quotation sent - waiting for you to accept',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } 
    // Priority 3: If providers have accepted but no quotation yet, show "waiting for inspection & quotation"
    else if (hasAcceptedProviders) {
      timeline.push({
        id: 'step-3',
        title: 'Inspection & Quotation',
        description: 'Waiting for provider to inspect and send quotation',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } 
    // Priority 4: No providers accepted yet - show pending
    else {
      timeline.push({
        id: 'step-3',
        title: 'Inspection & Quotation',
        description: 'Waiting for providers to accept your request',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
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
        description: 'Provider is on site',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else if (request.status === 'completed') {
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'Provider was on site',
        status: 'Completed',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else {
      // Not started yet - grayed out
      timeline.push({
        id: 'step-4',
        title: 'Job in Progress',
        description: 'Waiting for quotation acceptance and payment',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
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
        description: 'Review the job and provide feedback',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else {
      // Not started yet - grayed out
      timeline.push({
        id: 'step-5',
        title: 'Complete',
        description: 'Job will be marked complete after service',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    return timeline;
  }, [request, acceptedProviders, quotations, selectionCountdown]);

  // Load quotations from API (6.3 endpoint)
  const loadQuotations = useCallback(async () => {
    if (!params.requestId) return;
    
    setIsLoadingQuotations(true);
    try {
      const requestId = parseInt(params.requestId, 10);
      const quotationsData = await serviceRequestService.getQuotations(requestId);
      setQuotations(quotationsData);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading quotations:', error);
      }
      // Don't show error toast - quotations might not exist yet
      setQuotations([]);
    } finally {
      setIsLoadingQuotations(false);
    }
  }, [params.requestId]);

  // Helper function to format countdown
  const formatCountdown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle provider selection
  const handleSelectProvider = useCallback(async (providerId: number) => {
    if (!params.requestId || isSelectingProvider) return;

    setIsSelectingProvider(true);
    haptics.light();

    try {
      const requestId = parseInt(params.requestId, 10);
      const response = await serviceRequestService.selectProvider(requestId, providerId);
      
      haptics.success();
      showSuccess(response.message || 'Provider selected! They have 5 minutes to accept.');
      
      // Reload request data to get updated selection info
      await loadRequestData();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error selecting provider:', error);
      }
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'select_provider');
      showError(errorMessage);
    } finally {
      setIsSelectingProvider(false);
    }
  }, [params.requestId, isSelectingProvider, showSuccess, showError, loadRequestData]);

  // Countdown timer for selection
  // Uses backend's selectionTimeoutAt if available, otherwise calculates from selectedAt + 5 minutes
  const startCountdownTimer = useCallback(() => {
    if (!request?.selectedAt) {
      setSelectionCountdown(null);
      return;
    }

    const updateCountdown = () => {
      try {
        // Prefer backend's selectionTimeoutAt if available, otherwise calculate it
        let timeoutTime: number;
        if (request.selectionTimeoutAt) {
          // Use backend's timeout time (more accurate)
          timeoutTime = new Date(request.selectionTimeoutAt).getTime();
        } else {
          // Fallback: calculate from selectedAt + 5 minutes
          const selectedTime = new Date(request.selectedAt!).getTime();
          timeoutTime = selectedTime + (5 * 60 * 1000); // 5 minutes
        }
        
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timeoutTime - now) / 1000)); // seconds

        if (remaining > 0) {
          setSelectionCountdown(remaining);
        } else {
          setSelectionCountdown(null);
          // Selection timed out - reload to get updated status from backend
          loadRequestData();
        }
      } catch (error) {
        setSelectionCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [request?.selectedAt, request?.selectionTimeoutAt, loadRequestData]);

  // Start countdown when selection is active
  useEffect(() => {
    if (request?.selectedAt && !request.selectedProvider && request.status === 'pending') {
      const cleanup = startCountdownTimer();
      return cleanup;
    } else {
      setSelectionCountdown(null);
    }
  }, [request?.selectedAt, request?.selectedProvider, request?.status, request?.selectionTimeoutAt, startCountdownTimer]);

  // Map accepted providers to provider cards format
  // Use actual quotation data instead of random logic
  const mappedProviders = useMemo(() => {
    if (!acceptedProviders || acceptedProviders.length === 0) return [];

    return acceptedProviders.map((item) => {
      // Check if this provider has actually sent a quotation
      const providerQuotation = quotations.find(q => q.provider?.id === item.provider.id);
      const hasQuotationSent = !!providerQuotation && (providerQuotation.sentAt || (providerQuotation.status && providerQuotation.status !== 'draft'));
      const quotationAccepted = providerQuotation?.status === 'accepted';
      
      // Check selection status
      const isSelected = request?.selectedProvider?.id === item.provider.id;
      const isSelectionPending = isSelected && !request?.selectedProvider && request?.selectedAt;
      const isSelectionAccepted = isSelected && request?.status === 'accepted';
      const hasActiveSelection = request?.selectedAt && !request?.selectedProvider;
      const isThisProviderSelected = hasActiveSelection && request?.selectedAt; // Check if this provider was selected
      
      // Determine status based on selection flow
      let status = 'Provider accepted';
      let statusColor = '#FEF9C3';
      let statusTextColor = '#92400E';
      let quoteDetails = 'Provider has accepted your request. Waiting for inspection and quotation.';
      let inspectionStatus = `Accepted ${formatTimeAgo(item.acceptance.acceptedAt)}`;
      // Provider selection now happens in ServiceMapScreen during booking confirmation
      // No need to select providers here - canSelect is always false
      let canSelect = false;

      // Priority 1: Selection accepted
      if (isSelectionAccepted) {
        status = 'Provider accepted selection';
        statusColor = '#DCFCE7';
        statusTextColor = '#166534';
        quoteDetails = 'Provider has accepted your selection. They can now send quotation.';
        inspectionStatus = `Selection accepted ${formatTimeAgo(request.updatedAt || request.selectedAt || '')}`;
        canSelect = false;
      }
      // Priority 2: Selection pending with countdown
      else if (isSelected && selectionCountdown !== null && selectionCountdown > 0) {
        status = 'Selected - waiting for response';
        statusColor = '#DBEAFE';
        statusTextColor = '#1E40AF';
        quoteDetails = `Provider selected. Waiting for their response. ${formatCountdown(selectionCountdown)} remaining.`;
        inspectionStatus = `Selected ${formatTimeAgo(request.selectedAt || '')}`;
        canSelect = false;
      }
      // Priority 3: Selection pending (no countdown)
      else if (isSelected && request?.selectedAt) {
        status = 'Selected - waiting for response';
        statusColor = '#DBEAFE';
        statusTextColor = '#1E40AF';
        quoteDetails = 'Provider selected. Waiting for their response (5 minutes).';
        inspectionStatus = `Selected ${formatTimeAgo(request.selectedAt)}`;
        canSelect = false;
      }
      // Priority 4: Quotation accepted
      else if (quotationAccepted) {
        status = 'Quote accepted';
        statusColor = '#DCFCE7';
        statusTextColor = '#166534';
        quoteDetails = 'Quotation accepted. Provider will proceed with the job.';
        inspectionStatus = `Quote accepted ${formatTimeAgo(request?.updatedAt || providerQuotation.sentAt || '')}`;
        canSelect = false;
      }
      // Priority 5: Quotation sent
      else if (hasQuotationSent) {
        status = 'Quote submitted';
        statusColor = '#DBEAFE';
        statusTextColor = '#1E40AF';
        quoteDetails = providerQuotation.findingsAndWorkRequired || 'Professional service with high-quality materials. Includes parts and labor with warranty.';
        inspectionStatus = `Quote submitted ${formatTimeAgo(providerQuotation.sentAt || '')}`;
        canSelect = false;
      }
      // Priority 6: Another provider is selected
      else if (hasActiveSelection && !isSelected) {
        status = 'Provider accepted';
        statusColor = '#F3F4F6';
        statusTextColor = '#6B7280';
        quoteDetails = 'Another provider has been selected. Waiting for their response.';
        inspectionStatus = `Accepted ${formatTimeAgo(item.acceptance.acceptedAt)}`;
        canSelect = false;
      }

      return {
        id: `provider-${item.provider.id}`,
        name: item.provider.name,
        role: 'Professional Service Provider',
        image: require('../assets/images/plumbericon2.png'),
        status,
        statusColor,
        statusTextColor,
        badgeColor: '#CFFAFE',
        quote: hasQuotationSent ? `$${providerQuotation.total?.toFixed(2) || '0.00'}` : null,
        quoteDetails,
        duration: hasQuotationSent ? '2-3 hours' : null,
        inspectionStatus,
        cta: hasQuotationSent ? 'View full quote' : null,
        providerId: item.provider.id,
        distanceKm: item.distanceKm,
        minutesAway: item.minutesAway,
        isSelected,
        canSelect,
      };
    });
  }, [acceptedProviders, quotations, request, selectionCountdown, formatCountdown]);

  const timelineAnimations = useMemo(
    () => timelineSteps.map(() => new Animated.Value(0)),
    [timelineSteps]
  );

  const lineAnimations = useMemo(
    () => timelineSteps.slice(0, -1).map(() => new Animated.Value(0)),
    [timelineSteps]
  );

  const providerAnimations = useMemo(
    () => mappedProviders.map(() => new Animated.Value(0)),
    [mappedProviders]
  );

  // Load request details and accepted providers on mount
  useEffect(() => {
    if (params.requestId) {
      loadRequestData();
    }
  }, [params.requestId]);

  // Refresh data when screen comes into focus (e.g., returning from another screen)
  // This ensures timeline and status are always up to date
  useFocusEffect(
    useCallback(() => {
      if (params.requestId) {
        // Small delay to avoid unnecessary refreshes during navigation
        const timer = setTimeout(() => {
          loadRequestData();
        }, 300); // Increased delay to ensure API has time to update
        return () => clearTimeout(timer);
      }
    }, [params.requestId, loadRequestData])
  );

  const loadRequestData = useCallback(async () => {
    if (!params.requestId) return;

    setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);

      // Load request details
      const requestDetails = await serviceRequestService.getRequestDetails(requestId);
      setRequest(requestDetails);

      // Load accepted providers (for Updates tab) - ALWAYS load if status allows
      // This ensures we have accurate data for the timeline communication flow
      // IMPORTANT: Always try to load accepted providers, even if status is pending
      // because providers might have accepted but request status hasn't updated yet
      try {
        const providers = await serviceRequestService.getAcceptedProviders(requestId);
        const providersArray = Array.isArray(providers) ? providers : [];
        setAcceptedProviders(providersArray);
        
        if (__DEV__) {
          console.log('🔍 [OngoingJobDetails] Loaded accepted providers:', {
            requestId,
            requestStatus: requestDetails.status,
            count: providersArray.length,
            providers: providersArray.map(p => ({ 
              id: p.provider?.id, 
              name: p.provider?.name,
              acceptedAt: p.acceptance?.acceptedAt 
            })),
            hasAcceptedProviders: providersArray.length > 0,
          });
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('❌ [OngoingJobDetails] Error loading accepted providers:', {
            requestId,
            error: error?.message || error,
            status: error?.status,
          });
        }
        // If no providers accepted yet or endpoint fails, set empty array
        setAcceptedProviders([]);
      }

      // Load quotations (6.3 endpoint) - for Quotations tab
      await loadQuotations();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading request data:', error);
      }
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [params.requestId, loadQuotations, showError]);

  // Handle accept quotation (6.4 endpoint)
  const handleAcceptQuotation = async (quotationId: number) => {
    if (!params.requestId) return;

    try {
      setIsLoading(true);
      const response = await serviceRequestService.acceptQuotation(quotationId);

      haptics.success();
      showSuccess(response.message || 'Quotation accepted! You can now proceed to payment.');

      // Reload request data and quotations to update status
      await loadRequestData();
      await loadQuotations();

      // Navigate to payment screen with quotation details
      const acceptedQuotation = quotations.find(q => q.id === quotationId);
      if (acceptedQuotation) {
        router.push({
          pathname: '/PaymentMethodsScreen',
          params: {
            requestId: params.requestId,
            amount: acceptedQuotation.total.toString(),
            quotationId: quotationId.toString(),
          },
        } as any);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error accepting quotation:', error);
      }
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'accept_quotation');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject quotation (6.5 endpoint)
  const handleRejectQuotation = async (quotationId: number) => {
    if (!params.requestId) return;

    try {
      setIsLoading(true);
      const response = await serviceRequestService.rejectQuotation(quotationId);

      haptics.success();
      showSuccess(response.message || 'Quotation rejected successfully.');

      // Reload quotations to update status
      await loadQuotations();

      // If we rejected the current quotation, move to next one if available
      const currentIndex = quotations.findIndex(q => q.id === quotationId);
      if (currentIndex >= 0 && quotations.length > 1) {
        const nextIndex = currentIndex < quotations.length - 1 ? currentIndex : currentIndex - 1;
        if (nextIndex >= 0) {
          setCurrentQuoteIndex(nextIndex);
        }
      } else if (quotations.length === 1) {
        // If it was the last quotation, stay on it but it will show as rejected
        setCurrentQuoteIndex(0);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error rejecting quotation:', error);
      }
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'reject_quotation');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle complete service request (5.16 endpoint)
  const handleCompleteJob = async () => {
    if (!params.requestId || !request) return;

    // Show confirmation alert
    Alert.alert(
      'Complete Job',
      'Are you sure the service has been completed? This will transfer payment to the provider.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => haptics.light(),
        },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              haptics.light();

      const requestId = parseInt(params.requestId, 10);
              const response = await serviceRequestService.completeServiceRequest(requestId);

      haptics.success();
              showSuccess(response.message || 'Job completed successfully! Payment has been transferred to the provider.');

      // Reload request data to update status
      await loadRequestData();

              // Navigate to completed job detail screen after a short delay
              setTimeout(() => {
                router.replace({
                  pathname: '/CompletedJobDetail',
                  params: { requestId: params.requestId },
                } as any);
              }, 1500);
    } catch (error: any) {
              if (__DEV__) {
                console.error('Error completing job:', error);
              }
      haptics.error();
              const errorMessage = getSpecificErrorMessage(error, 'complete_service_request');
      showError(errorMessage);
            } finally {
              setIsLoading(false);
    }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (activeTab === 'Quotations') {
      setCurrentQuoteIndex(0);
    }
    // Ensure currentQuoteIndex is within bounds
    if (quotations.length > 0 && currentQuoteIndex >= quotations.length) {
      setCurrentQuoteIndex(0);
    }
  }, [activeTab, quotations, currentQuoteIndex]);

  useEffect(() => {
    quoteCardAnim.setValue(0);
    Animated.timing(quoteCardAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentQuoteIndex, quoteCardAnim]);

  useEffect(() => {
    if (timelineSteps.length === 0) return;

    // Enhanced timeline animation with haptics - More dynamic and smooth
    const timelineSequence = timelineAnimations.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 7,
        delay: index * 100,
      })
    );
    Animated.stagger(80, timelineSequence).start(() => {
      // Light haptic when timeline finishes animating
      haptics.light();
      
      // Add a subtle pulse animation for active/completed steps
      timelineAnimations.forEach((anim, index) => {
        const step = timelineSteps[index];
        if (step && (step.isCompleted || step.isActive)) {
          Animated.sequence([
            Animated.spring(anim, {
              toValue: 1.08,
              useNativeDriver: true,
              tension: 200,
              friction: 3,
            }),
            Animated.spring(anim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 200,
              friction: 3,
            }),
          ]).start();
        }
      });
    });

    // Animate progress lines after dots - More fluid animation
    const lineSequence = lineAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: (index + 1) * 100 + 150,
        useNativeDriver: false,
      })
    );
    Animated.stagger(80, lineSequence).start();

    // Provider cards animation
    const providerSequence = providerAnimations.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
        delay: 100 * index,
      })
    );
    Animated.stagger(120, providerSequence).start();
  }, [timelineSteps, timelineAnimations, lineAnimations, providerAnimations]);

  const renderTimeline = () => {
    if (timelineSteps.length === 0) return null;

    return (
      <View className="mb-8">
        {timelineSteps.map((step, index) => {
          const isLast = index === timelineSteps.length - 1;
          const animation = timelineAnimations[index];
          const lineAnim = !isLast ? lineAnimations[index] : null;

          const IconComponent = step.icon || Circle;
          const iconSize = step.isCompleted || step.isActive ? 20 : 16;

          return (
            <View key={step.id} className="flex-row mb-4">
              <View className="items-center mr-5">
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
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: step.isCompleted || step.isActive ? animation : animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0.6],
                    }),
                    shadowColor: step.isCompleted || step.isActive ? step.dotColor : '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: step.isCompleted || step.isActive ? 0.2 : 0.05,
                    shadowRadius: 4,
                    elevation: step.isCompleted || step.isActive ? 4 : 1,
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
                      backgroundColor: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                            outputRange: ['#E5E7EB', step.isCompleted ? step.dotColor : step.isActive ? step.dotColor : '#E5E7EB'],
                        })
                        : '#E5E7EB',
                      marginTop: 8,
                      borderRadius: 2,
                      minHeight: 40,
                      height: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                            outputRange: [0, 50],
                        })
                        : 50,
                    }}
                  />
                )}
              </View>
              <Animated.View
                style={{
                  flex: 1,
                  paddingBottom: isLast ? 0 : 0,
                  opacity: animation,
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                }}
              >
                <Text 
                  className="text-base mb-2" 
                  style={{ 
                    fontFamily: 'Poppins-Bold',
                    color: step.isCompleted || step.isActive ? Colors.textPrimary : Colors.textSecondaryDark,
                  }}
                >
                  {step.title}
                </Text>
                <Text 
                  className="text-sm mb-3" 
                  style={{ 
                    fontFamily: 'Poppins-Regular',
                    color: step.isCompleted || step.isActive ? Colors.textSecondaryDark : Colors.textTertiary,
                  }}
                >
                  {step.description}
                </Text>
                <AnimatedStatusChip
                  status={step.status}
                  statusColor={step.accent}
                  textColor={step.isCompleted ? '#166534' : step.isActive ? '#92400E' : '#6B7280'}
                  size="small"
                  animated={true}
                />
              </Animated.View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderProviderCard = (provider: typeof mappedProviders[number], index: number) => {
    const animation = providerAnimations[index];
    return (
      <Animated.View
        key={provider.id}
        style={{
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
        className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-[0px_12px_32px_rgba(15,23,42,0.08)]"
      >
        <View className="flex-row items-start px-5 pt-5 pb-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              haptics.light();
              router.push({
                pathname: '/ProviderDetailScreen',
                params: {
                  providerName: provider.name,
                  providerId: provider.providerId?.toString() || provider.id,
                },
              } as any);
            }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          >
            <Image
              source={provider.image}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                marginRight: 16,
              }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                {provider.name}
              </Text>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                {provider.role}
              </Text>
              {provider.distanceKm && (
                <Text className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                  {provider.distanceKm.toFixed(1)} km away • ~{provider.minutesAway} min
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            className="mr-2"
            onPress={() => {
              haptics.light();
              router.push({
                pathname: '/ChatScreen',
                params: {
                  providerName: provider.name,
                  providerId: provider.providerId?.toString() || provider.id,
                },
              });
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
          <AnimatedStatusChip
            status={provider.status}
            statusColor={provider.statusColor}
            textColor={provider.statusTextColor}
            size="small"
            animated={true}
          />
        </View>

        {provider.quote ? (
          <View className="px-5 mt-4 mb-4">
            <View className="rounded-2xl bg-gray-50 px-5 py-5 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                  Quote Details
                </Text>
                <Text className="text-lg text-[#6A9B00]" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.quote}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Regular' }}>
                {provider.quoteDetails}
              </Text>
              <Text className="text-sm text-gray-900" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Duration: <Text style={{ fontFamily: 'Poppins-Regular' }}>{provider.duration}</Text>
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                {provider.inspectionStatus}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  haptics.light();
                  setActiveTab('Quotations');
                  const quoteIndex = quotations.findIndex(q => q.providerId === provider.providerId);
                  if (quoteIndex >= 0) {
                    setCurrentQuoteIndex(quoteIndex);
                  }
                }}
              >
                <Text
                  className="text-sm text-[#6A9B00]"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  {provider.cta}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="px-5 mt-4 mb-4">
            <View
              className="rounded-2xl px-5 py-4"
              style={{ backgroundColor: provider.badgeColor }}
            >
              <Text className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
                {provider.status.includes('Selected') ? 'Provider Selection' : 'Inspection in Progress'}
              </Text>
              <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Regular' }}>
                {provider.quoteDetails}
              </Text>
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                {provider.inspectionStatus}
              </Text>
            </View>
          </View>
        )}

        {/* Provider selection now happens in ServiceMapScreen during booking confirmation */}
        {/* No need to show selection button here */}
      </Animated.View>
    );
  };


  return (
    <SafeAreaWrapper>
      <View className="flex-1 px-4" style={{ paddingTop: 20 }}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            style={{ marginRight: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
            {activeTab === 'Updates' ? 'Updates' : 'Quotations'}
          </Text>
        </View>

        <View className="flex-row mb-4 border-b border-gray-200">
          {TAB_ITEMS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(tab);
                }}
                className="mr-6 pb-2"
                activeOpacity={0.85}
              >
                <Text
                  className={`text-base ${isActive ? 'text-black' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  {tab}
                </Text>
                <View
                  className={`h-0.5 mt-2 rounded-full ${isActive ? 'bg-[#6A9B00]' : 'bg-transparent'}`}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6A9B00" />
            <Text className="text-gray-600 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>
              Loading job details...
            </Text>
          </View>
        ) : !request ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4 text-center px-8" style={{ fontFamily: 'Poppins-Medium' }}>
              Unable to load job details. Please try again.
            </Text>
            <TouchableOpacity
              onPress={loadRequestData}
              className="mt-6 px-6 py-3 bg-[#6A9B00] rounded-xl"
              activeOpacity={0.85}
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {activeTab === 'Updates' ? (
              <>
                {renderTimeline()}
                <TouchableOpacity
                  disabled={request.status !== 'in_progress' || isLoading}
                  className={`rounded-xl py-4 items-center justify-center mb-8 ${request.status === 'in_progress' && !isLoading ? 'bg-[#6A9B00]' : 'bg-gray-200'
                    }`}
                  activeOpacity={request.status === 'in_progress' && !isLoading ? 0.85 : 1}
                  onPress={handleCompleteJob}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                  <Text
                    className={`text-sm ${request.status === 'in_progress' ? 'text-white' : 'text-gray-500'}`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {request.status === 'completed' ? 'Job Completed' : 'Mark as complete'}
                  </Text>
                  )}
                </TouchableOpacity>
                {mappedProviders.length > 0 ? (
                  mappedProviders.map((provider, index) => renderProviderCard(provider, index))
                ) : (
                  <View className="items-center justify-center py-12">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
                      No providers have accepted this request yet.
                    </Text>
                    <Text className="text-gray-500 mt-2 text-center text-sm" style={{ fontFamily: 'Poppins-Regular' }}>
                      Providers will appear here once they accept your request.
                    </Text>
                  </View>
                )}
              </>
            ) :
            (
              <View className="flex-1">
                {/* Info Banner */}
                <View className="rounded-2xl bg-[#E0F2FE] px-4 py-3 mb-4 flex-row items-start">
                  <View className="w-5 h-5 rounded-full bg-[#0EA5E9] items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs" style={{ fontFamily: 'Poppins-Bold' }}>
                      i
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-900 mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                      {quotations.length > 0 ? 'All quotations received' : 'No quotations yet'}
                    </Text>
                    <Text className="text-xs text-[#0C4A6E]" style={{ fontFamily: 'Poppins-Regular' }}>
                      {quotations.length > 0
                        ? 'Review and select your preferred service provider'
                        : 'Quotations will appear here once providers submit them.'}
                    </Text>
                  </View>
                </View>

                {quotations.length > 0 && currentQuoteIndex < quotations.length ? (
                  <>
                    {/* Quotation Card */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        haptics.light();
                        const currentQuote = quotations[currentQuoteIndex];
                        if (currentQuote) {
                          router.push({
                            pathname: '/ProviderDetailScreen',
                            params: {
                              providerId: currentQuote.provider.id.toString(),
                              providerName: currentQuote.provider.name,
                            },
                          } as any);
                        }
                      }}
                    >
                      <Animated.View
                        className="rounded-2xl bg-[#E3F4DF] px-4 py-4 mb-4"
                        style={{
                          opacity: quoteCardAnim,
                          transform: [
                            {
                              translateY: quoteCardAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                              }),
                            },
                          ],
                        }}
                      >
                        <View className="flex-row items-center">
                          <Image
                            source={require('../assets/images/plumbericon2.png')}
                            className="w-14 h-14 rounded-full mr-3"
                            resizeMode="cover"
                          />
                          <View className="flex-1">
                            <View className="flex-row items-center">
                            <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                                {quotations[currentQuoteIndex].provider.name}
                            </Text>
                              {quotations[currentQuoteIndex].provider.verified && (
                                <Ionicons name="checkmark-circle" size={16} color="#6A9B00" style={{ marginLeft: 6 }} />
                              )}
                            </View>
                            <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
                              Professional Service Provider
                            </Text>
                              <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              {quotations[currentQuoteIndex].provider.phoneNumber}
                              </Text>
                          </View>
                          <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                            ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].total)}
                          </Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>

                    {/* Quotation Breakdown */}
                    <Animated.View
                      className="mb-4"
                      style={{
                        opacity: quoteCardAnim,
                        transform: [
                          {
                            translateY: quoteCardAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [15, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-Bold' }}>
                        Quotation Breakdown
                      </Text>
                      <View className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                        <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                            Labor Cost
                            </Text>
                            <Text className="text-sm text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                            ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].laborCost)}
                            </Text>
                          </View>
                        <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                          <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                            Logistics Cost
                          </Text>
                          <Text className="text-sm text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                            ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].logisticsCost)}
                          </Text>
                        </View>
                        {quotations[currentQuoteIndex].materials && quotations[currentQuoteIndex].materials.length > 0 && (
                          <View className="mb-3 pb-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Poppins-Regular' }}>
                              Materials
                            </Text>
                            {quotations[currentQuoteIndex].materials.map((material, index) => {
                              const quantity = material.quantity || 1;
                              const unitPrice = material.unitPrice || 0;
                              const total = quantity * unitPrice;
                              return (
                                <View key={index} className="flex-row items-center justify-between mb-1">
                                  <Text className="text-xs text-gray-600 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                                    {material.name} (Qty: {quantity})
                                  </Text>
                                  <Text className="text-xs text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                                    ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total)}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                        {quotations[currentQuoteIndex].serviceCharge > 0 && (
                          <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              Service Charge
                            </Text>
                            <Text className="text-sm text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].serviceCharge)}
                            </Text>
                          </View>
                        )}
                        {quotations[currentQuoteIndex].tax > 0 && (
                          <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              Tax
                            </Text>
                            <Text className="text-sm text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].tax)}
                            </Text>
                          </View>
                        )}
                        <View className="mt-3 pt-3 border-t border-gray-200 flex-row items-center justify-between">
                          <Text className="text-base text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                            Total
                          </Text>
                          <Text className="text-lg text-[#6A9B00]" style={{ fontFamily: 'Poppins-Bold' }}>
                            ₦{new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quotations[currentQuoteIndex].total)}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>

                    {/* Findings & Work Required */}
                    {quotations[currentQuoteIndex].findingsAndWorkRequired && (
                    <Animated.View
                      className="mb-6"
                      style={{
                        opacity: quoteCardAnim,
                        transform: [
                          {
                            translateY: quoteCardAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [15, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <Text className="text-base text-black mb-3" style={{ fontFamily: 'Poppins-Bold' }}>
                          Findings & Work Required
                      </Text>
                      <View className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                          <Text className="text-sm text-gray-700" style={{ fontFamily: 'Poppins-Regular', lineHeight: 20 }}>
                            {quotations[currentQuoteIndex].findingsAndWorkRequired}
                            </Text>
                      </View>
                    </Animated.View>
                    )}

                    {/* Action Buttons - Professional Balanced Layout */}
                    <View className="mb-4">
                      {/* Accept Button - Primary Action */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                        className="bg-black rounded-xl py-4 items-center justify-center mb-3"
                        disabled={isLoading || isLoadingQuotations || quotations[currentQuoteIndex]?.status === 'rejected' || quotations[currentQuoteIndex]?.status === 'accepted'}
                        style={{
                          opacity: (isLoading || isLoadingQuotations || quotations[currentQuoteIndex]?.status === 'rejected' || quotations[currentQuoteIndex]?.status === 'accepted') ? 0.5 : 1,
                        }}
                      onPress={async () => {
                          const currentQuote = quotations[currentQuoteIndex];
                          if (currentQuote && currentQuote.id) {
                            haptics.light();
                          analytics.track('accept_quote', {
                            job_id: params.requestId,
                              quotation_id: currentQuote.id,
                              provider_id: currentQuote.provider.id
                          });
                            await handleAcceptQuotation(currentQuote.id);
                          } else {
                            showError('Invalid quotation. Please try again.');
                        }
                      }}
                    >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                      <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                        Accept Quote
                      </Text>
                        )}
                    </TouchableOpacity>

                      {/* Reject Button - Secondary Action */}
                      {quotations[currentQuoteIndex]?.status === 'pending' && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          className="bg-white rounded-xl py-4 items-center justify-center border-2 border-gray-200"
                          disabled={isLoading || isLoadingQuotations}
                          style={{
                            opacity: (isLoading || isLoadingQuotations) ? 0.5 : 1,
                          }}
                          onPress={async () => {
                            const currentQuote = quotations[currentQuoteIndex];
                            if (currentQuote && currentQuote.id) {
                              haptics.light();
                              analytics.track('reject_quote', {
                                job_id: params.requestId,
                                quotation_id: currentQuote.id,
                                provider_id: currentQuote.provider.id
                              });
                              await handleRejectQuotation(currentQuote.id);
                            } else {
                              showError('Invalid quotation. Please try again.');
                            }
                          }}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <Text className="text-[#DC2626] text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              Reject Quote
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Status Badge - Show if quotation is accepted */}
                      {quotations[currentQuoteIndex]?.status === 'accepted' && (
                        <View className="bg-[#DCFCE7] rounded-xl py-3 px-4 items-center justify-center mt-2">
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                            <Text className="text-[#16A34A] text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              Quotation Accepted
                            </Text>
                          </View>
                          <Text className="text-[#16A34A] text-xs mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                            You can now proceed to payment
                          </Text>
                        </View>
                      )}

                      {/* Status Badge - Show if quotation is rejected */}
                      {quotations[currentQuoteIndex]?.status === 'rejected' && (
                        <View className="bg-[#FEE2E2] rounded-xl py-3 px-4 items-center justify-center mt-2">
                          <View className="flex-row items-center">
                            <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                            <Text className="text-[#DC2626] text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              Quotation Rejected
                            </Text>
                          </View>
                          <Text className="text-[#DC2626] text-xs mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                            This quotation has been rejected
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Navigation & Pagination */}
                    <View className="flex-row items-center justify-between mb-6">
                      <TouchableOpacity
                        onPress={() => {
                          if (currentQuoteIndex > 0) {
                            haptics.selection();
                            setCurrentQuoteIndex(currentQuoteIndex - 1);
                          }
                        }}
                        disabled={currentQuoteIndex === 0}
                        activeOpacity={0.85}
                        className={`flex-row items-center ${currentQuoteIndex === 0 ? 'opacity-40' : ''}`}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={20}
                          color={currentQuoteIndex === 0 ? '#9CA3AF' : '#6A9B00'}
                        />
                        <Text
                          className="text-sm ml-1"
                          style={{
                            fontFamily: 'Poppins-SemiBold',
                            color: currentQuoteIndex === 0 ? '#9CA3AF' : '#6A9B00',
                          }}
                        >
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
                        {currentQuoteIndex + 1}/{quotations.length}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          if (currentQuoteIndex < quotations.length - 1) {
                            haptics.selection();
                            setCurrentQuoteIndex(currentQuoteIndex + 1);
                          }
                        }}
                        disabled={currentQuoteIndex === quotations.length - 1}
                        activeOpacity={0.85}
                        className={`flex-row items-center ${currentQuoteIndex === quotations.length - 1 ? 'opacity-40' : ''}`}
                      >
                        <Text
                          className="text-sm mr-1"
                          style={{
                            fontFamily: 'Poppins-SemiBold',
                            color: currentQuoteIndex === quotations.length - 1 ? '#9CA3AF' : '#6A9B00',
                          }}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={currentQuoteIndex === quotations.length - 1 ? '#9CA3AF' : '#6A9B00'}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View className="items-center justify-center py-12">
                    <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
                      No quotations available yet.
                    </Text>
                    <Text className="text-gray-500 mt-2 text-center text-sm" style={{ fontFamily: 'Poppins-Regular' }}>
                      Quotations will appear here once providers submit them.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
