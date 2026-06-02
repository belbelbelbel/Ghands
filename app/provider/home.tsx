import JobAcceptedModal from '@/components/JobAcceptedModal';
import {
  ProviderJobListSkeleton,
  SageAmountSkeleton,
} from '@/components/LoadingSkeleton';
import { useProviderMonthlyEarnings } from '@/hooks/useProviderMonthlyEarnings';
import { useSkeletonGate } from '@/hooks/useSkeletonGate';
import LocationSearchModal from '@/components/LocationSearchModal';
import NoInternetScreen from '@/components/NoInternetScreen';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { useTokenGuard } from '@/hooks/useTokenGuard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { SageHeroPanel } from '@/components/provider/SageHeroPanel';
import ProviderProceedModal, { ProviderProceedType } from '@/components/provider/ProviderProceedModal';
import { BorderRadius, Colors, useTabScrollContentPaddingTop, useSageHeroPanelMetrics } from '@/lib/designSystem';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import { AvailableRequest, ServiceRequest, authService, providerService, serviceRequestService } from '@/services/api';
import { logDevAuthTokens } from '@/utils/devAuthTokens';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { AuthError } from '@/utils/errors';
import { isConnectivityError } from '@/utils/networkErrors';
import { calculateDistance, estimateTravelTime } from '@/utils/navigationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { shareReferral } from '@/utils/referral';
import { ArrowRight, Bell, Calendar, ChevronDown, MapPin, Plus, Send, Shield, TrendingDown, TrendingUp, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatTimeAgo as formatTimeAgoUtil } from '@/utils/dateFormatting';

import { providerHomeActionButton, providerHomeActionLabel, providerHomeSectionTitle, providerHomeSurface, providerHomeSurfacePadding } from '@/lib/providerSurfaceStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH < 375 ? 0.85 : SCREEN_WIDTH < 414 ? 0.92 : 1.0;

// Helper to format amounts in Nigerian Naira
const formatNaira = (amount: number | null | undefined): string => {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface JobCard {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: 'in-progress' | 'pending' | 'completed' | 'reviewing';
  matchedTime?: string;
  images: any[];
  requestId?: number;
  distanceKm?: number;
  minutesAway?: number;
  sortAt?: number;
}

const providerHomeStatusTheme: Record<
  JobCard['status'],
  { label: string; bg: string; text: string }
> = {
  'in-progress': { label: 'In Progress', bg: Colors.successLight, text: Colors.success },
  pending: { label: 'Pending', bg: '#FFF4E0', text: '#9E6B1F' },
  completed: { label: 'Completed', bg: 'rgba(79, 103, 57, 0.14)', text: '#2A3B1F' },
  reviewing: { label: 'Reviewing', bg: '#E4ECFF', text: '#2750B8' },
};

const resolveProviderHomeJobStatus = (
  request: AvailableRequest | ServiceRequest,
  isActive: boolean,
): JobCard['status'] => {
  const apiStatus = ((request as any).status ?? '').toString().toLowerCase();
  if (apiStatus === 'completed') return 'completed';
  if (apiStatus === 'reviewing') return 'reviewing';
  if (!isActive) return 'pending';
  return 'in-progress';
};

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

// Map API request to JobCard format
const mapRequestToJobCard = (request: AvailableRequest | ServiceRequest, isActive: boolean = false): JobCard => {
  const user = (request as any).user || {};
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const clientName = `${firstName} ${lastName}`.trim() || 'Client';
  
  const location = request.location?.formattedAddress || 
                   request.location?.address || 
                   `${request.location?.city || ''}, ${request.location?.state || ''}`.trim() || 
                   'Location not specified';
  
  const scheduledDate = request.scheduledDate ? formatDate(request.scheduledDate) : '';
  const scheduledTime = request.scheduledTime || '';
  const date = scheduledDate;
  const time = scheduledTime;
  
  return {
    id: request.id?.toString() || '',
    clientName,
    service: request.jobTitle || request.categoryName || 'Service Request',
    date,
    time,
    location,
    status: resolveProviderHomeJobStatus(request, isActive),
    matchedTime: isActive ? undefined : formatTimeAgoSafe(request.createdAt as any),
    sortAt: new Date((request as any).updatedAt || request.createdAt || 0).getTime(),
    images: [
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
      require('../../assets/images/jobcardimg.png'),
    ],
    requestId: request.id,
    distanceKm: (request as AvailableRequest).distanceKm,
    minutesAway: (request as AvailableRequest).minutesAway,
  };
};

export default function ProviderHomeScreen() {
  const router = useRouter();
  useTokenGuard();
  const { location, refreshLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const tabScrollTop = useTabScrollContentPaddingTop(17);
  const { amountFontSize: earningsAmountFontSize, paddingV: earningsPanelPaddingV } = useSageHeroPanelMetrics();
  const [isOnline, setIsOnline] = useState(true);
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingJobs, setPendingJobs] = useState<JobCard[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobCard[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingActive, setIsLoadingActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    thisMonth: monthlyEarnings,
    trendLabel: earningsVsLastMonthLabel,
    trend: earningsVsLastMonthTrend,
    isLoading: isLoadingEarnings,
    refresh: refreshMonthlyEarnings,
  } = useProviderMonthlyEarnings({ refreshOnFocus: true });
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [providerName, setProviderName] = useState<string>('Guest');
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const activeJobsRef = useRef<JobCard[]>([]);
  const [proceedJob, setProceedJob] = useState<JobCard | null>(null);
  const [proceedingType, setProceedingType] = useState<ProviderProceedType | null>(null);
  const [acceptedJobModal, setAcceptedJobModal] = useState<{
    visible: boolean;
    jobLocation: { address: string; city?: string; latitude: number; longitude: number };
    distanceKm?: number;
    travelTimeMinutes?: number;
    requestId?: number;
  }>({
    visible: false,
    jobLocation: { address: '', latitude: 0, longitude: 0 },
  });
  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const rejectedRequestIdsRef = useRef<Set<string>>(new Set());
  const initialJobsLoadDoneRef = useRef(false);
  const rejectingRequestIdRef = useRef<number | null>(null);

  useEffect(() => {
    void logDevAuthTokens('ProviderHome');
  }, []);

  const addRejectedRequestId = useCallback(async (requestId: number) => {
    const id = String(requestId);
    rejectedRequestIdsRef.current.add(id);
    try {
      const stored = await AsyncStorage.getItem('@ghands:provider_rejected_request_ids');
      const ids = stored ? JSON.parse(stored) : [];
      if (!ids.includes(id)) {
        ids.push(id);
        await AsyncStorage.setItem('@ghands:provider_rejected_request_ids', JSON.stringify(ids));
      }
    } catch {
      // ignore
    }
  }, []);

  const getRejectedRequestIds = useCallback(async (): Promise<Set<string>> => {
    try {
      const stored = await AsyncStorage.getItem('@ghands:provider_rejected_request_ids');
      const ids = (stored ? JSON.parse(stored) : []) as string[];
      const set = new Set(ids);
      rejectedRequestIdsRef.current = set;
      return set;
    } catch {
      return rejectedRequestIdsRef.current;
    }
  }, []);

  // Load provider/company name
  const loadProviderName = useCallback(async () => {
    try {
      const companyName = await AsyncStorage.getItem('@ghands:company_name');
      if (companyName) {
        setProviderName(companyName);
        return;
      }

      // If no company name, try to get provider name from API
      const providerId = await authService.getCompanyId(); // Use getCompanyId() for providers
      if (providerId) {
        try {
          const provider = await providerService.getProvider(providerId);
          if (provider?.name) {
            setProviderName(provider.name);
            // Also save to AsyncStorage for future use
            await AsyncStorage.setItem('@ghands:company_name', provider.name);
            return;
          }
        } catch (error) {
          // Silently fail - will try other sources
        }
      }

      // If still no name, check business name from profile setup
      const businessName = await AsyncStorage.getItem('@ghands:business_name');
      if (businessName) {
        setProviderName(businessName);
        return;
      }

      // Default to "Guest" if no name found
      setProviderName('Guest');
    } catch (error) {
      if (__DEV__) {
        // Silent error handling - no logs
      }
      setProviderName('Guest');
    }
  }, []);

  // Load provider location for distance calculations
  const loadProviderLocation = useCallback(async () => {
    try {
      const providerId = await authService.getCompanyId();
      if (providerId) {
        const provider = await providerService.getProvider(providerId);
        if (provider?.latitude && provider?.longitude) {
          setProviderLocation({
            latitude: provider.latitude,
            longitude: provider.longitude,
          });
        }
      }
    } catch (error) {
      // Silently fail - distance calculations will be skipped
    }
  }, []);

  // Load provider name on mount and when screen comes into focus
  useEffect(() => {
    loadProviderName();
    loadProviderLocation();
  }, [loadProviderName, loadProviderLocation]);

  // Load available requests (pending jobs)
  const loadAvailableRequests = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const requests = await providerService.getAvailableRequests(50);
      const requestsArray = Array.isArray(requests) ? requests : [];

      // Map to job cards only if we have valid requests
      // Backend should already filter out accepted requests
      // We'll do a safety check but use a ref to avoid dependency issues
      const jobCards = requestsArray.length > 0
        ? requestsArray.map((req) => mapRequestToJobCard(req, false))
        : [];

      const rejectedIds = await getRejectedRequestIds();
      const currentActiveJobIds = new Set(activeJobsRef.current.map(job => job.requestId?.toString()));

      const filteredJobCards = jobCards.filter((job) => {
        const requestId = job.requestId != null ? String(job.requestId) : null;
        if (!requestId) return true;
        if (rejectedIds.has(requestId)) return false;
        const isAccepted = currentActiveJobIds.has(requestId);
        return !isAccepted;
      });

      setPendingJobs(filteredJobCards);
      
    } catch (error: any) {
      // If AuthError, redirect immediately (silent - no logs, no errors shown)
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }

      if (isConnectivityError(error)) {
        setShowNoInternet(true);
        setPendingJobs([]);
        return;
      }

      const status = error?.status;
      if (status === 401 || status === 403) {
        await handleAuthErrorRedirect(router);
        return;
      }

      // Check for specific errors and provide helpful messages
      let errorMessage = getSpecificErrorMessage(error, 'get_available_requests');
      
      // Extract error message from various response structures
      const errorText = error?.message || 
                       error?.details?.data?.error || 
                       error?.details?.data?.message || 
                       error?.details?.error || 
                       error?.details?.message ||
                       error?.error ||
                       '';
      
      // Check if it's a location issue
      if (errorText.toLowerCase().includes('location') || 
          errorText.toLowerCase().includes('location not set') ||
          errorText.toLowerCase().includes('no location')) {
        errorMessage = 'Location not set. Please set your location in profile setup to see available requests.';
      } 
      // Check if it's a category issue
      else if (errorText.toLowerCase().includes('category') || 
               errorText.toLowerCase().includes('no categories') ||
               errorText.toLowerCase().includes('no service')) {
        errorMessage = 'No service categories registered. Please add service categories in profile setup to see available requests.';
      }
      // Check if there are just no requests available
      else if (errorText.toLowerCase().includes('no requests') || 
               errorText.toLowerCase().includes('no available')) {
        errorMessage = 'No available requests found in your area. Check back later or adjust your location.';
      }
      
      if (
        !errorText.toLowerCase().includes('no requests') &&
        !errorText.toLowerCase().includes('no available')
      ) {
        showError(errorMessage);
      }
      
      setPendingJobs([]);
    } finally {
      setIsLoadingPending(false);
    }
  }, [showError, getRejectedRequestIds]);

  // Load accepted requests (active jobs)
  const loadAcceptedRequests = useCallback(async () => {
    setIsLoadingActive(true);
    try {
      const requests = await providerService.getAcceptedRequests();
      // Ensure requests is always an array
      const requestsArray = Array.isArray(requests) ? requests : [];
      
      // Map to job cards and calculate distance if provider location is available
      const jobCards = requestsArray.length > 0
        ? requestsArray
            .map((req) => {
            const jobCard = mapRequestToJobCard(req, true);
            
            // Calculate distance if we have provider location and job location
            if (providerLocation && req.location?.latitude && req.location?.longitude) {
              const distance = calculateDistance(
                providerLocation.latitude,
                providerLocation.longitude,
                req.location.latitude,
                req.location.longitude
              );
              // Add distance to job card
              return {
                ...jobCard,
                distanceKm: distance,
                minutesAway: estimateTravelTime(distance),
              };
            }
            
            return jobCard;
          })
            .sort((a, b) => (b.sortAt ?? 0) - (a.sortAt ?? 0))
        : [];
      
      setActiveJobs(jobCards);
      setHasActiveJobs(jobCards.length > 0);
      // Update ref to avoid dependency issues
      activeJobsRef.current = jobCards;
    } catch (error: any) {
      // If AuthError, redirect immediately
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      if (isConnectivityError(error)) {
        setShowNoInternet(true);
        setActiveJobs([]);
        setHasActiveJobs(false);
        activeJobsRef.current = [];
        return;
      }
      if (__DEV__) {
        // Silent error handling - no logs
      }
      const errorMessage = getSpecificErrorMessage(error, 'get_accepted_requests');
      showError(errorMessage);
      setActiveJobs([]);
      setHasActiveJobs(false);
    } finally {
      setIsLoadingActive(false);
    }
  }, [showError, providerLocation]);

  // Load data on mount and when screen comes into focus
  // Only load once when screen comes into focus, not on every render
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      if (!initialJobsLoadDoneRef.current) {
        (async () => {
          try {
            await loadAcceptedRequests();
            await loadAvailableRequests();
            initialJobsLoadDoneRef.current = true;
          } catch {
            // Silent error - already handled in individual functions
          }
        })();
      }

      return () => {
        setIsScreenFocused(false);
      };
    }, [loadAvailableRequests, loadAcceptedRequests])
  );

  // Refresh location when modal closes
  useEffect(() => {
    if (!showLocationModal) {
      refreshLocation();
    }
  }, [showLocationModal, refreshLocation]);

  // Pull to refresh - ONLY manual refresh, no auto-refresh
  // Load accepted requests FIRST, then available requests (so filtering works correctly)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await refreshMonthlyEarnings({ silent: true });
    } catch (error) {
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }
      if (isConnectivityError(error)) {
        setShowNoInternet(true);
      }
    }
    await loadAcceptedRequests();
    await loadAvailableRequests();
    setRefreshing(false);
    haptics.success();
  }, [loadAvailableRequests, loadAcceptedRequests, refreshMonthlyEarnings, router]);

  const retryConnection = useCallback(async () => {
    setShowNoInternet(false);
    setRefreshing(true);
    haptics.light();
    try {
      await refreshMonthlyEarnings({ silent: true });
      await loadAcceptedRequests();
      await loadAvailableRequests();
      await loadProviderName();
      await loadProviderLocation();
    } catch (error) {
      if (isConnectivityError(error)) {
        setShowNoInternet(true);
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshMonthlyEarnings,
    loadAcceptedRequests,
    loadAvailableRequests,
    loadProviderName,
    loadProviderLocation,
  ]);

  const openProceedChoice = useCallback((job: JobCard) => {
    if (!job.requestId) {
      showError('Invalid request ID');
      return;
    }
    haptics.light();
    setProceedJob(job);
  }, [showError, haptics]);

  const closeProceedChoice = useCallback(() => {
    if (proceedingType) return;
    setProceedJob(null);
  }, [proceedingType]);

  const handleProceedChoice = useCallback(async (type: ProviderProceedType) => {
    if (!proceedJob?.requestId || proceedingType) return;

    const jobSnapshot = proceedJob;
    setProceedingType(type);
    haptics.light();

    const destination =
      type === 'visit'
        ? {
            pathname: '/RequestVisitScreen' as any,
            params: { requestId: String(jobSnapshot.requestId), jobTitle: jobSnapshot.service },
          }
        : {
            pathname: '/SendQuotationScreen' as any,
            params: {
              requestId: String(jobSnapshot.requestId),
              jobTitle: jobSnapshot.service,
              returnToTab: 'Quotations',
            },
          };

    try {
      await providerService.acceptRequest(jobSnapshot.requestId!);
      haptics.success();
      setPendingJobs((prev) => prev.filter((job) => job.requestId !== jobSnapshot.requestId));
      setProceedJob(null);
      setProceedingType(null);
      showSuccess(type === 'visit' ? 'Request accepted. Schedule a visit next.' : 'Request accepted. Send your quotation next.');
      router.replace(destination as any);
      void Promise.all([loadAvailableRequests(), loadAcceptedRequests()]);
    } catch (error: any) {
      setProceedingType(null);
      haptics.error();
      showError(getSpecificErrorMessage(error, 'accept_request'));
    }
  }, [
    proceedJob,
    proceedingType,
    haptics,
    loadAvailableRequests,
    loadAcceptedRequests,
    router,
    showError,
    showSuccess,
  ]);

  const renderJobCard = useCallback((job: JobCard, isActive: boolean) => {
    if (isActive) {
      const scheduleLabel = [job.date, job.time].filter(Boolean).join(' · ');
      const distanceLabel =
        job.distanceKm !== undefined && job.distanceKm > 0
          ? job.distanceKm < 1
            ? `${Math.round(job.distanceKm * 1000)}m`
            : `${job.distanceKm.toFixed(1)}km`
          : null;

      return (
        <View
          key={job.id}
          style={{
            ...providerHomeSurface,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <Image
                source={require('../../assets/images/userimg.jpg')}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}
                >
                  {job.clientName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginTop: 1,
                  }}
                >
                  {job.service}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: providerHomeStatusTheme[job.status].bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: BorderRadius.full,
              }}
            >
              <Text style={{ fontSize: 10, color: providerHomeStatusTheme[job.status].text, fontFamily: 'Poppins-SemiBold' }}>
                {providerHomeStatusTheme[job.status].label}
              </Text>
            </View>
          </View>

          {scheduleLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Calendar size={11} color={Colors.textTertiary} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: Colors.textSecondaryDark,
                  fontFamily: 'Poppins-Medium',
                  marginLeft: 5,
                  flex: 1,
                }}
              >
                {scheduleLabel}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MapPin size={11} color={Colors.textTertiary} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 11,
                color: Colors.textSecondaryDark,
                fontFamily: 'Poppins-Medium',
                marginLeft: 5,
                flex: 1,
              }}
            >
              {job.location}
            </Text>
            {distanceLabel ? (
              <Text
                style={{
                  fontSize: 10,
                  color: Colors.textTertiary,
                  fontFamily: 'Poppins-Medium',
                  marginLeft: 6,
                }}
              >
                {distanceLabel}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={{
              ...providerHomeActionButton,
              width: '100%',
              paddingVertical: 8,
            }}
            onPress={() => {
              haptics.light();
              if (!job.requestId) {
                showError('Invalid job ID');
                return;
              }
              router.push({
                pathname: '/ProviderJobDetailsScreen',
                params: { requestId: job.requestId.toString() },
              } as any);
            }}
          >
            <Text style={{ ...providerHomeActionLabel, marginRight: 4 }}>Check Updates</Text>
            <ArrowRight size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
    <View
      key={job.id}
      style={{
        ...providerHomeSurface,
        padding: providerHomeSurfacePadding,
        marginBottom: 12,
      }}
    >
      {job.matchedTime && (
        <Text style={{ fontSize: 11, color: Colors.textTertiary, fontFamily: 'Poppins-Regular', marginBottom: 6 }}>
          matched {job.matchedTime}
        </Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Image source={require('../../assets/images/userimg.jpg')} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} resizeMode='cover' />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
                {job.clientName}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginTop: 2 }}>
                {job.service}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Calendar size={12} color={Colors.textSecondaryDark} />
            <Text style={{ fontSize: 12, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Regular', marginLeft: 6 }}>
              {job.date} - {job.time}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MapPin size={12} color={Colors.textSecondaryDark} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 12,
                color: Colors.textSecondaryDark,
                fontFamily: 'Poppins-Regular',
                marginLeft: 6,
                flex: 1,
              }}
            >
              {job.location}
            </Text>
          </View>
        </View>

        <View style={{ marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', gap: -6 }}>
            {job.images.slice(0, 3).map((imgSource, index) => (
              <Image
                key={index}
                source={imgSource}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  marginLeft: index > 0 ? -6 : 0,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  zIndex: 3 - index,
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      </View>

      {/* Buttons - Full Width */}
      <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            style={{
              width: '100%',
              ...providerHomeActionButton,
              backgroundColor: Colors.accent,
              borderColor: Colors.accent,
            }}
            onPress={() => {
              openProceedChoice(job);
            }}
          >
            <Send size={14} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={{ ...providerHomeActionLabel, color: Colors.white }}>
              Proceed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: '100%',
              ...providerHomeActionButton,
              borderColor: Colors.errorBorder,
              backgroundColor: Colors.errorLight,
            }}
              onPress={async () => {
              if (!job.requestId) {
                showError('Invalid request ID');
                return;
              }
              if (rejectingRequestIdRef.current === job.requestId) return;

              rejectingRequestIdRef.current = job.requestId;
              haptics.warning();
              try {
                await providerService.rejectRequest(job.requestId);
                await addRejectedRequestId(job.requestId);
                haptics.success();
                showSuccess('Request declined. The client has been notified.');
                setPendingJobs(prev => prev.filter(j => j.requestId !== job.requestId));
                await loadAvailableRequests();
              } catch (error: any) {
                rejectingRequestIdRef.current = null;
                haptics.error();
                showError(getSpecificErrorMessage(error, 'reject_request'));
              }
            }}
          >
            <Text style={{ ...providerHomeActionLabel, color: Colors.error }}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
    </View>
    );
  }, [router, loadAvailableRequests, showError, showSuccess, haptics, addRejectedRequestId, openProceedChoice]);

  const { showSkeleton: showEarningsSkeleton, isLoadingEmpty: isEarningsLoadingEmpty } =
    useSkeletonGate(isLoadingEarnings, monthlyEarnings === null);
  const { showSkeleton: showPendingSkeleton, isLoadingEmpty: isPendingLoadingEmpty } =
    useSkeletonGate(isLoadingPending, pendingJobs.length === 0);
  const { showSkeleton: showActiveSkeleton, isLoadingEmpty: isActiveLoadingEmpty } =
    useSkeletonGate(isLoadingActive, activeJobs.length === 0);

  if (showNoInternet) {
    return (
      <SafeAreaWrapper backgroundColor="#F9F9F7" tabletShellTop>
        <NoInternetScreen onRetry={retryConnection} />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.white} tabletShellTop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
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
        <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER, paddingTop: tabScrollTop, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              activeOpacity={0.8}
              onPress={() => setShowLocationModal(true)}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <MapPin size={16} color={Colors.white} />
              </View>
              <Text 
                style={{ 
                  fontSize: 14, 
                  fontFamily: 'Poppins-SemiBold', 
                  color: location ? Colors.textPrimary : Colors.textSecondaryDark, 
                  flex: 1 
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {location || 'Enter your location'}
              </Text>
              <ChevronDown size={16} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ position: 'relative', padding: 8, marginLeft: 16 }}
              onPress={() => router.push('/NotificationsScreen' as any)}
              activeOpacity={0.7}
            >
              <Bell size={22} color={Colors.textPrimary} />
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.accent,
                }}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 0 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
              Welcome, {providerName}
            </Text>
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#000000' }}>Online</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E5E7EB', true: '#4F6739' }}
                thumbColor="#FFFFFF"
              />
            </View> */}
          </View>
        </View>

        {/* Earnings card */}
        <View style={{ marginBottom: hasActiveJobs ? 26 : 20 }}>
          <SageHeroPanel
            style={{
              marginHorizontal: PROVIDER_TAB_GUTTER,
              paddingVertical: earningsPanelPaddingV + 8,
            }}
          >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: '#E5E7EB',
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  Total Earnings This Month
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/AnalyticsScreen' as any)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.11)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: Colors.white, marginRight: 4 }}>
                    Analytics
                  </Text>
                  <ArrowRight size={12} color={Colors.white} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              {(showEarningsSkeleton || isEarningsLoadingEmpty) ? (
                <SageAmountSkeleton />
              ) : (
                <>
              <Text
                style={{
                  fontSize: earningsAmountFontSize,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                  marginBottom: 10,
                  lineHeight: earningsAmountFontSize * 1.12,
                  letterSpacing: -0.8,
                }}
              >
                {formatNaira(monthlyEarnings ?? 0)}
              </Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  backgroundColor: 'rgba(255, 255, 255, 0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                }}
              >
                {earningsVsLastMonthTrend === 'down' ? (
                  <TrendingDown size={14} color={'#FCA5A5'} style={{ marginRight: 5 }} />
                ) : (
                  <TrendingUp size={14} color={Colors.accent} style={{ marginRight: 5 }} />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-SemiBold',
                    color: '#F9FAFB',
                  }}
                >
                  {earningsVsLastMonthLabel}
                </Text>
              </View>
                </>
              )}
          </SageHeroPanel>
        </View>

        <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER }}>

          {!hasActiveJobs && (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.default,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
              }}
              onPress={() => {
                haptics.light();
                router.push('/ProviderVerifyIdentityScreen' as any);
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Shield size={18} color={Colors.textSecondaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
                  Verification Pending
                </Text>
              </View>
              <ArrowRight size={18} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
          )}

          <Text style={providerHomeSectionTitle}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                ...providerHomeActionButton,
              }}
              onPress={() => {
                haptics.light();
                router.push('/YourServicesScreen' as any);
              }}
              activeOpacity={0.7}
            >
              <Plus size={18} color={Colors.textPrimary} />
              <Text style={{ ...providerHomeActionLabel, marginLeft: 6 }}>Add Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                ...providerHomeActionButton,
              }}
              onPress={() => {
                haptics.light();
                // Share provider referral invite
                shareReferral({ role: 'provider', code: undefined });
              }}
              activeOpacity={0.7}
            >
              <Users size={16} color={Colors.textPrimary} />
              <Text style={{ ...providerHomeActionLabel, marginLeft: 6 }}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
        {(isPendingLoadingEmpty || showPendingSkeleton || pendingJobs.length > 0) ? (
          <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={providerHomeSectionTitle}>Available Requests</Text>
              {!showPendingSkeleton && !isPendingLoadingEmpty && pendingJobs.length > 2 && (
                <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    View all <ArrowRight size={12} color={Colors.accent} />
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {(showPendingSkeleton || isPendingLoadingEmpty) ? (
              <ProviderJobListSkeleton count={2} />
            ) : (
              pendingJobs.slice(0, 2).map((job) => renderJobCard(job, false))
            )}
          </View>
        ) : null}

        {(isActiveLoadingEmpty || showActiveSkeleton || activeJobs.length > 0) ? (
          <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={providerHomeSectionTitle}>Recent Jobs</Text>
              {!showActiveSkeleton && !isActiveLoadingEmpty && (
              <TouchableOpacity 
                onPress={() => {
                  haptics.light();
                  router.push('/provider/jobs');
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.accent, marginRight: 4 }}>
                  View all
                </Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
              )}
            </View>
            {(showActiveSkeleton || isActiveLoadingEmpty) ? (
              <ProviderJobListSkeleton count={2} />
            ) : (
              activeJobs.slice(0, 2).map((job) => renderJobCard(job, true))
            )}
          </View>
        ) : !isLoadingActive && (
          // Empty state for active jobs will be shown below if no pending jobs either
          null
        )}

      </ScrollView>

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          refreshLocation();
        }}
        onLocationSelected={(selectedLocation) => {
          setShowLocationModal(false);
          refreshLocation();
        }}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />

      <ProviderProceedModal
        visible={!!proceedJob}
        jobTitle={proceedJob?.service}
        loadingType={proceedingType}
        onClose={closeProceedChoice}
        onSelect={handleProceedChoice}
      />

      {/* Job Accepted Modal */}
      <JobAcceptedModal
        visible={acceptedJobModal.visible}
        onClose={() => setAcceptedJobModal(prev => ({ ...prev, visible: false }))}
        onViewDetails={() => {
          if (acceptedJobModal.requestId) {
            router.push({
              pathname: '/ProviderJobDetailsScreen',
              params: { requestId: acceptedJobModal.requestId.toString() },
            } as any);
          }
        }}
        jobLocation={acceptedJobModal.jobLocation}
        distanceKm={acceptedJobModal.distanceKm}
        travelTimeMinutes={acceptedJobModal.travelTimeMinutes}
      />
    </SafeAreaWrapper>
  );
}
