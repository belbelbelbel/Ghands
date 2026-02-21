
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { Colors } from '@/lib/designSystem';
import { analytics } from '@/services/analytics';
import { QuotationWithProvider, ServiceRequest, serviceRequestService, walletService } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, CheckCircle2, Circle, Clock, FileText, MapPinned, Wrench } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const params = useLocalSearchParams<{ requestId?: string; paymentStatus?: string }>();
  const { toast, showError, showSuccess, hideToast } = useToast();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [acceptedProviders, setAcceptedProviders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<QuotationWithProvider[]>([]);
  const [paymentTransaction, setPaymentTransaction] = useState<any | null>(null); // Track payment transaction from wallet
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const quoteCardAnim = useRef(new Animated.Value(1)).current;

  // Selection flow state
  const [isSelectingProvider, setIsSelectingProvider] = useState(false);
  const [selectionCountdown, setSelectionCountdown] = useState<number | null>(null);

  const cameFromPaymentSuccess = params.paymentStatus === 'success';

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
        ? `Sent to ${totalProvidersSentTo} nearby ${totalProvidersSentTo === 1 ? 'provider' : 'providers'}. They will respond shortly.`
        : 'Submitted. Nearby providers will be notified and can respond.',
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
                                           quotations.length > 0; // If quotations exist, providers must have accepted
    const hasAcceptedProviders = hasAcceptedProvidersFromAPI || hasAcceptedProvidersFromStatus;
    
    // Show provider acceptance step if providers have accepted
    if (hasAcceptedProviders) {
      // Get the latest acceptance time
      const acceptanceTimes = acceptedProviders
        .filter(p => p.acceptance?.acceptedAt)
        .map(p => new Date(p.acceptance.acceptedAt).getTime());
      
      const latestAcceptance = acceptanceTimes.length > 0 
        ? Math.max(...acceptanceTimes)
        : Date.now();
      
      // Use actual count if available, otherwise infer from status
      const providerCount = hasAcceptedProvidersFromAPI ? acceptedProviders.length : 1;
      const acceptanceTime = latestAcceptance || request.updatedAt || request.createdAt || new Date().toISOString();
      
      timeline.push({
        id: 'step-2',
        title: 'Provider Accepted',
        description: hasAcceptedProvidersFromAPI 
          ? `${providerCount} ${providerCount === 1 ? 'provider has' : 'providers have'} accepted. They will inspect and send a quotation.`
          : 'Provider accepted. They will inspect and send a quotation.',
        status: `Completed - ${formatTimeAgo(String(acceptanceTime))}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: CheckCircle2,
      });
      
    } else {
      // No providers accepted yet
      timeline.push({
        id: 'step-2',
        title: 'Provider Acceptance',
        description: 'Waiting for providers to review and accept your request.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
      
    }

    // Step 3a: Inspection (visit) - separate from quotation
    const hasQuotationSent = quotations.some(q => q.sentAt || (q.status && q.status !== null));
    const visitRequest = (request as any).visitRequest;
    const hasVisitRequested = !!(visitRequest && (visitRequest.scheduledDate || visitRequest.logisticsCost != null));
    const visitPaid = visitRequest?.logisticsStatus === 'paid';

    if (hasAcceptedProviders) {
      if (hasQuotationSent) {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: hasVisitRequested ? 'Visit completed.' : 'Provider sent quotation directly.',
          status: 'Completed',
          accent: '#DCFCE7',
          dotColor: '#6A9B00',
          isActive: false,
          isCompleted: true,
          icon: MapPinned,
        });
      } else if (hasVisitRequested) {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: visitPaid
            ? `Visit confirmed for ${visitRequest.scheduledDate || ''} ${visitRequest.scheduledTime || ''}. Awaiting quotation.`
            : `Provider requested a visit on ${visitRequest.scheduledDate || ''} ${visitRequest.scheduledTime || ''}. Confirm by paying ₦${visitRequest.logisticsCost ?? 0} or decline.`,
          status: visitPaid ? 'Completed' : 'In Progress',
          accent: visitPaid ? '#DCFCE7' : '#FEF9C3',
          dotColor: visitPaid ? '#6A9B00' : '#F59E0B',
          isActive: !visitPaid,
          isCompleted: visitPaid,
          icon: MapPinned,
          showPayLogistics: !visitPaid,
          showRejectVisit: !visitPaid,
          logisticsCost: visitRequest.logisticsCost ?? 0,
        });
      } else {
        timeline.push({
          id: 'step-3',
          title: 'Inspection',
          description: 'Provider will inspect and send a quotation. You will receive it shortly.',
          status: 'In Progress',
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
        description: 'Waiting for providers to accept. Then they will inspect and send a quotation.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 3b: Quotation
    if (hasAcceptedProviders) {
      if (hasQuotationSent) {
        const quotation = quotations.find(q => q.sentAt || (q.status && q.status !== null));
        timeline.push({
          id: 'step-3b',
          title: 'Quotation',
          description: 'Provider sent a quotation. Review cost and details, then accept or decline.',
          status: `Completed - ${formatTimeAgo(quotation?.sentAt || request.updatedAt || '')}`,
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
          description: hasVisitRequested && !visitPaid
            ? 'After you pay the logistics fee, provider will visit and send a quotation.'
            : 'Provider is preparing a quotation. You will receive it shortly.',
          status: 'In Progress',
          accent: '#FEF9C3',
          dotColor: '#F59E0B',
          isActive: true,
          isCompleted: false,
          icon: FileText,
        });
      }
    } else {
      timeline.push({
        id: 'step-3b',
        title: 'Quotation',
        description: 'Waiting for quotation from provider.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 4: Quotation Accepted
    // Client accepts the quotation (separate from payment)
    const quotationAccepted = quotations.some(q => q.status === 'accepted');
    const acceptedQuotation = quotations.find(q => q.status === 'accepted');
    
    if (quotationAccepted) {
      timeline.push({
        id: 'step-4',
        title: 'Quotation Accepted',
        description: 'You accepted the quotation. Proceed with payment to secure the job.',
        status: `Completed - ${formatTimeAgo((acceptedQuotation as any)?.acceptedAt || acceptedQuotation?.sentAt || request.updatedAt || '')}`,
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
        title: 'Quotation Accepted',
        description: 'Quotation received. Review and accept to proceed with payment.',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Clock,
      });
    } else {
      // No quotation sent yet - grey (pending)
      timeline.push({
        id: 'step-4',
        title: 'Quotation Accepted',
        description: 'Waiting for quotation from provider.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    // Step 5: Job in Progress
    // This step ONLY becomes active when provider clicks "Start" button (status becomes 'in_progress')
    // Payment is NOT part of this timeline - it's handled separately
    // - Status 'in_progress' → YELLOW (provider has started, job ongoing)
    // - Status 'completed' → GREEN (job completed)
    // - Status 'scheduled' (payment done) → GREY (waiting for provider to click Start)
    
    if (request.status === 'in_progress') {
      timeline.push({
        id: 'step-5',
        title: 'Job in Progress',
        description: 'Provider is on site working. Chat to track progress. Mark complete when done.',
        status: 'In Progress',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else if (request.status === 'reviewing' || request.status === 'completed') {
      timeline.push({
        id: 'step-5',
        title: 'Job in Progress',
        description: 'Work completed. Review and mark as complete to release payment.',
        status: 'Completed',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        isActive: false,
        isCompleted: true,
        icon: Wrench,
      });
    } else if (((request.status as any) || '').toString().toLowerCase() === 'scheduled' || (quotationAccepted && paymentTransaction)) {
      // Payment completed – waiting for provider to click Start → YELLOW (in progress / action pending)
      timeline.push({
        id: 'step-5',
        title: 'Job in Progress',
        description: 'Payment secured. Provider will start the job shortly.',
        status: 'Waiting for provider',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: Wrench,
      });
    } else {
      // Not ready yet - grey (pending) - show Pay button when quotation accepted and not paid
      const payAmount = quotationAccepted ? (acceptedQuotation?.total ?? 0) : 0;
      const isPaid = !!paymentTransaction;
      timeline.push({
        id: 'step-5',
        title: 'Job in Progress',
        description: quotationAccepted
          ? 'Complete payment to authorize the provider to start.'
          : 'Accept quotation and complete payment to proceed.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
        showPayService: quotationAccepted && payAmount > 0 && !isPaid,
        payAmount,
        acceptedQuotation: quotationAccepted ? acceptedQuotation : undefined,
      });
    }

    // Step 6: Complete
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'The job has been successfully completed and approved. Payment has been released from escrow to the provider. Thank you for using G-Hands! You can leave a review and provide feedback to help improve our service.',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
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
        description: 'Provider has finished. Confirm satisfaction to release payment from escrow.',
        status: 'Confirm to release payment',
        accent: '#FEF9C3',
        dotColor: '#F59E0B',
        isActive: true,
        isCompleted: false,
        icon: CheckCircle,
      });
    } else {
      // Not completed yet - grey (pending)
      timeline.push({
        id: 'step-6',
        title: 'Complete',
        description: 'Once the provider finishes the work and you are satisfied with the results, you can mark the job as complete. This will release payment from escrow to the provider.',
        status: 'Pending',
        accent: '#F3F4F6',
        dotColor: '#9CA3AF',
        isActive: false,
        isCompleted: false,
        icon: Circle,
      });
    }

    return timeline;
  }, [request, acceptedProviders, quotations, selectionCountdown, paymentTransaction]);

  // High-level header description above the timeline - consistent design with variant for action states
  const timelineHeader = useMemo(() => {
    if (!request) return null;

    const hasAcceptedProviders = (acceptedProviders && acceptedProviders.length > 0) || !!request.selectedProvider;
    const hasQuotationSent = quotations.some(q => q.sentAt || (q.status && q.status !== null));
    const acceptedQuotation = quotations.find(q => q.status === 'accepted');
    const quotationAccepted = !!acceptedQuotation;

    const formatCurrency = (value: number | undefined | null): string => {
      const amount = typeof value === 'number' ? value : 0;
      return amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Resolve provider for card when available
    const headerProvider = acceptedQuotation?.provider ?? acceptedProviders?.[0]?.provider ?? null;

    if (request.status === 'completed') {
      return {
        title: 'Job completed',
        subtitle: 'Job complete. Funds released to provider. Thank you.',
        variant: 'neutral' as const,
        statusPill: 'Completed',
        pillBg: '#DCFCE7',
        pillText: '#166534',
        timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null,
        provider: headerProvider,
      };
    }

    if (request.status === 'in_progress') {
      return {
        title: 'Job in progress',
        subtitle: 'Provider is on site. Mark complete when satisfied.',
        variant: 'neutral' as const,
        statusPill: 'In progress',
        pillBg: '#FEF9C3',
        pillText: '#92400E',
        timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null,
        provider: headerProvider,
      };
    }

    if (request.status === 'reviewing') {
      return {
        title: 'Provider finished',
        subtitle: 'Review the work and mark complete to release payment.',
        variant: 'neutral' as const,
        statusPill: 'Awaiting confirmation',
        pillBg: '#FEF9C3',
        pillText: '#92400E',
        timestamp: request.updatedAt ? formatTimeAgo(request.updatedAt) : null,
        provider: headerProvider,
      };
    }

    const statusLower = typeof (request.status as any) === 'string' ? (request.status as any).toLowerCase() : (request.status as any);
    const isPaidByStatus = statusLower === 'scheduled' || statusLower === 'in_progress' || statusLower === 'reviewing' || statusLower === 'completed';
    const isPaymentConfirmed = cameFromPaymentSuccess ||
      (quotationAccepted && (isPaidByStatus || !!paymentTransaction));

    if (isPaymentConfirmed) {
      const amountText = acceptedQuotation ? `₦${formatCurrency(acceptedQuotation.total)}` : '';
      return {
        title: 'Payment secured',
        subtitle: amountText ? `Payment of ${amountText} secured in escrow. Waiting for provider to start.` : 'Payment secured. Waiting for provider to start.',
        variant: 'success' as const,
        statusPill: 'Payment confirmed',
        pillBg: '#DCFCE7',
        pillText: '#166534',
        timestamp: null,
        provider: headerProvider,
      };
    }

    if (quotationAccepted && !isPaymentConfirmed) {
      const amountText = acceptedQuotation ? `₦${formatCurrency(acceptedQuotation.total)}` : '';
      return {
        title: 'Quotation accepted – payment required',
        subtitle: amountText ? `Accepted ${amountText}. Complete payment to secure the job.` : 'Complete payment to secure the job.',
        variant: 'action' as const,
        showPayButton: true,
        payAmount: acceptedQuotation?.total ?? 0,
        acceptedQuotation,
        statusPill: 'Payment required',
        pillBg: '#FEF9C3',
        pillText: '#92400E',
        timestamp: null,
        provider: headerProvider,
      };
    }

    if (hasQuotationSent) {
      return {
        title: 'Quotation received',
        subtitle: 'Review cost and details, then accept or decline.',
        variant: 'neutral' as const,
        statusPill: 'Quote submitted',
        pillBg: '#DBEAFE',
        pillText: '#1E40AF',
        timestamp: null,
        provider: headerProvider,
      };
    }

    if (hasAcceptedProviders) {
      const firstAccept = acceptedProviders?.[0];
      const acceptedAt = firstAccept?.acceptance?.acceptedAt ?? request.updatedAt ?? request.selectedAt;
      return {
        title: 'Inspection in progress',
        subtitle: 'Provider has accepted your request. Waiting for inspection and quotation.',
        variant: 'neutral' as const,
        statusPill: 'Provider accepted',
        pillBg: '#FEF9C3',
        pillText: '#92400E',
        timestamp: acceptedAt ? formatTimeAgo(acceptedAt) : null,
        provider: headerProvider,
      };
    }

    return {
      title: 'Waiting for providers',
      subtitle: 'Nearby providers are being notified. Updates will appear here.',
      variant: 'neutral' as const,
      statusPill: 'Pending',
      pillBg: '#F3F4F6',
      pillText: '#6B7280',
      timestamp: null,
      provider: null,
    };
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
    } catch {
      // Don't show error to user, just silently fail
      setPaymentTransaction(null);
    }
  }, []);

  const loadRequestData = useCallback(async () => {
    if (!params.requestId) return;

    setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);

      // 1) Load core request details
      const requestDetails = await serviceRequestService.getRequestDetails(requestId);
      setRequest(requestDetails);

      // 2) Check wallet transactions for payment (fallback when backend status is stale)
      await checkPaymentTransaction(requestId).catch(() => {});

      // 3) Load accepted providers (needed for timeline / provider cards)
        try {
          const providers = await serviceRequestService.getAcceptedProviders(requestId);
        const providersArray = Array.isArray(providers) ? providers : [];
        setAcceptedProviders(providersArray);

        } catch (error: any) {
        if (__DEV__) {
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
      if (__DEV__) {
      console.error('Error loading request data:', error);
      }
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      // Only show the page after everything is ready, to avoid flicker/glitches
      setIsLoading(false);
    }
  }, [params.requestId, loadQuotations, showError, checkPaymentTransaction]);

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
      const hasQuotationSent = !!providerQuotation && (providerQuotation.sentAt || (providerQuotation.status && providerQuotation.status !== null));
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

  // Load request details, accepted providers and quotations on mount
  useEffect(() => {
    if (params.requestId) {
      loadRequestData();
    }
  }, [params.requestId]);

  // Refresh data when screen comes into focus (e.g., returning from another screen)
  // This ensures timeline and status are always up to date with NO mid‑load glitches.
  useFocusEffect(
    useCallback(() => {
      if (params.requestId) {
        const timer = setTimeout(() => {
          loadRequestData();
        }, 500); // small delay to let backend settle after actions like payment
        return () => clearTimeout(timer);
      }
    }, [params.requestId, loadRequestData])
  );

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

      if (!params.requestId) return;
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
      <View className="mb-10">
        {timelineSteps.map((step, index) => {
          const isLast = index === timelineSteps.length - 1;
          const animation = timelineAnimations[index];
          const lineAnim = !isLast ? lineAnimations[index] : null;

          const IconComponent = step.icon || Circle;
          const iconSize = step.isCompleted || step.isActive ? 14 : 12;

          return (
            <View key={step.id} className="flex-row" style={{ marginBottom: 20 }}>
              <View className="items-center mr-4">
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
                      minHeight: 36,
                      height: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                            outputRange: [0, 36],
                        })
                        : 36,
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
                  style={{ 
                    fontSize: 13,
                    fontFamily: 'Poppins-Bold',
                    color: step.isCompleted || step.isActive ? Colors.textPrimary : Colors.textSecondaryDark,
                    marginBottom: 2,
                  }}
                >
                  {step.title}
                </Text>
                <Text 
                  style={{ 
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: step.isCompleted || step.isActive ? Colors.textSecondaryDark : Colors.textTertiary,
                    marginBottom: 4,
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
                {((step as any).showPayLogistics || (step as any).showRejectVisit || (step as any).showPayService) && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
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
                          paddingHorizontal: 16,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                          Pay Now (₦{((step as any).payAmount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
                          paddingHorizontal: 16,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                          Confirm & pay (₦{(step as any).logisticsCost ?? 0})
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
                                    await serviceRequestService.declineVisit(rid);
                                    haptics.success();
                                    showSuccess('Visit declined. Provider can send quotation directly.');
                                    loadRequestData();
                                  } catch (err: any) {
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
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textSecondaryDark }}>
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
        className="mb-8 rounded-2xl bg-white border border-gray-100 shadow-[0px_12px_32px_rgba(15,23,42,0.08)]"
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
                  const quoteIndex = quotations.findIndex(q => q.provider?.id === provider.providerId);
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
              style={{ backgroundColor: '#E0F2FE' }}
            >
              <Text className="text-sm text-gray-900 mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
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
            Job Details
          </Text>
        </View>

        {/* Full-width tabs with green underline for active tab */}
        <View className="flex-row border-b border-gray-200" style={{ width: '100%', marginBottom: 24 }}>
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
                {/* Provider / quotation section is shown ABOVE the timeline for better visibility */}
                {mappedProviders.length > 0 ? (
                  mappedProviders.map((provider, index) => renderProviderCard(provider, index))
                ) : (
                  // Only show "No providers" message if status is truly pending
                  // If status is in_progress/scheduled/completed, providers HAVE accepted (even if API didn't return them)
                  request?.status === 'pending' ? (
                  <View className="items-center justify-center py-12">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
                      No providers have accepted this request yet.
                    </Text>
                    <Text className="text-gray-500 mt-2 text-center text-sm" style={{ fontFamily: 'Poppins-Regular' }}>
                      Providers will appear here once they accept your request.
                    </Text>
                  </View>
                  ) : null // Don't show message if job is in progress - providers have accepted
                )}

                {/* Status card - hide when provider cards already show same "Inspection in Progress" content */}
                {timelineHeader && !(mappedProviders.length > 0 && (timelineHeader as any).statusPill === 'Provider accepted') && (
                  <View
                    style={{
                      marginBottom: 24,
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
                      {(timelineHeader as any).provider ? (
                        <View className="flex-row items-start">
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              haptics.light();
                              const p = (timelineHeader as any).provider;
                              router.push({
                                pathname: '/ProviderDetailScreen',
                                params: {
                                  providerName: p?.name,
                                  providerId: p?.id?.toString(),
                                },
                              } as any);
                            }}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          >
                            <Image
                              source={require('../assets/images/plumbericon2.png')}
                              style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16 }}
                              resizeMode="cover"
                            />
                            <View className="flex-1">
                              <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                                {(timelineHeader as any).provider?.name || 'Professional Service Provider'}
                              </Text>
                              <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                                Professional Service Provider
                              </Text>
                              {(() => {
                                const mp = mappedProviders.find(m => m.providerId === (timelineHeader as any).provider?.id) ?? mappedProviders[0];
                                return mp?.distanceKm != null ? (
                                  <Text className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                                    {mp.distanceKm.toFixed(1)} km away • ~{mp.minutesAway} min
                                  </Text>
                                ) : null;
                              })()}
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              haptics.light();
                              const p = (timelineHeader as any).provider;
                              router.push({
                                pathname: '/ChatScreen',
                                params: {
                                  providerName: p?.name,
                                  providerId: p?.id?.toString(),
                                  requestId: params.requestId,
                                },
                              });
                            }}
                          >
                            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#6B7280" />
                          </TouchableOpacity>
                          <View
                            style={{
                              backgroundColor: (timelineHeader as any).pillBg ?? '#FEF9C3',
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
                                color: (timelineHeader as any).pillText ?? '#92400E',
                              }}
                            >
                              {(timelineHeader as any).statusPill ?? 'Provider accepted'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-end">
                          <View
                            style={{
                              backgroundColor: (timelineHeader as any).pillBg ?? '#F3F4F6',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 20,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: 'Poppins-SemiBold',
                                color: (timelineHeader as any).pillText ?? '#6B7280',
                              }}
                            >
                              {(timelineHeader as any).statusPill ?? 'Pending'}
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
                          {timelineHeader.title}
                        </Text>
                        {timelineHeader.subtitle ? (
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: 'Poppins-Regular',
                              color: '#374151',
                              lineHeight: 21,
                            }}
                          >
                            {timelineHeader.subtitle}
                          </Text>
                        ) : null}
                        {(timelineHeader as any).timestamp ? (
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: 'Poppins-Regular',
                              color: '#6B7280',
                              marginTop: 8,
                            }}
                          >
                            {(timelineHeader as any).timestamp}
                          </Text>
                        ) : null}
                        {(timelineHeader as any).showPayButton && (timelineHeader as any).payAmount > 0 && (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              haptics.light();
                              const quote = (timelineHeader as any).acceptedQuotation;
                              router.push({
                                pathname: '/ConfirmWalletPaymentScreen' as any,
                                params: {
                                  requestId: params.requestId,
                                  amount: String((timelineHeader as any).payAmount),
                                  quotationId: quote?.id?.toString(),
                                  providerName: quote?.provider?.name || 'Service Provider',
                                  serviceName: request?.jobTitle || 'Service Request',
                                  paymentType: 'service' as const,
                                },
                              } as any);
                            }}
                            style={{
                              marginTop: 14,
                              backgroundColor: Colors.accent,
                              paddingVertical: 12,
                              paddingHorizontal: 20,
                              borderRadius: 10,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                              Pay Now (₦{((timelineHeader as any).payAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {renderTimeline()}

                <TouchableOpacity
                  disabled={!['in_progress', 'reviewing'].includes(request.status) || isLoading}
                  className={`rounded-xl py-4 items-center justify-center mb-8 ${
                    ['in_progress', 'reviewing'].includes(request.status) && !isLoading ? 'bg-[#6A9B00]' : 'bg-gray-200'
                  }`}
                  activeOpacity={['in_progress', 'reviewing'].includes(request.status) && !isLoading ? 0.85 : 1}
                  onPress={handleCompleteJob}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      className={`text-sm ${
                        ['in_progress', 'reviewing'].includes(request.status) ? 'text-white' : 'text-gray-500'
                      }`}
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {request.status === 'completed' ? 'Job Completed' : 'Mark as complete'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
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
