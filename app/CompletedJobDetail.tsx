import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import Demcatorline from "@/components/Demacator";
import HeaderComponent from "@/components/HeaderComponent";
import { haptics } from '@/hooks/useHaptics';
import { serviceRequestService, ServiceRequest } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, TextInput, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '@/services/analytics';
import { CheckCircle2, FileText, Wrench, CheckCircle } from 'lucide-react-native';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { formatTimeAgo } from '@/utils/dateFormatting';

const reviewSubmittedStorageKey = (requestId: number) =>
  `@ghands:review_submitted_${requestId}`;

// Helper to format date
const formatDate = (dateString?: string, timeString?: string): string => {
  if (!dateString) return 'Not scheduled';
  try {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    return timeString ? `${formattedDate} - ${timeString}` : formattedDate;
  } catch {
    return dateString;
  }
};

export default function CompletedJobDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { showError, showSuccess } = useToast();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [postReviewThankYou, setPostReviewThankYou] = useState(false);

  const providerAvatarUri = useMemo(() => {
    if (!selectedProvider) return null;
    const p = selectedProvider as Record<string, unknown>;
    const candidates = [p.avatar, p.profileImage, p.photoUrl, p.image];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim().length > 0 && /^https?:\/\//i.test(c)) {
        return c.trim();
      }
    }
    return null;
  }, [selectedProvider]);

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
      const requestDetails = await serviceRequestService.getRequestDetails(requestId);
      setRequest(requestDetails);

      const alreadySubmitted =
        (await AsyncStorage.getItem(reviewSubmittedStorageKey(requestId))) ===
        '1';
      setHasSubmittedReview(alreadySubmitted);
      if (requestDetails.status === 'completed' && !alreadySubmitted) {
        setPostReviewThankYou(false);
        setShowRatingModal(true);
      } else {
        setShowRatingModal(false);
        setPostReviewThankYou(false);
      }
      
      // If request has an accepted provider, load provider details
      if (requestDetails.provider) {
        setSelectedProvider(requestDetails.provider);
      } else {
        // Try to get provider from accepted providers if status is completed
        try {
          const acceptedProviders = await serviceRequestService.getAcceptedProviders(requestId);
          if (acceptedProviders && acceptedProviders.length > 0) {
            // Get the first provider (should be the selected one for completed jobs)
            setSelectedProvider(acceptedProviders[0].provider);
          }
        } catch {
          // If no providers found, that's okay
        }
      }
      
      // Trigger success haptic for completed job
      haptics.success();
    } catch (error: any) {
      const errorMessage = getSpecificErrorMessage(error, 'get_request_details');
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!params.requestId) return;
    if (!rating || rating < 1) {
      showError('Please select a star rating (1-5).');
      return;
    }
    if (hasSubmittedReview) return;

    const requestId = parseInt(params.requestId, 10);
    if (isNaN(requestId)) return;

    setIsSubmittingReview(true);
    try {
      const payload = {
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
      };

      await serviceRequestService.reviewProvider(requestId, payload);
      await AsyncStorage.setItem(reviewSubmittedStorageKey(requestId), '1');
      setHasSubmittedReview(true);
      setPostReviewThankYou(true);
      showSuccess('Thank you for your review!');
      analytics.track('submit_provider_review', { job_id: requestId, rating });
    } catch (e: any) {
      const msg = getSpecificErrorMessage(e, 'review_provider') ?? e?.message ?? 'Failed to submit review.';
      showError(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Generate timeline from request data
  const timelineSteps = useMemo(() => {
    if (!request) return [];
    
    return [
      {
        id: 'step-1',
        title: 'Job Request Submitted',
        description: 'Request was created',
        status: `Completed - ${formatTimeAgo(request.createdAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        icon: CheckCircle2,
      },
      {
        id: 'step-2',
        title: 'Inspection & Quotation',
        description: 'Provider inspected and submitted quotation',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        icon: FileText,
      },
      {
        id: 'step-3',
        title: 'Job in Progress',
        description: 'Provider completed the work',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        icon: Wrench,
      },
      {
        id: 'step-4',
        title: 'Complete',
        description: 'Job completed successfully',
        status: `Completed - ${formatTimeAgo(request.updatedAt || new Date().toISOString())}`,
        accent: '#DCFCE7',
        dotColor: '#6A9B00',
        icon: CheckCircle,
      },
    ];
  }, [request]);

  // Generate booked date info from request data
  const bookedDate = useMemo(() => {
    if (!request) return [];
    
    return [
      {
        name: "Scheduled Date",
        subtitle: formatDate(request.scheduledDate, request.scheduledTime),
        icon: <Ionicons name="calendar" color={'#9CA3AF'} size={18}/>
      },
      {
        name: "Location",
        subtitle: request.location?.formattedAddress || request.location?.address || 'Location not specified',
        icon: <Ionicons name="location" color={'#9CA3AF'} size={18}/>
      },
      {
        name: 'Total Cost',
        subtitle: request.totalCost || '$0.00', // Might need backend support
        icon: <Ionicons name="cash" color={'#9CA3AF'} size={18}/>
      }
    ];
  }, [request]);

  const timelineAnimations = useMemo(
    () => timelineSteps.map(() => new Animated.Value(0)),
    [timelineSteps]
  );

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
  }, [timelineSteps, timelineAnimations]);

  const iconStack = [
    {
      id: 1,
      icons: <Ionicons name="call" size={14} color={'white'} />
    },
    {
      id: 2,
      icons: <Ionicons name="chatbubble" size={14} color={'white'} />
    }
  ];

  const renderTimeline = () => {
    if (timelineSteps.length === 0) return null;
    
    return (
      <View className="mb-8">
        {timelineSteps.map((step, index) => {
          const isLast = index === timelineSteps.length - 1;
          const animation = timelineAnimations[index];

        const IconComponent = step.icon || CheckCircle2;
        
        return (
          <View key={step.id} className="flex-row mb-3">
            <View className="items-center mr-4">
              <Animated.View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: step.dotColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: animation,
                  shadowColor: step.dotColor,
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <IconComponent size={14} color={Colors.white} />
              </Animated.View>
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: '#6A9B00',
                    marginTop: 6,
                    borderRadius: 1,
                    minHeight: 36,
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
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              <Text className="text-sm text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                {step.title}
              </Text>
              <Text className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Regular' }}>
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

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#6A9B00" />
          <Text className="text-gray-600 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>
            Loading job details...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!request) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center py-20 px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
            Unable to load job details. Please try again.
          </Text>
          <TouchableOpacity
            onPress={loadRequestDetails}
            className="mt-6 px-6 py-3 bg-[#6A9B00] rounded-xl"
            activeOpacity={0.85}
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-5" style={{ paddingTop: 20 }}>
            <View className="mb-6">
              <HeaderComponent name="Job details" onPress={router.back} />
            </View>
            <View className="mb-6">
              <Text
                className="text-xl mb-4"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                }}
              >
                Service Provider
              </Text>
              <TouchableOpacity
                className="flex flex-row items-center justify-between px-5 py-5 bg-white rounded-2xl border border-gray-100"
                activeOpacity={0.7}
                onPress={() => {
                  if (selectedProvider) {
                    haptics.selection();
                    router.push({
                      pathname: '/ProviderDetailScreen',
                      params: {
                        providerName: selectedProvider.name || 'Provider',
                        providerId: selectedProvider.id?.toString() || '',
                      },
                    } as any);
                  }
                }}
              >
                <View className="flex flex-row items-center gap-5">
                  <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      source={
                        providerAvatarUri
                          ? { uri: providerAvatarUri }
                          : require('../assets/images/plumbericon.png')
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View>
                    <Text
                      className="text-base mb-1"
                      style={{
                        fontFamily: 'Poppins-Bold',
                      }}
                    >
                      {selectedProvider?.name || 'Provider TBD'}
                    </Text>
                    <View className="flex flex-row gap-2 items-center">
                      <View className="flex-row">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const r = Number((selectedProvider as any)?.rating ?? 0);
                          const filled = i < Math.round(r);
                          return (
                            <Ionicons
                              key={i}
                              name={filled ? 'star' : 'star-outline'}
                              size={14}
                              color={filled ? '#FACC15' : '#E5E7EB'}
                            />
                          );
                        })}
                      </View>
                      <Text
                        className="text-sm text-gray-600"
                        style={{
                          fontFamily: 'Poppins-Regular',
                        }}
                      >
                        {(selectedProvider as any)?.rating != null || (selectedProvider as any)?.totalReviews != null
                          ? `${Number((selectedProvider as any)?.rating ?? 0).toFixed(1)} (${Number((selectedProvider as any)?.totalReviews ?? 0)} reviews)`
                          : 'No ratings yet'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex flex-row gap-2">
                  {iconStack.map((icons) => (
                    <TouchableOpacity
                      className="p-3 rounded-xl bg-[#6A9B00]"
                      key={icons.id}
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (icons.id === 2 && selectedProvider) {
                          // Chat icon - navigate to chat
                          router.push({
                            pathname: '/ChatScreen',
                            params: {
                              providerName: selectedProvider.name || 'Provider',
                              providerId: selectedProvider.id?.toString() || '',
                              requestId: params.requestId,
                            },
                          } as any);
                        }
                        // Handle call action for id === 1
                      }}
                    >
                      <View>{icons.icons}</View>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </View>
            <Demcatorline />
            <View className="mt-8 mb-8 px-1">
              <Text
                className="text-xl mb-5"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                }}
              >
                Job Description
              </Text>
              <Text
                className="text-sm text-[#4B5563] leading-6"
                style={{
                  fontFamily: 'Poppins-Regular',
                }}
              >
                {request.description || request.jobTitle || 'No description provided'}
              </Text>
            </View>
            <Demcatorline />
            <View className="mt-6 mb-8">
              {bookedDate.map((items, index) => (
                <View key={index} className="flex mb-4 flex-row gap-4 items-start">
                  <View className="mt-1">{items.icon}</View>
                  <View className="flex-1">
                    <Text
                      className="text-sm text-gray-500 mb-1"
                      style={{
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      {items.name}
                    </Text>
                    <Text
                      className="text-base text-black"
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                      }}
                    >
                      {items.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                className="flex gap-3 flex-row mt-4 py-4 rounded-xl items-center justify-center bg-[#6A9B00]"
                activeOpacity={0.85}
                onPress={() => {
                  haptics.selection();
                  analytics.track('view_receipt', { job_id: 'completed_job' });
                  router.push('/PaymentHistoryScreen' as any);
                }}
              >
                <Text
                  className="text-white text-base"
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                  }}
                >
                  View receipt
                </Text>
                <Ionicons size={18} name="arrow-forward" color="white" />
              </TouchableOpacity>
            </View>

            
            <View className="mb-8">
              {renderTimeline()}
            </View>

            {hasSubmittedReview && !showRatingModal && (
              <View
                style={{
                  backgroundColor: '#ECFDF5',
                  borderRadius: BorderRadius.default,
                  padding: 14,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: '#166534',
                  }}
                >
                  You’ve rated this job — thank you!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={
            request.status === 'completed' &&
            showRatingModal &&
            (!hasSubmittedReview || postReviewThankYou)
          }
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.45)',
                justifyContent: 'center',
                paddingHorizontal: 20,
              }}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.xl,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  maxWidth: 400,
                  width: '100%',
                  alignSelf: 'center',
                  maxHeight: '82%',
                }}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                >
              {postReviewThankYou ? (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name="checkmark-circle" size={52} color={Colors.accent} />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    Thanks for rating
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      textAlign: 'center',
                      marginBottom: 22,
                      lineHeight: 20,
                    }}
                  >
                    Your feedback helps everyone. When you’re ready, head back to your jobs for the next booking.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowRatingModal(false);
                      setPostReviewThankYou(false);
                      router.replace('/(tabs)/jobs' as any);
                    }}
                    style={{
                      backgroundColor: Colors.accent,
                      borderRadius: BorderRadius.default,
                      paddingVertical: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                        fontSize: 15,
                      }}
                    >
                      Continue to jobs
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      textAlign: 'center',
                      marginBottom: 6,
                    }}
                  >
                    Rate your provider
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      textAlign: 'center',
                      marginBottom: 18,
                      lineHeight: 18,
                    }}
                  >
                    Tap stars (1–5), add an optional note, then submit to finish this booking.
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const filled = starValue <= rating;
                      return (
                        <TouchableOpacity
                          key={starValue}
                          onPress={() => {
                            haptics.selection();
                            setRating(starValue);
                          }}
                          activeOpacity={0.85}
                          style={{ padding: 8 }}
                        >
                          <Ionicons
                            name={filled ? 'star' : 'star-outline'}
                            size={28}
                            color={filled ? '#FACC15' : '#CBD5E1'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 14,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 14,
                    }}
                  >
                    {rating > 0 ? `${rating} / 5` : 'Select a rating'}
                  </Text>

                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Write a comment (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: BorderRadius.default,
                      padding: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textPrimary,
                      backgroundColor: Colors.backgroundGray,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSubmittingReview || rating < 1}
                    onPress={handleSubmitReview}
                    style={{
                      backgroundColor:
                        rating < 1 ? Colors.backgroundGray : Colors.accent,
                      borderRadius: BorderRadius.default,
                      paddingVertical: 14,
                      alignItems: 'center',
                      marginTop: 16,
                    }}
                  >
                    {isSubmittingReview ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          color: rating < 1 ? Colors.textSecondaryDark : Colors.white,
                          fontSize: 15,
                        }}
                      >
                        Submit rating
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
    </SafeAreaWrapper>
  );
}