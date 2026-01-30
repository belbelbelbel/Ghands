import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, MapPin } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { JobHistoryCardSkeleton } from '@/components/LoadingSkeleton';
import { providerService, ServiceRequest, apiClient, authService } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useFocusEffect } from 'expo-router';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';

type JobStatus = 'Ongoing' | 'Pending' | 'Completed';

interface JobItem {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: JobStatus;
  matchedTime?: string;
  completedTime?: string;
  images: any[];
  requestId?: number;
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
};

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}min. ago`;
    if (diffHours < 24) return `${diffHours}hr. ago`;
    if (diffDays < 7) return `${diffDays}day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  } catch {
    return '';
  }
};

// Map API status to JobStatus
// Behaviour:
// - For ACCEPTED list (isFromAcceptedList = true):
//   - "completed"  -> Completed
//   - anything else (pending / accepted / in_progress) -> Ongoing
//   This means: once provider has accepted, it always lives under Ongoing/Completed.
// - For AVAILABLE list (isFromAcceptedList = false):
//   - "completed"  -> Completed (theoretical)
//   - "accepted"/"in_progress" -> Ongoing
//   - "pending"   -> Pending  (provider has NOT accepted yet)
const mapApiStatusToJobStatus = (apiStatus: string, isFromAcceptedList: boolean = true): JobStatus => {
  const status = apiStatus?.toLowerCase();

  // Completed always wins
  if (status === 'completed') {
    return 'Completed';
  }

  // From accepted list: provider has already accepted, even if backend still says "pending"
  if (isFromAcceptedList) {
    return 'Ongoing';
  }

  // From available list: true Pending vs Ongoing
  switch (status) {
    case 'accepted':
    case 'in_progress':
      return 'Ongoing';
    case 'pending':
    default:
      return 'Pending';
  }
};

// Map ACCEPTED request (provider has already accepted) to JobItem format
const mapAcceptedRequestToJobItem = (request: ServiceRequest): JobItem => {
  const user = request.user || {};
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const clientName = `${firstName} ${lastName}`.trim() || 'Client';
  
  const location = request.location?.formattedAddress || 
                   request.location?.address || 
                   `${request.location?.city || ''}, ${request.location?.state || ''}`.trim() || 
                   'Location not specified';
  
  const scheduledDate = request.scheduledDate ? formatDate(request.scheduledDate) : '';
  const scheduledTime = request.scheduledTime || '';
  
  const status = mapApiStatusToJobStatus(request.status || 'pending', true);
  
  return {
    id: request.id?.toString() || '',
    clientName,
    service: request.jobTitle || request.categoryName || 'Service Request',
    date: scheduledDate,
    time: scheduledTime,
    location,
    status,
    matchedTime: status === 'Pending' ? formatTimeAgo(request.createdAt || '') : undefined,
    completedTime: status === 'Completed' ? formatTimeAgo(request.updatedAt || request.createdAt || '') : undefined,
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
    requestId: request.id,
  };
};

// Map AVAILABLE (not yet accepted by this provider) request to JobItem format
const mapAvailableRequestToJobItem = (request: ServiceRequest): JobItem => {
  const user = request.user || {};
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const clientName = `${firstName} ${lastName}`.trim() || 'Client';
  
  const location = request.location?.formattedAddress || 
                   request.location?.address || 
                   `${request.location?.city || ''}, ${request.location?.state || ''}`.trim() || 
                   'Location not specified';
  
  const scheduledDate = request.scheduledDate ? formatDate(request.scheduledDate) : '';
  const scheduledTime = request.scheduledTime || '';

  // From available list, treat "pending" as Pending (provider not yet accepted)
  const status = mapApiStatusToJobStatus(request.status || 'pending', false);

  return {
    id: request.id?.toString() || '',
    clientName,
    service: request.jobTitle || request.categoryName || 'Service Request',
    date: scheduledDate,
    time: scheduledTime,
    location,
    status,
    matchedTime: status === 'Pending' ? formatTimeAgo(request.createdAt || '') : undefined,
    completedTime: status === 'Completed' ? formatTimeAgo(request.updatedAt || request.createdAt || '') : undefined,
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
    requestId: request.id,
  };
};


export default function ProviderJobsScreen() {
  const router = useRouter();
  const { toast, showError, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<JobStatus>('Ongoing');
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load provider jobs from API:
  // - accepted requests  -> Ongoing / Completed
  // - available requests -> Pending (not yet accepted)
  const loadAcceptedRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [acceptedRaw, availableRaw] = await Promise.all([
        providerService.getAcceptedRequests(),
        providerService.getAvailableRequests(),
      ]);

      const acceptedArray = Array.isArray(acceptedRaw) ? acceptedRaw : [];
      const availableArray = Array.isArray(availableRaw) ? availableRaw : [];

      const acceptedJobs: JobItem[] =
        acceptedArray.length > 0 ? acceptedArray.map((req) => mapAcceptedRequestToJobItem(req)) : [];

      const pendingFromAvailable: JobItem[] =
        availableArray.length > 0 ? availableArray.map((req) => mapAvailableRequestToJobItem(req)) : [];

      // Ensure we don't duplicate any job that exists in accepted list
      const acceptedIds = new Set(acceptedJobs.map((j) => j.requestId?.toString() || j.id));
      const filteredPending = pendingFromAvailable.filter(
        (job) => !acceptedIds.has(job.requestId?.toString() || job.id)
      );

      setAllJobs([...acceptedJobs, ...filteredPending]);
    } catch (error: any) {
      // If AuthError, redirect immediately (silent - no logs, no errors shown)
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      
      // Check if it's a 500 error that might be auth-related
      // For provider endpoints, 500 errors are often auth-related (expired/invalid token)
      const status = error?.status || (error as any)?.response?.status || 500;
      if (status === 500) {
        try {
          const token = await authService.getAuthToken();
          if (!token) {
            // No token = auth error, redirect silently
            await handleAuthErrorRedirect(router);
            return;
          }
          // Even if token exists, 500 on provider protected route usually means expired/invalid token
          // Be aggressive - redirect on any 500 error for provider endpoints
          await handleAuthErrorRedirect(router);
          return;
        } catch (redirectError) {
          // If redirect fails, try again with fallback
          try {
            router.replace('/ProviderSignInScreen' as any);
          } catch {
            // Silent fail
          }
          return;
        }
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
      
      // Don't show errors for auth-related issues (already redirected)
      // Only show error if it's not a 500 (which might be auth-related)
      if (status !== 500) {
        const errorMessage = getSpecificErrorMessage(error, 'get_accepted_requests');
        showError(errorMessage);
      }
      setAllJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAcceptedRequests();
    }, [loadAcceptedRequests])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await loadAcceptedRequests();
    setRefreshing(false);
    haptics.success();
  }, [loadAcceptedRequests]);

  const getJobsForTab = () => {
    // Ensure allJobs is always an array
    const jobsArray = Array.isArray(allJobs) ? allJobs : [];
    
    // Filter by active tab AND explicitly exclude completed jobs from Ongoing tab
    return jobsArray.filter((job) => {
      // If activeTab is 'Ongoing', explicitly exclude 'Completed' jobs
      if (activeTab === 'Ongoing') {
        return job.status === 'Ongoing' && job.status !== 'Completed';
      }
      return job.status === activeTab;
    });
  };

  const renderJobCard = (job: JobItem) => (
    <View
      key={job.id}
      style={{
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        position: 'relative',
      }}
    >
      {(job.matchedTime || job.completedTime) && (
        <Text style={{ ...Fonts.bodyTiny, color: Colors.textTertiary, marginBottom: Spacing.xs + 2 }}>
          {job.completedTime ? `completed ${job.completedTime}` : `matched ${job.matchedTime}`}
        </Text>
      )}

      {job.status === 'Ongoing' && (
        <View
          style={{
            backgroundColor: Colors.successLight,
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: BorderRadius.xl,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: Colors.success }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, paddingRight: 50 }}>
        <Image source={require('../../assets/images/userimg.jpg')} style={{ width: 36, height: 36, borderRadius: 18, marginRight: Spacing.sm + 2 }} resizeMode='cover' />
        <View style={{ flex: 1 }}>
          <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
            {job.clientName}
          </Text>
          <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, marginTop: 2 }}>
            {job.service}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs }}>
        <Calendar size={12} color={Colors.textSecondaryDark} />
        <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: Spacing.xs + 2 }}>
          {job.date} - {job.time}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm + 2 }}>
        <MapPin size={12} color={Colors.textSecondaryDark} />
        <Text style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: Spacing.xs + 2 }}>
          {job.location}
        </Text>
      </View>

      {job.status === 'Ongoing' ? (
        // Ongoing jobs: single primary button to check updates
        <TouchableOpacity
          style={{
            backgroundColor: Colors.black,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: BorderRadius.default,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
          onPress={() => {
            haptics.light();
            
            // Validate requestId before navigating
            const requestId = job.requestId || job.id;
            if (!requestId) {
              showError('Invalid job ID');
              return;
            }
            
            router.push({
              pathname: '/ProviderJobDetailsScreen',
              params: {
                requestId: requestId.toString(),
              },
            } as any);
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white, marginRight: Spacing.xs }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      ) : job.status === 'Pending' ? (
        // Pending jobs: Show "View Details" and "Decline" buttons
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.white,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => {
              haptics.light();
              const requestId = job.requestId || job.id;
              if (!requestId) {
                showError('Invalid job ID');
                return;
              }
              router.push({
                pathname: '/ProviderJobDetailsScreen',
                params: {
                  requestId: requestId.toString(),
                },
              } as any);
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.errorBorder,
              backgroundColor: Colors.errorLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={async () => {
              haptics.warning();
              const requestId = job.requestId || job.id;
              if (!requestId) {
                showError('Invalid job ID');
                return;
              }
              try {
                await providerService.rejectRequest(Number(requestId));
                haptics.success();
                showSuccess('Request declined. The client has been notified.');
                await loadAcceptedRequests();
              } catch (error: any) {
                haptics.error();
                const errorMessage = getSpecificErrorMessage(error, 'reject_request');
                showError(errorMessage);
              }
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.error }}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Completed or any other status: simple "Check Updates" / details button
        <TouchableOpacity
          style={{
            width: '100%',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: BorderRadius.default,
            backgroundColor: Colors.black,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            haptics.light();
            
            const requestId = job.requestId || job.id;
            if (!requestId) {
              showError('Invalid job ID');
              return;
            }
            
            router.push({
              pathname: '/ProviderJobDetailsScreen',
              params: {
                requestId: requestId.toString(),
              },
            } as any);
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white, marginRight: Spacing.xs }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      )}

      <View style={{ position: 'absolute', right: Spacing.md, top: 60 }}>
        <View style={{ flexDirection: 'row', gap: -6 }}>
          {job.images.slice(0, 3).map((imgSource, index) => (
            <Image
              key={index}
              source={imgSource}
              style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.sm,
                marginLeft: index > 0 ? -6 : 0,
                borderWidth: 2,
                borderColor: Colors.white,
                zIndex: 3 - index,
              }}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
          <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, textAlign: 'center' }}>
            Job History
          </Text>
        </View>

        
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: Spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            marginBottom: Spacing.lg,
          }}
        >
          {(['Ongoing', 'Pending', 'Completed'] as JobStatus[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingBottom: Spacing.md,
                alignItems: 'center',
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: activeTab === tab ? Colors.accent : 'transparent',
              }}
            >
              <Text
                style={{
                  ...Fonts.bodyMedium,
                  color: activeTab === tab ? Colors.textPrimary : Colors.textTertiary,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: 100,
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
          {isLoading ? (
            <>
              {[1, 2, 3].map((index) => (
                <JobHistoryCardSkeleton key={index} />
              ))}
            </>
          ) : getJobsForTab().length > 0 ? (
            getJobsForTab().map((job) => renderJobCard(job))
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ ...Fonts.bodyMedium, color: Colors.textTertiary }}>
                No {activeTab.toLowerCase()} jobs yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </SafeAreaWrapper>
  );
}
