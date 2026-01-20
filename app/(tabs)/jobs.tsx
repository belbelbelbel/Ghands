import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedModal from '@/components/AnimatedModal';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { serviceRequestService, ServiceRequest } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
const mapRequestToJobItem = (request: ServiceRequest): JobItem => {
  const providerName = request.provider?.name || request.nearbyProviders?.[0]?.name || 'Provider TBD';
  const categoryDisplayName = request.categoryName
    ? request.categoryName.charAt(0).toUpperCase() + request.categoryName.slice(1).replace(/([A-Z])/g, ' $1')
    : 'Service';
  
  return {
    id: request.id,
    requestId: request.id,
    title: request.jobTitle || `${categoryDisplayName} Service`,
    subtitle: request.description || 'Service request',
    status: request.status === 'accepted' || request.status === 'in_progress' ? 'In Progress' : 
            request.status === 'completed' ? 'Completed' :
            request.status === 'cancelled' ? 'Cancelled' : 'Pending',
    name: providerName,
    time: formatDate(request.scheduledDate, request.scheduledTime),
    location: request.location?.formattedAddress || request.location?.address || 'Location not specified',
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
      
      // Map to job items
      const jobItems = requestsArray.map(mapRequestToJobItem);
      setAllJobs(jobItems);
    } catch (error: any) {
      console.error('Error loading requests:', error);
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
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6A9B00" />
            <Text className="text-gray-600 mt-4" style={{ fontFamily: 'Poppins-Medium' }}>
              Loading jobs...
            </Text>
          </View>
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

              <View
                className={`flex flex-row pt-4 ${activeTab === 'Ongoing' ? 'justify-between' : 'justify-center'}`}
              >
                {activeTab === 'Ongoing' && (
                  <TouchableOpacity
                    className="bg-red-50 border border-red-500 py-2 px-5 rounded-lg"
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.warning();
                      setPendingCancelJob(job);
                    }}
                  >
                    <Text className="text-sm text-[#FF2C2C]" style={{ fontFamily: 'Poppins-Medium' }}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className={`py-3 px-6 rounded-lg ${
                    activeTab === 'Ongoing'
                      ? 'bg-gray-100'
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

      <AnimatedModal
        visible={!!pendingCancelJob}
        onClose={() => {
          haptics.light();
          setPendingCancelJob(null);
        }}
        animationType="slide"
      >
        <View className="px-2">
          <Text className="text-lg text-center text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
            Cancel Request?
          </Text>
          <Text className="text-sm text-center text-gray-500 mb-5" style={{ fontFamily: 'Poppins-Regular' }}>
            This action cannot be undone
          </Text>
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#FF2C2C] py-3 rounded-xl items-center justify-center"
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
              <Text className="text-white text-base" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center"
              activeOpacity={0.85}
              onPress={() => {
                haptics.light();
                setPendingCancelJob(null);
              }}
            >
              <Text className="text-base text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
                Go back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </SafeAreaWrapper>
  );
}
