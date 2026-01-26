import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { serviceRequestService, ServiceRequest } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, Modal, Pressable, StyleSheet } from 'react-native';
import { JobHistoryCardSkeleton } from '@/components/LoadingSkeleton';
import { Colors } from '@/lib/designSystem';

type JobStatus = 'Ongoing' | 'Completed' | 'Cancelled';

type JobItem = {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  name: string;
  time: string;
  location: string;
  requestId?: number;
  acceptedProvidersCount?: number; // Track if providers have accepted
};

// Helper to format date
const formatDate = (dateString?: string, timeString?: string): string => {
  if (!dateString) return 'Not scheduled';
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    return timeString ? `${formattedDate} • ${timeString}` : formattedDate;
  } catch {
    return dateString;
  }
};

// Map ServiceRequest to JobItem
// Note: This function should be called with acceptedProviders data if available
const mapRequestToJobItem = (request: ServiceRequest, acceptedProvidersCount: number = 0): JobItem => {
  const providerName = request.provider?.name || request.nearbyProviders?.[0]?.name || 'Provider TBD';
  const categoryDisplayName = request.categoryName
    ? request.categoryName.charAt(0).toUpperCase() + request.categoryName.slice(1).replace(/([A-Z])/g, ' $1')
    : 'Service';
  
  // Determine status: If providers have accepted, show "In Progress" even if request status is "pending"
  let status: string;
  if (request.status === 'accepted' || request.status === 'in_progress') {
    status = 'In Progress';
  } else if (request.status === 'completed') {
    status = 'Completed';
  } else if (request.status === 'cancelled') {
    status = 'Cancelled';
  } else if (acceptedProvidersCount > 0) {
    // Providers have accepted, but request status is still "pending" (waiting for client selection)
    status = 'In Progress'; // Show as "In Progress" to indicate providers have accepted
  } else {
    status = 'Pending';
  }
  
  return {
    id: request.id,
    requestId: request.id,
    title: request.jobTitle || `${categoryDisplayName} Service`,
    subtitle: request.description || 'Service request',
    status,
    name: providerName,
    time: formatDate(request.scheduledDate, request.scheduledTime),
    location: request.location?.formattedAddress || request.location?.address || 'Location not specified',
    acceptedProvidersCount, // Include accepted providers count
  };
};

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<JobStatus>('Ongoing');
  const [pendingCancelJob, setPendingCancelJob] = useState<JobItem | null>(null);
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { showError } = useToast();

  // Load user requests from API
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all requests
      const requests = await serviceRequestService.getUserRequests();
      
      // Ensure requests is always an array
      const requestsArray = Array.isArray(requests) ? requests : [];
      
      // Filter out requests that are still in the booking flow (not confirmed yet)
      // Only show requests that have been confirmed/booked AND sent to providers
      const confirmedRequests = requestsArray.filter((request) => {
        // Must have both jobTitle and description
        const hasJobTitle = request.jobTitle && request.jobTitle.trim().length > 0;
        const hasDescription = request.description && request.description.trim().length > 0;
        if (!hasJobTitle || !hasDescription) {
          return false;
        }
        
        // For "pending" status: Only show if booking has been sent to providers
        // A booking is sent to providers when:
        // 1. It has location (request was sent to providers via updateJobDetails)
        // OR it has scheduled date/time (user confirmed booking in DateTimeScreen)
        // This ensures user has completed the booking flow and seen providers
        // but is still waiting for provider response (status is still "pending", not "accepted")
        // Note: When a provider is selected, status changes to "accepted", so if status is "pending",
        // it means no provider has been selected yet
        if (request.status === 'pending') {
          const hasScheduledDateTime = !!(request.scheduledDate && request.scheduledTime);
          const hasLocation = !!(request.location?.latitude && request.location?.longitude);
          const hasLocationText = !!(request.location?.formattedAddress || request.location?.address);
          
          // Show "pending" if booking has been sent to providers (has location OR date/time)
          // This means user has completed the booking flow and confirmed booking
          // Status being "pending" already means no provider has been selected yet
          // (if provider was selected, status would be "accepted")
          return hasScheduledDateTime || hasLocation || hasLocationText;
        }
        
        // Show all other statuses (accepted, in_progress, completed, cancelled) - these are confirmed
        return true;
      });
      
      // Map to job items - Load accepted providers for each request to determine correct status
      const jobItems = await Promise.all(
        confirmedRequests.map(async (request) => {
          // Check if providers have accepted this request
          let acceptedProvidersCount = 0;
          try {
            const acceptedProviders = await serviceRequestService.getAcceptedProviders(request.id);
            acceptedProvidersCount = acceptedProviders?.length || 0;
          } catch (error) {
            // Silently fail - if we can't load accepted providers, use request status
            if (__DEV__) {
              console.log(`Could not load accepted providers for request ${request.id}:`, error);
            }
          }
          
          return mapRequestToJobItem(request, acceptedProvidersCount);
        })
      );
      setAllJobs(jobItems);
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      
      // Check if it's a network error first
      const isNetworkError = error?.isNetworkError || 
                            error?.message?.includes('Network') || 
                            error?.message?.includes('Failed to fetch') ||
                            error?.message?.includes('Network request failed');
      
      if (isNetworkError) {
        showError('No internet connection. Please check your connection and reconnect to continue.');
        setAllJobs([]);
        return;
      }
      
      const errorMessage = getSpecificErrorMessage(error, 'get_requests');
      showError(errorMessage);
      setAllJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await loadRequests();
    setRefreshing(false);
    haptics.success();
  }, [loadRequests]);

  const jobs = useMemo(() => {
    const filtered = allJobs.filter(job => {
      if (activeTab === 'Ongoing') {
        return job.status === 'In Progress' || job.status === 'Pending';
      } else if (activeTab === 'Completed') {
        return job.status === 'Completed';
      } else {
        return job.status === 'Cancelled';
      }
    });
    return filtered;
  }, [activeTab, allJobs]);

  const handlePrimaryAction = (status: JobStatus, job?: JobItem) => {
    haptics.selection();
    if (status === 'Ongoing' && job) {
      // Pass requestId to OngoingJobDetails
      router.push({
        pathname: '/OngoingJobDetails',
        params: {
          requestId: job.id.toString(),
        },
      } as any);
    } else if (status === 'Completed' && job) {
      // Pass requestId to CompletedJobDetail
      router.push({
        pathname: '/CompletedJobDetail',
        params: {
          requestId: job.id.toString(),
        },
      } as any);
    } else {
      router.push('/JobDetailsScreen');
    }
  };

  return (
    <SafeAreaWrapper>
      <View className="flex-1 px-4" style={{ paddingTop: 20 }}>
        <Text className="text-2xl text-black mb-6 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          Jobs
        </Text>

        <View className="flex flex-row justify-around mb-4">
          {(['Ongoing', 'Completed', 'Cancelled'] as JobStatus[]).map((status) => {
            const isActive = activeTab === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(status);
                }}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-base ${isActive ? 'text-black' : 'text-gray-500'}`}
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {status}
                </Text>
                <View
                  className={`mt-2 h-0.5 rounded-full ${isActive ? 'bg-[#6A9B00]' : 'bg-transparent'}`}
                  style={{ width: 68 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && allJobs.length === 0 ? (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {[1, 2, 3].map((index) => (
              <JobHistoryCardSkeleton key={index} />
            ))}
          </ScrollView>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6A9B00" />
            }
          >
            {jobs.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons 
                  name={activeTab === 'Ongoing' ? 'briefcase-outline' : activeTab === 'Completed' ? 'checkmark-circle-outline' : 'close-circle-outline'} 
                  size={64} 
                  color="#9CA3AF" 
                />
                <Text className="text-gray-600 mt-4 text-center" style={{ fontFamily: 'Poppins-Medium' }}>
                  No {activeTab.toLowerCase()} jobs yet
                </Text>
                <Text className="text-gray-500 mt-2 text-center text-sm px-8" style={{ fontFamily: 'Poppins-Regular' }}>
                  {activeTab === 'Ongoing' 
                    ? 'Your ongoing service requests will appear here.'
                    : activeTab === 'Completed'
                    ? 'Completed jobs will appear here once finished.'
                    : 'Cancelled requests will appear here.'}
                </Text>
              </View>
            ) : (
              jobs.map((job) => (
            <View
              key={`${activeTab}-${job.id}`}
              className="border border-gray-200 mb-6 px-5 py-5 rounded-2xl shadow-[0px_6px_18px_rgba(15,23,42,0.04)]"
            >
              <View className="flex-row justify-between mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-lg text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                    {job.title}
                  </Text>
                  <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                    {job.subtitle}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <AnimatedStatusChip
                    status={job.status}
                    statusColor={
                      activeTab === 'Ongoing'
                        ? '#FEF9C3'
                        : activeTab === 'Completed'
                          ? '#DCFCE7'
                          : '#F3F4F6'
                    }
                    textColor={
                      activeTab === 'Ongoing'
                        ? '#92400E'
                        : activeTab === 'Completed'
                          ? '#166534'
                          : '#6B7280'
                    }
                    size="small"
                    animated={true}
                  />
                  {/* Cancel Request button in header - only show if no providers accepted */}
                  {activeTab === 'Ongoing' && job.acceptedProvidersCount === 0 && (
                    <TouchableOpacity
                      className="bg-red-50 border border-red-500 py-1.5 px-3 rounded-lg"
                      activeOpacity={0.85}
                      onPress={() => {
                        haptics.warning();
                        setPendingCancelJob(job);
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color="#FF2C2C" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="person-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.time}
                </Text>
              </View>
              <View className="flex-row items-center gap-3 mt-2">
                <Ionicons name="location-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                  {job.location}
                </Text>
              </View>

              <View className="flex flex-row pt-4 justify-center">
                <TouchableOpacity
                  className={`py-3 px-6 rounded-lg ${
                    activeTab === 'Ongoing'
                      ? 'bg-gray-100 w-full'
                      : activeTab === 'Completed'
                        ? 'bg-[#6A9B00] w-full'
                        : 'bg-black w-full'
                  }`}
                  activeOpacity={0.85}
                  onPress={() => handlePrimaryAction(activeTab, job)}
                >
                  <Text
                    className={`text-sm  text-center ${
                      activeTab === 'Ongoing' ? 'text-black' : 'text-white '
                    }`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {activeTab === 'Ongoing'
                      ? 'Check Updates'
                      : activeTab === 'Completed'
                        ? 'View Details'
                        : 'Rebook Service'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Cancel Request Modal - Centered Box */}
      <Modal
        visible={!!pendingCancelJob}
        transparent
        animationType="fade"
        onRequestClose={() => {
          haptics.light();
          setPendingCancelJob(null);
        }}
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
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              haptics.light();
              setPendingCancelJob(null);
            }}
          />
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Cancel Request?
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              This action cannot be undone
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#FF2C2C',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.85}
                onPress={async () => {
                  const job = pendingCancelJob;
                  haptics.error();
                  setPendingCancelJob(null);
                  if (job && job.requestId) {
                    try {
                      await serviceRequestService.cancelRequest(job.requestId);
                      haptics.success();
                      // Reload requests
                      await loadRequests();
                      router.push('/CancelRequestScreen' as any);
                    } catch (error: any) {
                      const errorMessage = getSpecificErrorMessage(error, 'cancel_request');
                      showError(errorMessage);
                    }
                  }
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Colors.backgroundGray,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.85}
                onPress={() => {
                  haptics.light();
                  setPendingCancelJob(null);
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Go back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
