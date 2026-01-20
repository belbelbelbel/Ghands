import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { analytics } from '@/services/analytics';
import { serviceRequestService, ServiceRequest } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const quoteCardAnim = useRef(new Animated.Value(1)).current;

  // Generate timeline from request data
  const timelineSteps = useMemo(() => {
    if (!request) return [];

    const timeline = [];

    // Step 1: Job Request Submitted (always completed)
    timeline.push({
      id: 'step-1',
      title: 'Job Request Submitted',
      description: `Request sent to ${acceptedProviders.length} ${acceptedProviders.length === 1 ? 'provider' : 'providers'}`,
      status: `Completed - ${formatTimeAgo(request.createdAt || new Date().toISOString())}`,
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
    });

    // Step 2: Inspection & Quotation
    if (request.status === 'pending' && acceptedProviders.length > 0) {
      timeline.push({
        id: 'step-2',
        title: 'Inspection & Quotation',
        description: `${acceptedProviders.length} ${acceptedProviders.length === 1 ? 'provider has' : 'providers have'} accepted`,
        status: `In Progress - ${acceptedProviders.length} accepted`,
        accent: '#DBEAFE',
        dotColor: '#F59E0B',
      });
    } else if (request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') {
      timeline.push({
        id: 'step-2',
        title: 'Inspection & Quotation',
        description: 'Provider selected and quotation accepted',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
      });
    }

    // Step 3: Job in Progress
    if (request.status === 'in_progress') {
      timeline.push({
        id: 'step-3',
        title: 'Job in Progress',
        description: 'Provider is on site',
        status: 'In Progress',
        accent: '#DBEAFE',
        dotColor: '#F59E0B',
      });
    } else if (request.status === 'completed') {
      timeline.push({
        id: 'step-3',
        title: 'Job in Progress',
        description: 'Provider was on site',
        status: 'Completed',
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
      });
    }

    // Step 4: Complete
    if (request.status === 'completed') {
      timeline.push({
        id: 'step-4',
        title: 'Complete',
        description: 'Review the job and provide feedback!!',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
      });
    }

    return timeline;
  }, [request, acceptedProviders]);

  // Generate quotations from accepted providers
  const quotations = useMemo(() => {
    return generateDummyQuotations(acceptedProviders, request?.categoryName);
  }, [acceptedProviders, request?.categoryName]);

  // Map accepted providers to provider cards format
  const mappedProviders = useMemo(() => {
    if (!acceptedProviders || acceptedProviders.length === 0) return [];

    return acceptedProviders.map((item, index) => {
      // Randomly assign some providers as "Quote submitted" and others as "Inspecting"
      const hasQuote = index < 2 || Math.random() > 0.3; // First 2 or 70% chance

      return {
        id: `provider-${item.provider.id}`,
        name: item.provider.name,
        role: 'Professional Service Provider',
        image: require('../assets/images/plumbericon2.png'),
        status: hasQuote ? 'Quote submitted' : 'Inspecting',
        statusColor: hasQuote ? '#DCFCE7' : '#FEF9C3',
        statusTextColor: hasQuote ? '#166534' : '#92400E',
        badgeColor: '#CFFAFE',
        quote: hasQuote ? `$${65 + index * 10}` : null,
        quoteDetails: hasQuote
          ? 'Professional service with high-quality materials. Includes parts and labor with warranty.'
          : 'Provider is currently on-site conducting inspection. Quote will be available shortly.',
        duration: hasQuote ? `${2 + index}-${3 + index} hours` : null,
        inspectionStatus: hasQuote
          ? `Quote submitted ${formatTimeAgo(item.acceptance.acceptedAt)}`
          : 'Inspection in progress',
        cta: hasQuote ? 'View full quote' : null,
        providerId: item.provider.id,
        distanceKm: item.distanceKm,
        minutesAway: item.minutesAway,
      };
    });
  }, [acceptedProviders]);

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

  // Load request details and accepted providers
  useEffect(() => {
    if (params.requestId) {
      loadRequestData();
    }
  }, [params.requestId]);

  const loadRequestData = async () => {
    if (!params.requestId) return;

    setIsLoading(true);
    try {
      const requestId = parseInt(params.requestId, 10);

      // Load request details
      const requestDetails = await serviceRequestService.getRequestDetails(requestId);
      setRequest(requestDetails);

      // Load accepted providers (for Updates tab and Quotations)
      if (requestDetails.status === 'pending' || requestDetails.status === 'accepted' || requestDetails.status === 'in_progress') {
        try {
          const providers = await serviceRequestService.getAcceptedProviders(requestId);
          setAcceptedProviders(providers || []);
        } catch (error: any) {
          console.error('Error loading accepted providers:', error);
          // If no providers accepted yet, that's okay
          setAcceptedProviders([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading request data:', error);
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle select provider (accept quote)
  const handleSelectProvider = async (providerId: number) => {
    if (!params.requestId) return;

    try {
      const requestId = parseInt(params.requestId, 10);
      await serviceRequestService.selectProvider(requestId, providerId);

      haptics.success();
      showSuccess('Provider selected successfully! Request has been assigned.');

      // Reload request data to update status
      await loadRequestData();
    } catch (error: any) {
      console.error('Error selecting provider:', error);
      haptics.error();
      const errorMessage = getSpecificErrorMessage(error, 'select_provider');
      showError(errorMessage);
    }
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

    // Enhanced timeline animation with haptics
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
      // Light haptic when timeline finishes animating
      haptics.light();
    });

    // Animate progress lines after dots
    const lineSequence = lineAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: (index + 1) * 120 + 200,
        useNativeDriver: false,
      })
    );
    Animated.stagger(100, lineSequence).start();

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

          return (
            <View key={step.id} className="flex-row mb-6">
              <View className="items-center mr-5">
                <Animated.View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: step.dotColor,
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                      },
                    ],
                    opacity: animation,
                  }}
                />
                {!isLast && (
                  <Animated.View
                    className="w-0.5"
                    style={{
                      flex: 1,
                      backgroundColor: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#E5E7EB', step.dotColor],
                        })
                        : '#E5E7EB',
                      marginTop: 6,
                      height: lineAnim
                        ? lineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 60],
                        })
                        : 60,
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
                <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                  {step.title}
                </Text>
                <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Regular' }}>
                  {step.description}
                </Text>
                <AnimatedStatusChip
                  status={step.status}
                  statusColor={step.accent}
                  textColor="#111827"
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
                Inspection in Progress
              </Text>
              <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                {provider.quoteDetails}
              </Text>
            </View>
          </View>
        )}
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {activeTab === 'Updates' ? (
              <>
                {renderTimeline()}
                <TouchableOpacity
                  disabled={request.status !== 'in_progress'}
                  className={`rounded-xl py-4 items-center justify-center mb-8 ${request.status === 'in_progress' ? 'bg-[#6A9B00]' : 'bg-gray-200'
                    }`}
                  activeOpacity={request.status === 'in_progress' ? 0.85 : 1}
                  onPress={() => {
                    // Handle mark as complete
                    haptics.success();
                  }}
                >
                  <Text
                    className={`text-sm ${request.status === 'in_progress' ? 'text-white' : 'text-gray-500'}`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {request.status === 'completed' ? 'Job Completed' : 'Mark as complete'}
                  </Text>
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
                              providerId: (currentQuote as any).providerId?.toString() || currentQuote.id,
                              providerName: currentQuote.providerName,
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
                            source={quotations[currentQuoteIndex].providerImage}
                            className="w-14 h-14 rounded-full mr-3"
                            resizeMode="cover"
                          />
                          <View className="flex-1">
                            <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                              {quotations[currentQuoteIndex].providerName}
                            </Text>
                            <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
                              {quotations[currentQuoteIndex].providerType}
                            </Text>
                            {(quotations[currentQuoteIndex] as any).distanceKm && (
                              <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
                                {(quotations[currentQuoteIndex] as any).distanceKm?.toFixed(1)} km away • ~{(quotations[currentQuoteIndex] as any).minutesAway} min
                              </Text>
                            )}
                          </View>
                          <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                            {quotations[currentQuoteIndex].quoteAmount}
                          </Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>

                    {/* Service Breakdown */}
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
                        Service Breakdown
                      </Text>
                      <View className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                        {quotations[currentQuoteIndex].serviceBreakdown.map((item, index) => (
                          <View
                            key={index}
                            className={`flex-row items-center justify-between ${index < quotations[currentQuoteIndex].serviceBreakdown.length - 1 ? 'mb-3 pb-3 border-b border-gray-100' : ''}`}
                          >
                            <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              {item.service}
                            </Text>
                            <Text className="text-sm text-gray-900 ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              {item.price}
                            </Text>
                          </View>
                        ))}
                        <View className="mt-3 pt-3 border-t border-gray-200 flex-row items-center justify-between">
                          <Text className="text-base text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                            Total
                          </Text>
                          <Text className="text-lg text-[#6A9B00]" style={{ fontFamily: 'Poppins-Bold' }}>
                            {quotations[currentQuoteIndex].quoteAmount}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>

                    {/* Payment Terms */}
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
                        Payment Terms
                      </Text>
                      <View className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                        {quotations[currentQuoteIndex].paymentTerms.map((term, index) => (
                          <View key={index} className="flex-row items-start mb-3 last:mb-0">
                            <Ionicons name="checkmark-circle" size={20} color="#6A9B00" style={{ marginRight: 10, marginTop: 2 }} />
                            <Text className="text-sm text-gray-700 flex-1" style={{ fontFamily: 'Poppins-Regular' }}>
                              {term.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Animated.View>

                    {/* Accept Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="bg-black rounded-xl py-4 items-center justify-center mb-4"
                      onPress={async () => {
                        // Handle accept quote - select provider
                        const currentQuote = quotations[currentQuoteIndex] as any;
                        if (currentQuote && currentQuote.providerId) {
                          haptics.success();
                          analytics.track('accept_quote', {
                            job_id: params.requestId,
                            provider_id: currentQuote.providerId
                          });
                          await handleSelectProvider(currentQuote.providerId);
                        }
                      }}
                    >
                      <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                        Accept Quote
                      </Text>
                    </TouchableOpacity>

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
