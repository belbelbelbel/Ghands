import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, useTabScrollContentPaddingTop } from '@/lib/designSystem';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import {
  providerDeclineButton,
  providerHomeActionButton,
  providerHomeActionLabel,
  providerListCard,
  providerUnderlineTabItem,
  providerUnderlineTabLabel,
  providerUnderlineTabRow,
} from '@/lib/providerSurfaceStyles';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, MapPin } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { JobHistoryCardSkeleton } from '@/components/LoadingSkeleton';
import { JobsTabEmptyState } from '@/components/JobsTabEmptyState';
import { useSkeletonGate } from '@/hooks/useSkeletonGate';
import { providerService, ServiceRequest } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { formatTimeAgo as formatTimeAgoUtil } from '@/utils/dateFormatting';

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

const formatTimeAgoSafe = (value?: string | null): string => {
  return value ? formatTimeAgoUtil(value) : '';
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
    case 'inspecting':
    case 'scheduled':
    case 'quoting':
    case 'reviewing':
      return 'Ongoing';
    case 'pending':
    default:
      return 'Pending';
  }
};

// Map ACCEPTED request (provider has already accepted) to JobItem format
const mapAcceptedRequestToJobItem = (request: ServiceRequest): JobItem => {
  const user = request.user;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
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
    matchedTime: status === 'Pending' ? formatTimeAgoSafe(request.createdAt as any) : undefined,
    completedTime: status === 'Completed' ? formatTimeAgoSafe(request.updatedAt || request.createdAt) : undefined,
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
  const user = request.user;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
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
    matchedTime: status === 'Pending' ? formatTimeAgoSafe(request.createdAt as any) : undefined,
    completedTime: status === 'Completed' ? formatTimeAgoSafe(request.updatedAt || request.createdAt) : undefined,
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
    requestId: request.id,
  };
};


const REJECTED_IDS_KEY = '@ghands:provider_rejected_request_ids';

export default function ProviderJobsScreen() {
  const router = useRouter();
  const tabScrollTop = useTabScrollContentPaddingTop(16);
  const { toast, showError, hideToast, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<JobStatus>('Ongoing');
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const addRejectedRequestId = useCallback(async (requestId: number) => {
    const id = String(requestId);
    try {
      const stored = await AsyncStorage.getItem(REJECTED_IDS_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        await AsyncStorage.setItem(REJECTED_IDS_KEY, JSON.stringify(ids));
      }
    } catch {
      // ignore
    }
  }, []);

  const getRejectedRequestIds = useCallback(async (): Promise<Set<string>> => {
    try {
      const stored = await AsyncStorage.getItem(REJECTED_IDS_KEY);
      const ids = (stored ? JSON.parse(stored) : []) as string[];
      return new Set(ids);
    } catch {
      return new Set();
    }
  }, []);

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

      const rejectedIds = await getRejectedRequestIds();

      // Ensure we don't duplicate any job that exists in accepted list AND filter out rejected
      const acceptedIds = new Set(acceptedJobs.map((j) => j.requestId?.toString() || j.id));
      const filteredPending = pendingFromAvailable.filter((job) => {
        const rid = job.requestId?.toString() || job.id;
        if (rejectedIds.has(rid)) return false;
        return !acceptedIds.has(rid);
      });

      setAllJobs([...acceptedJobs, ...filteredPending]);
    } catch (error: any) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }

      const status = error?.status ?? (error as any)?.response?.status;
      const isNetworkError =
        error?.isNetworkError ||
        error?.message?.includes('Network') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('Network request failed');

      if (isNetworkError) {
        showError('No internet connection. Please check your connection and reconnect to continue.');
        setAllJobs([]);
        return;
      }

      if (status === 401 || status === 403) {
        await handleAuthErrorRedirect(router);
        return;
      }

      const errorMessage =
        getSpecificErrorMessage(error, 'get_accepted_requests') ||
        'Could not load your jobs. Pull down to refresh.';
      showError(errorMessage);
      setAllJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError, getRejectedRequestIds]);

  const jobsReadyRef = useRef(false);
  const rejectingRequestIdRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!jobsReadyRef.current) {
        loadAcceptedRequests().finally(() => {
          jobsReadyRef.current = true;
        });
      }
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

  const tabJobs = useMemo(() => {
    const jobsArray = Array.isArray(allJobs) ? allJobs : [];
    return jobsArray.filter((job) => {
      if (activeTab === 'Ongoing') {
        return job.status === 'Ongoing';
      }
      return job.status === activeTab;
    });
  }, [activeTab, allJobs]);

  const { showSkeleton: showJobsSkeleton, isLoadingEmpty: isJobsLoadingEmpty } =
    useSkeletonGate(isLoading, tabJobs.length === 0);

  const renderJobCard = (job: JobItem) => (
    <View
      key={job.id}
      style={{
        ...providerListCard,
        marginBottom: 12,
        position: 'relative',
      }}
    >
      {(job.matchedTime || job.completedTime) && (
        <Text style={{ ...Fonts.bodyTiny, color: Colors.textTertiary, marginBottom: 4 }}>
          {job.completedTime ? `completed ${job.completedTime}` : `matched ${job.matchedTime}`}
        </Text>
      )}

      {job.status === 'Ongoing' && (
        <View
          style={{
            backgroundColor: Colors.successLight,
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: BorderRadius.full,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Poppins-SemiBold', color: Colors.success }}>In Progress</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 50 }}>
        <Image source={require('../../assets/images/userimg.jpg')} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} resizeMode='cover' />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
            {job.clientName}
          </Text>
          <Text numberOfLines={1} style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, marginTop: 1 }}>
            {job.service}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Calendar size={11} color={Colors.textTertiary} />
        <Text numberOfLines={1} style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: 5, flex: 1 }}>
          {job.date} · {job.time}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <MapPin size={11} color={Colors.textTertiary} />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ ...Fonts.bodySmall, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium', marginLeft: 5, flex: 1 }}
        >
          {job.location}
        </Text>
      </View>

      {job.status === 'Ongoing' ? (
        // Ongoing jobs: single primary button to check updates
        <TouchableOpacity
          style={{
            ...providerHomeActionButton,
            width: '100%',
            paddingVertical: 8,
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
          <Text style={{ ...providerHomeActionLabel, marginRight: 4 }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      ) : job.status === 'Pending' ? (
        // Pending jobs: Show "View Details" and "Decline" buttons
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            style={{
              ...providerHomeActionButton,
              width: '100%',
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
            <Text style={providerHomeActionLabel}>
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...providerDeclineButton,
              width: '100%',
            }}
            onPress={async () => {
              haptics.warning();
              const requestId = job.requestId || job.id;
              if (!requestId) {
                showError('Invalid job ID');
                return;
              }
              const rid = Number(requestId);
              if (rejectingRequestIdRef.current === rid) return;

              rejectingRequestIdRef.current = rid;
              try {
                await providerService.rejectRequest(rid);
                await addRejectedRequestId(rid);
                haptics.success();
                showSuccess('Request declined. The client has been notified.');
                setAllJobs((prev) => prev.filter((j) => String(j.requestId ?? j.id) !== String(requestId)));
              } catch (error: any) {
                rejectingRequestIdRef.current = null;
                haptics.error();
                showError(getSpecificErrorMessage(error, 'reject_request'));
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
            ...providerHomeActionButton,
            width: '100%',
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
          <Text style={{ ...providerHomeActionLabel, marginRight: 4 }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}

      <View style={{ position: 'absolute', right: 12, top: 60 }}>
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
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight} tabletShellTop>
      <View style={{ flex: 1 }}>
        
        <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER, paddingTop: tabScrollTop, paddingBottom: 12 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, textAlign: 'center' }}>
            Job History
          </Text>
        </View>

        <View
          style={{
            ...providerUnderlineTabRow,
            paddingHorizontal: PROVIDER_TAB_GUTTER,
            marginBottom: 16,
          }}
        >
          {(['Ongoing', 'Pending', 'Completed'] as JobStatus[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={providerUnderlineTabItem(activeTab === tab)}
            >
              <Text style={providerUnderlineTabLabel(activeTab === tab)}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            tabJobs.length === 0
              ? {
                  flexGrow: 1,
                  justifyContent: 'center',
                  paddingHorizontal: PROVIDER_TAB_GUTTER,
                  paddingBottom: 100,
                }
              : {
                  paddingHorizontal: PROVIDER_TAB_GUTTER,
                  paddingBottom: 100,
                }
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
        >
          {showJobsSkeleton || isJobsLoadingEmpty ? (
            <>
              {[1, 2, 3].map((index) => (
                <JobHistoryCardSkeleton key={`${activeTab}-skel-${index}`} />
              ))}
            </>
          ) : tabJobs.length > 0 ? (
            tabJobs.map((job) => renderJobCard(job))
          ) : (
            <JobsTabEmptyState audience="provider" activeTab={activeTab} />
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
