import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { haptics } from '@/hooks/useHaptics';
import { analytics } from '@/services/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TIMELINE_STEPS = [
  {
    id: 'step-1',
    title: 'Job Request Submitted',
    description: 'Request sent to 3 selected providers',
    status: 'Completed - 2 hours ago',
    accent: '#6A9B00',
    dotColor: '#6A9B00',
  },
  {
    id: 'step-2',
    title: 'Inspection & Quotation',
    description: 'Request sent to 3 selected providers',
    status: 'In Progress - 2 of 3 completed',
    accent: '#DBEAFE',
    dotColor: '#F59E0B',
  },
  {
    id: 'step-3',
    title: 'Job in Progress',
    description: 'Provider is on site',
    status: 'In Progress - 2 of 3 completed',
    accent: '#DBEAFE',
    dotColor: '#9CA3AF',
  },
  {
    id: 'step-4',
    title: 'Complete',
    description: 'Review the job and provide feedback!!',
    status: 'In Progress - 2 of 3 completed',
    accent: '#DBEAFE',
    dotColor: '#9CA3AF',
  },
];

const PROVIDERS = [
  {
    id: 'provider-1',
    name: "Mike's Plumbing",
    role: 'Professional Plumber',
    image: require('../assets/images/plumbericon2.png'),
    status: 'Quote submitted',
    statusColor: '#DCFCE7',
    statusTextColor: '#166534',
    badgeColor: '#CFFAFE',
    quote: '$75',
    quoteDetails:
      'Replace kitchen faucet cartridge and check water pressure. Includes parts and labor.',
    duration: '2-3 hours',
    inspectionStatus: 'Inspection completed 1 hour ago',
    cta: 'View full quote',
  },
  {
    id: 'provider-2',
    name: "Mike's Plumbing",
    role: 'Professional Plumber',
    image: require('../assets/images/plumbericon.png'),
    status: 'Inspecting',
    statusColor: '#FEF9C3',
    statusTextColor: '#92400E',
    badgeColor: '#E0F2FE',
    quote: null,
    quoteDetails:
      'Provider is currently on-site conducting inspection. Quote will be available shortly.',
    duration: null,
    inspectionStatus: 'Inspection in progress',
    cta: null,
  },
  {
    id: 'provider-3',
    name: "Mike's Plumbing",
    role: 'Professional Plumber',
    image: require('../assets/images/plumbericon2.png'),
    status: 'Inspecting',
    statusColor: '#FEF9C3',
    statusTextColor: '#92400E',
    badgeColor: '#E0F2FE',
    quote: null,
    quoteDetails:
      'Provider is currently on-site conducting inspection. Quote will be available shortly.',
    duration: null,
    inspectionStatus: 'Inspection in progress',
    cta: null,
  },
];

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
  providerImage: string; // URI or require path
  quoteAmount: string;
  serviceBreakdown: ServiceBreakdownItem[];
  paymentTerms: PaymentTerm[];
}

const QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1',
    providerName: 'AquaFix Solutions',
    providerType: 'Plumbing Specialists',
    providerImage: 'https://i.pravatar.cc/150?img=12',
    quoteAmount: '$65',
    serviceBreakdown: [
      { service: 'Complete faucet assessment', price: 'Free' },
      { service: 'High-quality cartridge & seals', price: '$40' },
      { service: 'Professional installation', price: '$25' },
    ],
    paymentTerms: [
      { text: '50% upfront, 50% on completion' },
      { text: 'All payment methods accepted' },
      { text: '90-day warranty on parts and labor' },
      { text: 'Money-back guarantee' },
    ],
  },
  {
    id: 'quote-2',
    providerName: "Mike's Plumbing",
    providerType: 'Professional Plumber',
    providerImage: 'https://i.pravatar.cc/150?img=47',
    quoteAmount: '$75',
    serviceBreakdown: [
      { service: 'Faucet inspection & diagnosis', price: '$10' },
      { service: 'Premium cartridge replacement', price: '$45' },
      { service: 'Installation & testing', price: '$20' },
    ],
    paymentTerms: [
      { text: 'Full payment on completion' },
      { text: 'Cash, card, or mobile payment' },
      { text: '60-day warranty on all work' },
      { text: 'Satisfaction guaranteed' },
    ],
  },
  {
    id: 'quote-3',
    providerName: 'Elite Plumbing Services',
    providerType: 'Certified Plumbers',
    providerImage: 'https://i.pravatar.cc/150?img=33',
    quoteAmount: '$85',
    serviceBreakdown: [
      { service: 'Comprehensive assessment', price: '$15' },
      { service: 'Premium parts & materials', price: '$50' },
      { service: 'Expert installation service', price: '$20' },
    ],
    paymentTerms: [
      { text: '30% deposit, 70% on completion' },
      { text: 'Multiple payment options' },
      { text: '1-year warranty included' },
      { text: '24/7 support available' },
    ],
  },
];

export default function OngoingJobDetails() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Updates' | 'Quotations'>('Updates');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const quoteCardAnim = useRef(new Animated.Value(1)).current;

  const timelineAnimations = useMemo(
    () => TIMELINE_STEPS.map(() => new Animated.Value(0)),
    []
  );

  const lineAnimations = useMemo(
    () => TIMELINE_STEPS.slice(0, -1).map(() => new Animated.Value(0)),
    []
  );

  const providerAnimations = useMemo(
    () => PROVIDERS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    if (activeTab === 'Quotations') {
      setCurrentQuoteIndex(0);
    }
  }, [activeTab]);

  useEffect(() => {
    quoteCardAnim.setValue(0);
    Animated.timing(quoteCardAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentQuoteIndex, quoteCardAnim]);

  useEffect(() => {
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
  }, [timelineAnimations, lineAnimations, providerAnimations]);

  const renderTimeline = () => (
    <View className="mb-8">
      {TIMELINE_STEPS.map((step, index) => {
        const isLast = index === TIMELINE_STEPS.length - 1;
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

  const renderProviderCard = (provider: typeof PROVIDERS[number], index: number) => {
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
                  providerId: provider.id,
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
                  providerId: provider.id,
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
              <TouchableOpacity activeOpacity={0.85}>
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {activeTab === 'Updates' ? (
            <>
              {renderTimeline()}
              <TouchableOpacity
                disabled
                className="rounded-xl py-4 items-center justify-center bg-gray-200 mb-8"
              >
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
                  Mark as complete
                </Text>
              </TouchableOpacity>
              {PROVIDERS.map((provider, index) => renderProviderCard(provider, index))}
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
                    All quotations received
                  </Text>
                  <Text className="text-xs text-[#0C4A6E]" style={{ fontFamily: 'Poppins-Regular' }}>
                    Review and select your preferred service provider
                  </Text>
                </View>
              </View>

              {QUOTATIONS.length > 0 && (
                <>
                  {/* Quotation Card */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.light();
                      router.push({
                        pathname: '/ProviderDetailScreen',
                        params: {
                          providerId: QUOTATIONS[currentQuoteIndex].id,
                          providerName: QUOTATIONS[currentQuoteIndex].providerName,
                        },
                      });
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
                          source={{ uri: QUOTATIONS[currentQuoteIndex].providerImage }}
                          className="w-14 h-14 rounded-full mr-3"
                        />
                        <View className="flex-1">
                          <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                            {QUOTATIONS[currentQuoteIndex].providerName}
                          </Text>
                          <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Medium' }}>
                            {QUOTATIONS[currentQuoteIndex].providerType}
                          </Text>
                        </View>
                        <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins-Bold' }}>
                          {QUOTATIONS[currentQuoteIndex].quoteAmount}
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
                      {QUOTATIONS[currentQuoteIndex].serviceBreakdown.map((item, index) => (
                        <View
                          key={index}
                          className={`flex-row items-center justify-between ${index < QUOTATIONS[currentQuoteIndex].serviceBreakdown.length - 1 ? 'mb-3 pb-3 border-b border-gray-100' : ''}`}
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
                          {QUOTATIONS[currentQuoteIndex].quoteAmount}
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
                      {QUOTATIONS[currentQuoteIndex].paymentTerms.map((term, index) => (
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
                    onPress={() => {
                      // Handle accept quote - artisan accepted job
                      haptics.success();
                      analytics.track('accept_quote', { job_id: 'ongoing_job' });
                      router.push('/PaymentMethodsScreen' as any);
                    }}
                  >
                    <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                      Accept
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
                      {currentQuoteIndex + 1}/{QUOTATIONS.length}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        if (currentQuoteIndex < QUOTATIONS.length - 1) {
                          haptics.selection();
                          setCurrentQuoteIndex(currentQuoteIndex + 1);
                        }
                      }}
                      disabled={currentQuoteIndex === QUOTATIONS.length - 1}
                      activeOpacity={0.85}
                      className={`flex-row items-center ${currentQuoteIndex === QUOTATIONS.length - 1 ? 'opacity-40' : ''}`}
                    >
                      <Text
                        className="text-sm mr-1"
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          color: currentQuoteIndex === QUOTATIONS.length - 1 ? '#9CA3AF' : '#6A9B00',
                        }}
                      >
                        Next
              </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={currentQuoteIndex === QUOTATIONS.length - 1 ? '#9CA3AF' : '#6A9B00'}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
