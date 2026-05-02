
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import TimelineStatusCard from '@/components/TimelineStatusCard';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { Colors } from '@/lib/designSystem';
import { analytics } from '@/services/analytics';
import { QuotationWithProvider, ServiceRequest, serviceRequestService, walletService } from '@/services/api';
import { formatDateShort, formatTimeAgo } from '@/utils/dateFormatting';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { isConnectivityOrNetworkError } from '@/utils/isNetworkFailure';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { formatProviderProximitySubtitle } from '@/utils/navigationUtils';
import { mergeCachedVisitRequest } from '@/utils/visitRequestCache';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, CheckCircle2, Circle, Clock, FileText, MapPinned, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const baseAmounts = [65, 75, 85, 95, 120, 150];

  return acceptedProviders.map((item, index) => {
    const breakdown = serviceBreakdowns[category] || serviceBreakdowns.plumbing;
    const paymentTerms = paymentTermsTemplates[index % paymentTermsTemplates.length];
    const baseAmount = baseAmounts[index % baseAmounts.length];
    const quoteAmount = `$${baseAmount}`;

    const totalFromBreakdown = breakdown.reduce((sum, item) => {
      const price = item.price === 'Free' ? 0 : parseFloat(item.price.replace('$', '')) || 0;
      return sum + price;
    }, 0);
    const finalAmount = totalFromBreakdown > 0 ? totalFromBreakdown : baseAmount;

    return {
      id: `quote-${item.provider.id}`,
      providerName: item.provider.name,
      providerType: 'Provider',
      providerImage: require('../assets/images/plumbericon2.png'),
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

const formatVisitFee = (value: number | undefined | null) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : null;

const formatVisitSchedule = (scheduledDate?: string | null, scheduledTime?: string | null) => {
  const dateText = formatDateShort(scheduledDate) || scheduledDate || '';
  const timeText = scheduledTime || '';
  if (dateText && timeText) return `${dateText} at ${timeText}`;
  return dateText || timeText || 'the scheduled time';
};

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
  providerImage: any; 
  quoteAmount: string;
  serviceBreakdown: ServiceBreakdownItem[];
  paymentTerms: PaymentTerm[];
}

interface ExtendedQuotation extends Quotation {
  providerId: number;
  distanceKm?: number;
  minutesAway?: number;
  acceptanceId?: number;
  acceptedAt?: string;
}

export default function OngoingJobDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string; paymentStatus?: string; fromBooking?: string }>();
  const { toast, showError, showSuccess, showWarning, hideToast } = useToast();
  const { data: currentUserProfile } = useCurrentUserProfile();
  const clientIdentity = useMemo(
    () => ({
      displayName: currentUserProfile?.name?.trim() || undefined,
      imageUri: currentUserProfile?.profileImageUri ?? null,
    }),
    [currentUserProfile?.name, currentUserProfile?.profileImageUri],
  );

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [acceptedProviders, setAcceptedProviders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<QuotationWithProvider[]>([]);
  const [paymentTransaction, setPaymentTransaction] = useState<any | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    if (params.requestId) {
      setIsLoading(true);
      setHasAttemptedLoad(false); 
    } else {
      setIsLoading(false);
    }
  }, [params.requestId]);
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [expandedQuoteProviderId, setExpandedQuoteProviderId] = useState<string | number | null>(null);
  const quoteCardAnim = useRef(new Animated.Value(1)).current;
  const [isSelectingProvider, setIsSelectingProvider] = useState(false);
  const [selectionCountdown, setSelectionCountdown] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cameFromPaymentSuccess = params.paymentStatus === 'success';
  const insets = useSafeAreaInsets();

  const timelineSteps = useMemo(() => {
    if (!request) return [];

    const timeline = [];

    // Step 1: Job Request Submitted (always completed)
    // Show how many providers the request was sent to (from nearbyProviders if available)
    const totalProvidersSentTo = request.nearbyProviders?.length || acceptedProviders.length || 0;
    timeline.push({
      id: 'step-1',
      title: 'Request sent',
      description: totalProvidersSentTo > 0 
        ? `${totalProvidersSentTo} nearby ${totalProvidersSentTo === 1 ? 'provider' : 'providers'} notified.`
        : 'Nearby providers have been notified.',
      status: formatTimeAgo(request.createdAt || request.updatedAt),
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
          title: 'Provider selected',
          description: `${request.selectedProvider.name} accepted.`,
          status: formatTimeAgo(request.updatedAt || request.selectedAt || ''),
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
          title: 'Provider selected',
          description: `Waiting for acceptance. ${mins}:${secs.toString().padStart(2, '0')} left.`,
          status: 'Waiting',
          accent: '#FEF9C3',
        dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      } else if (request.selectedAt) {
        timeline.push({
          id: 'step-1.5',
          title: 'Provider selected',
          description: 'Waiting for acceptance.',
          status: 'Waiting',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: Clock,
        });
      }
    }

    // Step 2: Provider Acceptance (NEW STEP - shows when providers accept)
    // IMPORTANT: Use multiple indicators to determine if providers have accepted:
    // 1. acceptedProviders array has items
    // 2. Request status is beyond "pending" (in_progress, scheduled, completed) - means providers MUST have accepted
    // 3. Quotation exists (can't have quotation without provider accepting)
    const hasAcceptedProvidersFromAPI = acceptedProviders && acceptedProviders.length > 0;
    const hasAcceptedProvidersFromStatus = request.status === 'in_progress' || 
                                           (request.status as any) === 'scheduled' || 
                                           request.status === 'reviewing' ||
                                           request.status === 'completed' ||
                                           request.status === 'accepted' ||
                                           (request.status as any) === 'inspecting' || // Provider requested visit
                                           quotations.length > 0;
    const hasAcceptedProviders = hasAcceptedProvidersFromAPI || hasAcceptedProvidersFromStatus;
    
    // Show provider acceptance step if providers have accepted
    if (hasAcceptedProviders) {
      // Get the latest acceptance time
      const acceptanceTimes = acceptedProviders
        .filter(p => p.acceptance?.acceptedAt)
        .map(p => new Date(p.acceptance.acceptedAt).getTime());
      
      const latestAcceptance = acceptanceTimes.length > 0
        ? Math.max(...acceptanceTimes)
        : null;

      // Use actual count if available, otherwise infer from status
      const providerCount = hasAcceptedProvidersFromAPI ? acceptedProviders.length : 1;
      // Never use current time as fallback - use request dates or "Recently"
      const acceptanceTime = latestAcceptance != null
        ? String(latestAcceptance)
        : request.updatedAt || request.createdAt;
      
      timeline.push({
        id: 'step-2',
        title: 'Provider accepted',
        description: hasAcceptedProvidersFromAPI 
          ? `${providerCount} ${providerCount === 1 ? 'provider has' : 'providers have'} accepted.`
          : 'Provider accepted the job.',
        status: formatTimeAgo(acceptanceTime),
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle2,
      });
      
    } else {
      // No providers accepted yet. Use Clock (not Circle) so icon has visible shape
      timeline.push({
        id: 'step-2',
        title: 'Provider response',
        description: 'Waiting for a provider.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Clock,
      });
      
    }

    // Step 3a: Inspection (visit) - separate from quotation
    const qList = Array.isArray(quotations) ? quotations : [];
    const hasQuotationSent = qList.some((q: any) => {
      if (!q || typeof q !== 'object') return false;
      if (q.sentAt || q.submittedAt) return true;
      if (q.status && q.status !== 'draft') return true;
      if (q.total != null && q.total > 0) return true;
      return false;
    }) || !!((request as any).providerId && (request as any).price != null);
    const visitRequest = (request as any).visitRequest;
    const visitStatus = (visitRequest?.logisticsStatus || '').toString().toLowerCase();
    const visitDeclined = ['cancelled', 'declined', 'rejected'].includes(visitStatus);
    const visitFeeText = formatVisitFee(visitRequest?.logisticsCost);
    const visitScheduleText = formatVisitSchedule(visitRequest?.scheduledDate, visitRequest?.scheduledTime);
    const hasVisitRequested = !!(visitRequest && (
      visitRequest.scheduledDate ||
      visitRequest.scheduledTime ||
      visitRequest.requestedAt ||
      visitRequest.logisticsStatus ||
      visitRequest.logisticsCost != null
    ));
    const visitPaid = visitRequest?.logisticsStatus === 'paid';

    if (hasAcceptedProviders) {
      if (hasQuotationSent) {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: hasVisitRequested ? 'Visit handled.' : 'Quotation sent directly.',
          status: 'Done',
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: MapPinned,
        });
      } else if (visitDeclined) {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: 'Visit declined. Waiting for quotation.',
          status: 'Active',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: MapPinned,
        });
      } else if (hasVisitRequested) {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: visitPaid
            ? `Visit confirmed for ${visitScheduleText}.`
            : visitFeeText
              ? `Visit requested for ${visitScheduleText}. Fee: ${visitFeeText}.`
              : `Visit requested for ${visitScheduleText}.`,
          status: visitPaid ? 'Done' : 'Active',
          accent: visitPaid ? '#DCFCE7' : '#FEF9C3',
          dotColor: visitPaid ? '#6A9B00' : '#F59E0B',
          isActive: !visitPaid,
          isCompleted: visitPaid,
          icon: MapPinned,
          // Visit fee accept/decline UI moved into TimelineStatusCard header
          // to keep the timeline list clean.
          showPayLogistics: false,
          showRejectVisit: false,
          logisticsCost: visitRequest.logisticsCost,
        });
      } else {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: 'Waiting for inspection or quotation.',
          status: 'Active',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: MapPinned,
        });
      }
    } else {
      timeline.push({
        id: 'step-3',
        title: 'Inspection',
        description: 'Waiting for a provider.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: MapPinned,
      });
    }

    // Step 3b: Quotation
    if (hasAcceptedProviders) {
      if (hasQuotationSent) {
        const quotation = qList.find((q: any) => q?.sentAt || (q as any)?.submittedAt || (q?.status && q?.status !== 'draft') || (q?.total != null && q?.total > 0));
        timeline.push({
          id: 'step-3b',
          title: 'Quotation',
          description: 'Review the quote when ready.',
          status: formatTimeAgo(quotation?.sentAt || (quotation as any)?.submittedAt || request.updatedAt || ''),
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: FileText,
        });
      } else {
        timeline.push({
          id: 'step-3b',
          title: 'Quotation',
          description: visitDeclined
            ? 'Waiting for quotation.'
            : hasVisitRequested && !visitPaid
            ? 'Visit payment comes first.'
            : 'Provider is preparing the quote.',
          status: hasVisitRequested && !visitPaid ? 'Pending' : 'Active',
          accent: hasVisitRequested && !visitPaid ? '#F3F4F6' : '#FEF9C3',
          dotColor: hasVisitRequested && !visitPaid ? '#9CA3AF' : '#F59E0B',
          isActive: !(hasVisitRequested && !visitPaid),
          isCompleted: false,
          icon: FileText,
        });
      }
    } else {
      timeline.push({
        id: 'step-3b',
        title: 'Quotation',
        description: 'No quote yet.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: FileText,
      });
    }

    // Step 4: Quotation Accepted
    // Client accepts the quotation (separate from payment)
    const quotationAccepted = qList.some((q: any) => q?.status === 'accepted');
    const acceptedQuotation = qList.find((q: any) => q?.status === 'accepted');
    
    if (quotationAccepted) {
      timeline.push({
        id: 'step-4',
        title: 'Quote accepted',
        description: 'Complete payment to start.',
        status: formatTimeAgo((acceptedQuotation as any)?.acceptedAt || acceptedQuotation?.sentAt || request.updatedAt || ''),
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else if (hasQuotationSent) {
      // Quotation sent but not accepted yet - YELLOW (waiting for client to accept)
      timeline.push({
        id: 'step-4',
        title: 'Quote accepted',
        description: 'Review and accept the quote.',
        status: 'Active',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } else {
      // No quotation sent yet - grey (pending). Use FileText so icon isn't empty-looking
      timeline.push({
        id: 'step-4',
        title: 'Quote accepted',
        description: 'Waiting for quote.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: FileText,
      });
    }

    // Step 5: Job in Progress
    // - scheduled → YELLOW (waiting for provider to click Start)
    // - in_progress → GREEN (provider has started, job active – client can mark complete)
    // - reviewing → YELLOW (provider finished, client must verify and mark complete)
    // - completed → GREEN (job done)
    
    if (request.status === 'in_progress') {
      // Provider has started – GREEN so it clearly differs from "waiting for provider"
      timeline.push({
        id: 'step-5',
        title: 'Work started',
        description: 'Provider is working.',
        status: 'Active',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else if (request.status === 'reviewing') {
      // Provider marked complete – YELLOW: client must verify and release payment
      timeline.push({
        id: 'step-5',
        title: 'Ready to review',
        description: 'Check the work before releasing payment.',
        status: 'Review',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else if (request.status === 'completed') {
      timeline.push({
        id: 'step-5',
        title: 'Work completed',
        description: 'Payment released.',
        status: 'Done',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else if (((request.status as any) || '').toString().toLowerCase() === 'scheduled' || (quotationAccepted && paymentTransaction)) {
      // Payment completed – waiting for provider to click Start → keep step grey until provider starts job
      timeline.push({
        id: 'step-5',
        title: 'Work scheduled',
        description: 'Waiting for provider to start.',
        status: 'Waiting',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Wrench,
      });
    } else {
      // Not ready yet - grey (pending) - payments handled from the Quotations tab
      timeline.push({
        id: 'step-5',
        title: 'Work scheduled',
        description: quotationAccepted
          ? 'Complete payment to start.'
          : 'Accept a quote first.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
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
        description: 'Job closed. You can leave a review.',
        status: formatTimeAgo(request.updatedAt || request.createdAt),
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle,
      });
    } else if (request.status === 'reviewing') {
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Confirm when you are satisfied.',
        status: 'Review',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: CheckCircle,
      });
    } else {
      // Not completed yet - grey (pending). Use CheckCircle so icon isn't empty-looking
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Final step after the work is done.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: CheckCircle,
      });
    }

    return timeline;
  }, [request, acceptedProviders, quotations, selectionCountdown, paymentTransaction]);

  const timelineHeader = useMemo(() => {
    if (!request) return null;
    const hasAcceptedProviders = (acceptedProviders && acceptedProviders.length > 0) || !!request.selectedProvider;
    const qListH = Array.isArray(quotations) ? quotations : [];
    const hasQuotationSent = qListH.some((q: any) => q?.sentAt || q?.submittedAt || (q?.status && q?.status !== 'draft') || (q?.total != null && q?.total > 0)) || !!((request as any).providerId && (request as any).price != null);
    const acceptedQuotation = qListH.find((q: any) => q?.status === 'accepted');
    const quotationAccepted = !!acceptedQuotation;
    const formatCurrency = (v: number | undefined | null) => (typeof v === 'number' ? v : 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const headerProvider = acceptedQuotation?.provider ?? acceptedProviders?.[0]?.provider ?? null;

    if (request.status === 'completed') return { title: 'Job completed', subtitle: 'Job complete. Funds released to provider. Thank you.', statusPill: 'Completed', pillBg: '#DCFCE7', pillText: '#166534', timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null, provider: headerProvider };
    if (request.status === 'in_progress') return { title: 'Job in progress', subtitle: 'Provider is on site. Mark complete when satisfied.', statusPill: 'In progress', pillBg: '#FEF9C3', pillText: '#92400E', timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null, provider: headerProvider };
    if (request.status === 'reviewing') return { title: 'Provider has finished', subtitle: 'Verify the work is satisfactory, then tap Mark as complete to release payment.', statusPill: 'Awaiting your confirmation', pillBg: '#FEF9C3', pillText: '#92400E', timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null, provider: headerProvider };

    const statusLower = typeof (request.status as any) === 'string' ? (request.status as any).toLowerCase() : (request.status as any);
    const isPaidByStatus = statusLower === 'scheduled' || statusLower === 'in_progress' || statusLower === 'reviewing' || statusLower === 'completed';
    const isPaymentConfirmed = cameFromPaymentSuccess || (quotationAccepted && (isPaidByStatus || !!paymentTransaction));

    if (isPaymentConfirmed) {
      const amt = acceptedQuotation ? `₦${formatCurrency(acceptedQuotation.total)}` : '';
      return { title: 'Payment secured', subtitle: amt ? `Payment of ${amt} secured in escrow.` : 'Payment secured. Waiting for provider to start.', statusPill: 'Payment confirmed', pillBg: '#DCFCE7', pillText: '#166534', timestamp: null, provider: headerProvider };
    }
    if (quotationAccepted && !isPaymentConfirmed) {
      const amt = acceptedQuotation ? `₦${formatCurrency(acceptedQuotation.total)}` : '';
      return { title: 'Quotation accepted – payment required', subtitle: amt ? `Accepted ${amt}. Complete payment to secure the job.` : 'Complete payment to secure the job.', variant: 'action' as const, showPayButton: true, payAmount: acceptedQuotation?.total ?? 0, acceptedQuotation, statusPill: 'Payment required', pillBg: '#FEF9C3', pillText: '#92400E', timestamp: null, provider: headerProvider };
    }
    if (hasQuotationSent) return { title: 'Quotation received', subtitle: 'Review cost and details, then accept or decline.', statusPill: 'Quote submitted', pillBg: '#DBEAFE', pillText: '#1E40AF', timestamp: null, provider: headerProvider };
    if (hasAcceptedProviders) {
      const firstAccept = acceptedProviders?.[0];
      const acceptedAt = firstAccept?.acceptance?.acceptedAt ?? request.updatedAt ?? request.selectedAt;
      const vr = (request as any)?.visitRequest;
      const visitStatus = (vr?.logisticsStatus || '').toString().toLowerCase();
      const visitDeclined = ['cancelled', 'declined', 'rejected'].includes(visitStatus);
      const hasVR = !!(vr && (vr.scheduledDate || vr.scheduledTime || vr.requestedAt || vr.logisticsStatus || vr.logisticsCost != null));
      const vPaid = vr?.logisticsStatus === 'paid';
      const parseVisitFee = (value: unknown): number | undefined => {
        if (value == null || value === '') return undefined;
        if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
        if (typeof value === 'string') {
          const parsed = Number(value.replace(/[₦,\s]/g, ''));
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };
      const logisticsCost =
        parseVisitFee(vr?.logisticsCost) ??
        parseVisitFee(vr?.logistics_cost) ??
        parseVisitFee(vr?.logisticsFee) ??
        parseVisitFee(vr?.logistics_fee) ??
        parseVisitFee(vr?.visitFee) ??
        parseVisitFee(vr?.visit_fee) ??
        parseVisitFee(vr?.inspectionFee) ??
        parseVisitFee(vr?.inspection_fee) ??
        parseVisitFee(vr?.amount) ??
        parseVisitFee((request as any)?.logisticsCost) ??
        parseVisitFee((request as any)?.logistics_cost) ??
        parseVisitFee((request as any)?.visitFee) ??
        parseVisitFee((request as any)?.visit_fee) ??
        parseVisitFee((request as any)?.inspectionFee) ??
        parseVisitFee((request as any)?.inspection_fee);
      const hasPayableVisitFee = typeof logisticsCost === 'number' && logisticsCost > 0;

      if (__DEV__ && hasVR) {
        console.log('[OngoingJobDetails] visit header data', {
          requestId: params.requestId,
          rawVisitRequest: vr,
          logisticsCost,
          hasPayableVisitFee,
          visitStatus,
          vPaid,
          visitDeclined,
        });
      }

      return {
        title: 'Inspection in progress',
        subtitle: visitDeclined
          ? 'Visit was declined. Provider should send quotation directly.'
          : 'Provider has accepted your request. Waiting for inspection and quotation.',
        statusPill: 'Provider accepted',
        pillBg: '#FEF9C3',
        pillText: '#92400E',
        timestamp: acceptedAt ? formatTimeAgo(acceptedAt) : null,
        provider: headerProvider,
        showVisitPayButton: hasVR && !vPaid && !visitDeclined,
        visitLogisticsCost: logisticsCost,
        onVisitPay: () => {
          if (params.requestId == null) return;
          if (!hasPayableVisitFee) {
            showError('Visit fee is missing. Pull down to refresh or ask the provider to resend the visit request.');
            return;
          }
          haptics.light();
          router.push({
            pathname: '/ConfirmWalletPaymentScreen',
            params: {
              requestId: params.requestId,
              amount: String(logisticsCost),
              paymentType: 'logistics_fee',
              serviceName: request?.jobTitle || 'Inspection',
            },
          } as any);
        },
        onVisitDecline: async () => {
          const rid = Number(params.requestId);
          if (isNaN(rid)) return;
          Alert.alert('Decline visit?', 'Provider can send a quotation directly without visiting.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Decline visit',
              style: 'destructive',
              onPress: async () => {
                try {
                  const declineResponse = await serviceRequestService.declineVisit(rid);
                  if (__DEV__) {
                    console.log('[OngoingJobDetails] decline visit completed', {
                      requestId: rid,
                      declineResponse,
                    });
                  }
                  showSuccess('Visit declined.');
                  await loadRequestData();
                } catch (e: any) {
                  if (e instanceof AuthError) {
                    await handleAuthErrorRedirect(router);
                    return;
                  }
                  showError(getSpecificErrorMessage(e, 'decline_visit') ?? e?.message);
                }
              },
            },
          ]);
        },
      };
    }
    return { title: 'Waiting for providers', subtitle: 'Nearby providers are being notified. Updates will appear here.', statusPill: 'Pending', pillBg: '#F3F4F6', pillText: '#6B7280', timestamp: null, provider: null };
  }, [request, acceptedProviders, quotations, cameFromPaymentSuccess, paymentTransaction]);

  // Load quotations from API (6.3 endpoint)
  const loadQuotations = useCallback(async () => {
    if (!params.requestId) return;
    
    setIsLoadingQuotations(true);
    try {
      const requestId = parseInt(params.requestId, 10);
      const quotationsData = await serviceRequestService.getQuotations(requestId);
      setQuotations(quotationsData);
    } catch (error: any) {
      if (isConnectivityOrNetworkError(error)) {
        if (__DEV__) {
          console.warn('Quotations: offline — staying on screen.');
        }
        setQuotations([]);
        return;
      }
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
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

  // Check wallet transactions for payment status (fallback when backend status is stale)
  const checkPaymentTransaction = useCallback(async (requestId: number) => {
    try {
      const result = await walletService.getTransactions({ limit: 100, offset: 0 });
      const reqIdStr = String(requestId);
      const paymentTx = result.transactions.find((tx: any) => {
        const type = (tx.type || '').toLowerCase();
        const status = (tx.status || '').toLowerCase();
        if (status !== 'completed') return false;
        if (!['payment', 'service_payment', 'payment_for_service', 'debit'].includes(type)) return false;
        if (tx.requestId === requestId || tx.requestId === reqIdStr) return true;
        const desc = (tx.description || tx.narration || tx.reference || '').toLowerCase();
        if (desc.includes(`request #${requestId}`) || desc.includes(`request ${requestId}`)) return true;
        if ((tx.metadata?.requestId ?? tx.metadata?.request_id) == requestId) return true;
        return false;
      });
      
      if (paymentTx) {
        setPaymentTransaction(paymentTx);
      } else {
        setPaymentTransaction(null);
      }
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      setPaymentTransaction(null);
    }
  }, []);

  const loadRequestData = useCallback(async (silent = false) => {
    if (!params.requestId) return;

    setHasAttemptedLoad(true);
    if (!silent) setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);

      // 1) Load core request details (list fallback when GET /requests/:id returns 5xx)
      const { request: requestDetails, usedListFallback } =
        await serviceRequestService.getRequestDetailsWithListFallback(requestId);
      const hydratedRequestDetails = await mergeCachedVisitRequest(requestId, requestDetails);
      if (__DEV__) {
        console.log('[OngoingJobDetails] request details loaded', {
          requestId,
          status: hydratedRequestDetails?.status,
          visitRequest: (hydratedRequestDetails as any)?.visitRequest,
          rawVisitKeys: (hydratedRequestDetails as any)?.visitRequest
            ? Object.keys((hydratedRequestDetails as any).visitRequest)
            : [],
          usedListFallback,
        });
        const visitStatus = ((hydratedRequestDetails as any)?.visitRequest?.logisticsStatus || '').toString().toLowerCase();
        const requestStatus = (hydratedRequestDetails?.status || '').toString().toLowerCase();
        if (requestStatus === 'cancelled' && ['cancelled', 'declined', 'rejected'].includes(visitStatus)) {
          console.warn('[OngoingJobDetails] decline visit may have cancelled the whole request', {
            requestId,
            requestStatus,
            visitStatus,
            visitRequest: (hydratedRequestDetails as any)?.visitRequest,
          });
        }
      }
      setRequest(hydratedRequestDetails);
      if (usedListFallback && !silent) {
        showWarning(
          'The server returned an error for full job details. Showing a summary from your jobs list until that is fixed.'
        );
      }

      // 2) Check wallet transactions for payment (fallback when backend status is stale)
      await checkPaymentTransaction(requestId).catch(() => {});

      // 3) Load accepted providers (needed for timeline / provider cards)
        try {
          const providers = await serviceRequestService.getAcceptedProviders(requestId);
          const providersArray = Array.isArray(providers) ? providers : [];
          setAcceptedProviders(providersArray);
        } catch (error: any) {
          if (error instanceof AuthError) {
            await handleAuthErrorRedirect(router);
            return;
          }
          // Backend may return 400 e.g. "column provider.image does not exist" – treat as non-fatal
          const msg = String(error?.message || '').toLowerCase();
          const isBackendSchemaError = error?.status === 400 && (msg.includes('provider.image') || msg.includes('does not exist'));
          if (__DEV__ && !isBackendSchemaError) {
            console.error('❌ [OngoingJobDetails] Error loading accepted providers:', {
              requestId,
              error: error?.message || error,
              status: error?.status,
            });
          }
          setAcceptedProviders([]);
        }

      // 4) Load quotations (needed for quotation tab and payment state)
      await loadQuotations();
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      if (__DEV__) {
        const quiet500 = error?.status === 500 || (error as any)?.isExpected500;
        if (quiet500) console.warn('Error loading request data:', error?.message || error);
        else console.error('Error loading request data:', error);
      }
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [params.requestId, loadQuotations, showError, showWarning, checkPaymentTransaction]);

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
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
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

    const qListMap = Array.isArray(quotations) ? quotations : [];
    return acceptedProviders.map((item) => {
      const providerQuotation = qListMap.find((q: any) => q?.provider?.id === item.provider?.id);
      const hasQuotationSent = !!providerQuotation && (providerQuotation.sentAt || (providerQuotation as any).submittedAt || (providerQuotation.status && (providerQuotation as any).status !== 'draft') || (providerQuotation.total != null && providerQuotation.total > 0));
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
        inspectionStatus = `Selected ${formatTimeAgo(request?.selectedAt || '')}`;
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
        role: 'Provider',
        image: require('../assets/images/plumbericon2.png'),
        status,
        statusColor,
        statusTextColor,
        badgeColor: '#CFFAFE',
        quote: hasQuotationSent ? `$${providerQuotation.total?.toFixed(2) || '0.00'}` : null,
        quoteDetails,
        duration: hasQuotationSent ? '2-3 hours' : null,
        inspectionStatus,
        // More action‑oriented label so users know they can act on the quotation
        cta: hasQuotationSent ? 'Review & respond' : null,
        providerId: item.provider.id,
        distanceKm: item.distanceKm,
        minutesAway: item.minutesAway,
        isSelected,
        canSelect,
      };
    });
  }, [acceptedProviders, quotations, request, selectionCountdown, formatCountdown]);

  // Keep animation refs stable – only recreate when step COUNT changes (avoids glitch on poll/refresh)
  const stepCount = timelineSteps.length;
  const providerCount = mappedProviders.length;
  const timelineAnimations = useMemo(
    () => Array.from({ length: Math.max(stepCount, 1) }, () => new Animated.Value(0)),
    [stepCount]
  );
  const lineAnimations = useMemo(
    () => Array.from({ length: Math.max(stepCount - 1, 0) }, () => new Animated.Value(0)),
    [stepCount]
  );
  const providerAnimations = useMemo(
    () => Array.from({ length: Math.max(providerCount, 1) }, () => new Animated.Value(0)),
    [providerCount]
  );
  const hasAnimatedTimelineRef = useRef(false);
  const lastRequestIdRef = useRef<string | null>(null);

  // Reset animation + loaded flags when viewing a different job
  useEffect(() => {
    if (params.requestId !== lastRequestIdRef.current) {
      lastRequestIdRef.current = params.requestId ?? null;
      hasAnimatedTimelineRef.current = false;
      hasLoadedRef.current = false;
    }
  }, [params.requestId]);

  // Initial load handled by useFocusEffect – avoids double load + flash

  // Refresh when screen focuses + poll when job is active (scheduled, in_progress, reviewing)
  const loadRequestDataRef = useRef(loadRequestData);
  loadRequestDataRef.current = loadRequestData;

  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!params.requestId) return;

      // First focus: full load with spinner. Later: silent load (no loading flash)
      const initTimer = setTimeout(() => {
        loadRequestDataRef.current(hasLoadedRef.current);
        hasLoadedRef.current = true;
      }, 50);

      // Poll every 15s (was 5s – reduced to limit log spam when backend has errors)
      const poll = () => loadRequestDataRef.current(true);
      const pollInterval = setInterval(poll, 15000);
      const firstPollTimer = setTimeout(poll, 5000);

      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') poll();
      });

      return () => {
        clearTimeout(initTimer);
        clearTimeout(firstPollTimer);
        clearInterval(pollInterval);
        sub.remove();
      };
    }, [params.requestId])
  );


  const handleAcceptQuotation = async (quotationId: number) => {
    if (!params.requestId) return;

    try {
      setIsLoading(true);
      const response = await serviceRequestService.acceptQuotation(quotationId);

      haptics.success();
      showSuccess(response.message || 'Quotation accepted! You can now proceed to payment.');


      await loadRequestData();
      await loadQuotations();

      const acceptedQuotation = quotations.find(q => q.id === quotationId);
      if (acceptedQuotation) {
        router.push({
          pathname: '/ConfirmWalletPaymentScreen',
          params: {
            requestId: params.requestId,
            amount: acceptedQuotation.total.toString(),
            quotationId: quotationId.toString(),
            providerName: acceptedQuotation.provider?.name,
            serviceName: request?.jobTitle || 'Service Request',
          },
        } as any);
      }
        } catch (error: any) {
          if (error instanceof AuthError) {
            await handleAuthErrorRedirect(router);
            return;
          }
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


  const handleRejectQuotation = async (quotationId: number) => {
    if (!params.requestId) return;

    try {
      setIsLoading(true);
      const response = await serviceRequestService.rejectQuotation(quotationId);

      haptics.success();
      showSuccess(response.message || 'Quotation rejected successfully.');

      await loadQuotations();


      const currentIndex = quotations.findIndex(q => q.id === quotationId);
      if (currentIndex >= 0 && quotations.length > 1) {
        const nextIndex = currentIndex < quotations.length - 1 ? currentIndex : currentIndex - 1;
        if (nextIndex >= 0) {
          setCurrentQuoteIndex(nextIndex);
        }
      } else if (quotations.length === 1) {

        setCurrentQuoteIndex(0);
      }
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
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

  const handleCompleteJob = async () => {
    if (!params.requestId || !request) return;


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

      if (!params.requestId) return;
      const requestId = parseInt(params.requestId, 10);
              const response = await serviceRequestService.completeServiceRequest(requestId);

      haptics.success();
              showSuccess(response.message || 'Job completed successfully! Payment has been transferred to the provider.');

      await loadRequestData();

              setTimeout(() => {
                router.replace({
                  pathname: '/CompletedJobDetail',
                  params: { requestId: params.requestId },
                } as any);
              }, 1500);
    } catch (error: any) {
              if (error instanceof AuthError) {
                await handleAuthErrorRedirect(router);
                return;
              }
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
    // Only animate on first load – avoid re-animating on every poll/refresh (causes glitching)
    if (hasAnimatedTimelineRef.current) return;
    hasAnimatedTimelineRef.current = true;

    // Enhanced timeline animation with haptics - More dynamic and smooth
    const timelineSequence = timelineAnimations.slice(0, timelineSteps.length).map((anim, index) =>
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
      timelineAnimations.slice(0, timelineSteps.length).forEach((anim, index) => {
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
    const lineSequence = lineAnimations.slice(0, Math.max(0, timelineSteps.length - 1)).map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: (index + 1) * 100 + 150,
        useNativeDriver: false,
      })
    );
    Animated.stagger(80, lineSequence).start();

    // Provider cards animation
    const providerSequence = providerAnimations.slice(0, mappedProviders.length).map((anim, index) =>
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
      <View style={{ marginTop: 4, marginBottom: 28 }}>
        {timelineSteps.map((step, index) => {
          const isLast = index === timelineSteps.length - 1;
          const animation = timelineAnimations[index];
          const lineAnim = !isLast ? lineAnimations[index] : null;

          const IconComponent = step.icon || Circle;
          const iconSize = step.isCompleted || step.isActive ? 14 : 12;

          return (
            <View key={step.id} className="flex-row" style={{ marginBottom: isLast ? 0 : 14 }}>
              <View className="items-center" style={{ marginRight: 12 }}>
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
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0,
                    shadowRadius: 0,
                    elevation: 0,
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
                      backgroundColor: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                            outputRange: ['#E5E7EB', step.isCompleted ? step.dotColor : step.isActive ? step.dotColor : '#E5E7EB'],
                        })
                        : '#E5E7EB',
                      marginTop: 6,
                      borderRadius: 1,
                      minHeight: 30,
                      height: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                            outputRange: [0, 30],
                        })
                        : 30,
                    }}
                  />
                )}
              </View>
              <Animated.View
                style={{
                  flex: 1,
                  opacity: animation,
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0],
                      }),
                    },
                  ],
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: step.isActive
                    ? '#EADFC2'
                    : step.isCompleted
                      ? '#E3ECD9'
                      : '#EDF0F2',
                  padding: 13,
                  marginRight: 4,
                  shadowColor: '#101828',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  elevation: 0,
                }}
              >
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      color: step.isCompleted || step.isActive ? Colors.textPrimary : Colors.textSecondaryDark,
                      marginBottom: 4,
                      lineHeight: 19,
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: step.isCompleted || step.isActive ? Colors.textSecondaryDark : Colors.textTertiary,
                      lineHeight: 18,
                    }}
                  >
                    {step.description}
                  </Text>
                </View>
                <View style={{ marginTop: 2 }}>
                  <AnimatedStatusChip
                    status={step.status}
                    statusColor={step.accent}
                    textColor={step.isCompleted ? '#166534' : step.isActive ? '#92400E' : '#6B7280'}
                    size="small"
                    animated={true}
                    variant="text"
                  />
                </View>
                {((step as any).showPayLogistics || (step as any).showRejectVisit || (step as any).showPayService) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(step as any).showPayService && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          haptics.light();
                          const quote = (step as any).acceptedQuotation;
                          router.push({
                            pathname: '/ConfirmWalletPaymentScreen' as any,
                            params: {
                              requestId: params.requestId,
                              amount: String((step as any).payAmount ?? 0),
                              quotationId: quote?.id?.toString(),
                              providerName: quote?.provider?.name || 'Service Provider',
                              serviceName: request?.jobTitle || 'Service Request',
                              paymentType: 'service' as const,
                            },
                          } as any);
                        }}
                        style={{
                          backgroundColor: Colors.accent,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                          Pay service • ₦{((step as any).payAmount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {(step as any).showPayLogistics && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          haptics.light();
                          router.push({
                            pathname: '/ConfirmWalletPaymentScreen' as any,
                            params: {
                              requestId: params.requestId,
                              amount: String((step as any).logisticsCost ?? 0),
                              paymentType: 'logistics_fee' as const,
                              serviceName: request?.jobTitle || 'Inspection',
                            },
                          } as any);
                        }}
                        style={{
                          backgroundColor: Colors.accent,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                          Pay visit fee • ₦{Number((step as any).logisticsCost ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {(step as any).showRejectVisit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          haptics.light();
                          Alert.alert(
                            'Decline visit?',
                            'Provider will be notified. They can send a quotation directly without visiting.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Decline visit',
                                style: 'destructive',
                                onPress: async () => {
                                  const rid = Number(params.requestId);
                                  if (isNaN(rid)) return;
                                  try {
                                    const declineResponse = await serviceRequestService.declineVisit(rid);
                                    if (__DEV__) {
                                      console.log('[OngoingJobDetails] inline decline visit completed', {
                                        requestId: rid,
                                        declineResponse,
                                      });
                                    }
                                    haptics.success();
                                    showSuccess('Visit declined. Provider can send quotation directly.');
                                    loadRequestData();
                                  } catch (err: any) {
                                    if (err instanceof AuthError) {
                                      await handleAuthErrorRedirect(router);
                                      return;
                                    }
                                    haptics.error();
                                    const msg = getSpecificErrorMessage(err, 'decline_visit') ?? err?.message ?? 'Failed to decline visit.';
                                    showError(msg);
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        style={{
                          backgroundColor: Colors.backgroundGray,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.textSecondaryDark }}>
                          Decline visit
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Animated.View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderProviderCard = (provider: typeof mappedProviders[number], index: number, compactBottom?: boolean) => {
    const animation = providerAnimations[index];
    const proximityLine = formatProviderProximitySubtitle(provider.distanceKm, provider.minutesAway);
    const providerKey = provider.providerId ?? provider.id;
    const quoteExpanded = expandedQuoteProviderId === providerKey;
    return (
      <Animated.View
        key={provider.id}
        style={{
          opacity: 1,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0],
              }),
            },
          ],
        }}
        className={`${compactBottom ? 'mb-2' : 'mb-8'} rounded-2xl bg-white border border-gray-100 shadow-[0px_12px_32px_rgba(15,23,42,0.08)]`}
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
              {proximityLine != null && (
                <Text className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                  {proximityLine}
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
                  requestId: params.requestId,
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
          <View className="px-5 mt-3 mb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                haptics.selection();
                setExpandedQuoteProviderId((current) => (current === providerKey ? null : providerKey));
              }}
              className="rounded-2xl bg-gray-50 px-4 py-4 border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins-Medium' }}>
                    Quote submitted
                  </Text>
                  <Text className="text-sm text-gray-900" style={{ fontFamily: 'Poppins-SemiBold' }} numberOfLines={1}>
                    Tap to {quoteExpanded ? 'hide' : 'review'} quote details
                  </Text>
                </View>
                <View className="flex-row items-center">
                <Text className="text-lg text-[#6A9B00]" style={{ fontFamily: 'Poppins-Bold' }}>
                  {provider.quote}
                </Text>
                  <Ionicons
                    name={quoteExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6B7280"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>

              {quoteExpanded ? (
                <View className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Regular' }}>
                    {provider.quoteDetails}
                  </Text>
                  <Text className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'Poppins-Medium' }}>
                    Review cost and details, then accept or decline.
                  </Text>
                  <Text className="text-sm text-gray-900" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Duration: <Text style={{ fontFamily: 'Poppins-Regular' }}>{provider.duration}</Text>
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                {provider.inspectionStatus}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  haptics.light();
                  setActiveTab('Quotations');
                  const quoteIndex = (Array.isArray(quotations) ? quotations : []).findIndex((q: any) => q?.provider?.id === provider.providerId);
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
          /* No quote yet: status is shown only in the timeline below; card shows only provider identity + pill */
          null
        )}

        {/* Provider selection now happens in ServiceMapScreen during booking confirmation */}
        {/* No need to show selection button here */}
      </Animated.View>
    );
  };


  return (
    <SafeAreaWrapper edges={['bottom']}>
      <View className="flex-1 px-4" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              if (params.fromBooking === '1') {
                router.replace('/(tabs)/jobs' as any);
              } else {
                router.back();
              }
            }}
            style={{ marginRight: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="text-xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
            Job Details
          </Text>
        </View>

        {/* Full-width tabs with green underline for active tab */}
        <View className="flex-row border-b border-gray-200" style={{ width: '100%', marginBottom: 4 }}>
          {TAB_ITEMS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(tab);
                }}
                style={{
                  flex: 1,
                  paddingBottom: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: isActive ? 'Poppins-Bold' : 'Poppins-Medium',
                    color: isActive ? '#000000' : '#9CA3AF',
                  }}
                >
                  {tab}
                </Text>
                <View
                  style={{
                    height: 2,
                    width: '100%',
                    marginTop: 8,
                    backgroundColor: isActive ? '#6A9B00' : 'transparent',
                    borderRadius: 1,
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20 px-6" style={{ minHeight: 200 }}>
            <ActivityIndicator size="large" color="#6A9B00" />
            <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
              Loading job details...
            </Text>
          </View>
        ) : !request && (hasAttemptedLoad || !params.requestId) ? (
          <View className="flex-1 items-center justify-center py-20 px-6" style={{ minHeight: 200 }}>
            <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4 text-center px-4" style={{ fontFamily: 'Poppins-Medium' }}>
              {params.requestId ? 'Unable to load job details. Please try again.' : 'Invalid job. Please go back and try again.'}
            </Text>
            {params.requestId ? (
              <TouchableOpacity
                onPress={() => loadRequestData()}
                className="mt-6 px-6 py-3 bg-[#6A9B00] rounded-xl"
                activeOpacity={0.85}
              >
                <Text className="text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Retry
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 0 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadRequestData(true);
                  setRefreshing(false);
                }}
                tintColor="#6A9B00"
              />
            }
          >
            {activeTab === 'Updates' ? (
              <>
                {/* Visit fee accept/decline moved into TimelineStatusCard header (cleaner layout) */}

                {/* Provider cards: only when there are quotations to show (keeps Updates tab clean during inspection) */}
                {(() => {
                  const qList = Array.isArray(quotations) ? quotations : [];
                  const hasQ = qList.some((q: any) => q?.sentAt || q?.submittedAt || (q?.status && q?.status !== 'draft') || (q?.total != null && q?.total > 0));
                  if (mappedProviders.length > 0 && hasQ) {
                    const isQuotationPending = (acceptedProviders?.length || 0) > 0 && !hasQ;
                    return (
                      <View>
                        {mappedProviders.map((provider, index) => renderProviderCard(provider, index, isQuotationPending && index === mappedProviders.length - 1))}
                      </View>
                    );
                  }
                  // Pending + no quotations yet: status card + timeline already explain "waiting";
                  // avoid duplicating the same empty-state message here.
                  return null;
                })()}

                {/* Standard status card: current job status with provider info + blue status box */}
                {timelineHeader && (
                  <View style={{ marginBottom: 16 }}>
                    <TimelineStatusCard
                      header={timelineHeader as any}
                      quotations={quotations}
                      acceptedProviders={acceptedProviders}
                      mappedProviders={mappedProviders as any}
                      request={request}
                      requestId={params.requestId}
                      clientIdentity={clientIdentity}
                    />
                  </View>
                )}

                {renderTimeline()}

                {/* Mark as complete: GREEN when status is in_progress (provider started) or reviewing (provider marked complete, client confirms to release payment) */}
                {(() => {
                  const statusNorm = (request?.status || '').toString().toLowerCase().replace(/[\s_-]/g, '');
                  const canMarkComplete = (statusNorm === 'inprogress' || statusNorm === 'reviewing') && !isLoading;
                  return (
                <TouchableOpacity
                  disabled={!canMarkComplete}
                  className={`rounded-xl py-4 items-center justify-center mb-8 ${canMarkComplete ? 'bg-[#6A9B00]' : 'bg-gray-200'}`}
                  activeOpacity={canMarkComplete ? 0.85 : 1}
                  onPress={handleCompleteJob}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      className={`text-sm ${canMarkComplete ? 'text-white' : 'text-gray-500'}`}
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {statusNorm === 'completed' ? 'Job Completed' : 'Mark as complete'}
                    </Text>
                  )}
                </TouchableOpacity>
                  );
                })()}
              </>
            ) : (
              <View className="flex-1">
                {/* Quote status banner */}
                <View
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: 18,
                    paddingVertical: 12,
                    paddingHorizontal: 13,
                    marginBottom: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 0.6,
                    borderColor: 'rgba(17, 24, 39, 0.04)',
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#F2F8EA',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.accent }}>
                      {quotations.length > 0 ? quotations.length : '•'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 2 }}>
                      {quotations.length > 0 ? 'Quotations ready' : 'Waiting for quotations'}
                    </Text>
                    <Text style={{ fontSize: 11, lineHeight: 16, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                      {quotations.length > 0
                        ? 'Compare costs and choose the provider that works best for you.'
                        : 'Provider quotations will appear here once submitted.'}
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
                        <>
                          <View className="bg-[#DCFCE7] rounded-xl py-3 px-4 items-center justify-center mt-2">
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                              <Text className="text-[#16A34A] text-sm" style={{ fontFamily: 'Poppins-SemiBold' }}>
                                Quotation Accepted
                              </Text>
                            </View>
                            <Text className="text-[#16A34A] text-xs mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              {request?.status === 'accepted' ? 'Proceed to payment to start the job' : 'Payment completed'}
                            </Text>
                          </View>
                          
                          {/* Pay Now Button - Show if quotation accepted but payment not completed */}
                          {request?.status === 'accepted' && (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              className="bg-[#6A9B00] rounded-xl py-4 items-center justify-center mt-3"
                              onPress={async () => {
                                const currentQuote = quotations[currentQuoteIndex];
                                if (currentQuote && currentQuote.id) {
                                  haptics.light();
                                  router.push({
                                    pathname: '/ConfirmWalletPaymentScreen' as any,
                                    params: {
                                      requestId: params.requestId,
                                      amount: currentQuote.total.toString(),
                                      quotationId: currentQuote.id.toString(),
                                      providerName: currentQuote.provider.name,
                                      serviceName: request?.jobTitle || 'Service Request',
                                    },
                                  } as any);
                                } else {
                                  showError('Invalid quotation. Please try again.');
                                }
                              }}
                            >
                              <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                                Pay Now
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
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
