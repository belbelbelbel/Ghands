import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import LocationSearchModal from '@/components/LocationSearchModal';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import Skeleton, { JobCardSkeleton } from '@/components/LoadingSkeleton';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Calendar, ChevronDown, MapPin, Plus, Shield, Users } from 'lucide-react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH < 375 ? 0.85 : SCREEN_WIDTH < 414 ? 0.92 : 1.0;
import { providerService, serviceRequestService, AvailableRequest, ServiceRequest, authService } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { haptics } from '@/hooks/useHaptics';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import JobAcceptedModal from '@/components/JobAcceptedModal';
import { calculateDistance, estimateTravelTime } from '@/utils/navigationUtils';
import { useTokenGuard } from '@/hooks/useTokenGuard';

interface JobCard {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: 'in-progress' | 'pending';
  matchedTime?: string;
  images: any[];
  requestId?: number;
  distanceKm?: number;
  minutesAway?: number;
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
    status: isActive ? 'in-progress' : 'pending',
    matchedTime: isActive ? undefined : formatTimeAgo(request.createdAt || ''),
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
  const { isChecking } = useTokenGuard();
  const { location, refreshLocation } = useUserLocation();
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingJobs, setPendingJobs] = useState<JobCard[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobCard[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providerName, setProviderName] = useState<string>('Guest');
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const activeJobsRef = useRef<JobCard[]>([]);
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

  // Load provider/company name
  const loadProviderName = useCallback(async () => {
    try {
      // First, try to get company name from AsyncStorage (saved during signup)
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

  useFocusEffect(
    useCallback(() => {
      loadProviderName();
    }, [loadProviderName])
  );

  // Load available requests (pending jobs)
  const loadAvailableRequests = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] Starting to load requests...');
      }
      
      const requests = await providerService.getAvailableRequests(50);
      
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] Received from API:', {
          requests,
          requestsType: typeof requests,
          isArray: Array.isArray(requests),
          length: Array.isArray(requests) ? requests.length : 'not an array',
          firstRequest: Array.isArray(requests) && requests.length > 0 ? requests[0] : null,
        });
      }
      
      const requestsArray = Array.isArray(requests) ? requests : [];
      
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] After array check:', {
          requestsArray,
          requestsArrayLength: requestsArray.length,
        });
      }
      
      // Map to job cards only if we have valid requests
      // Backend should already filter out accepted requests
      // We'll do a safety check but use a ref to avoid dependency issues
      const jobCards = requestsArray.length > 0 
        ? requestsArray.map((req) => mapRequestToJobCard(req, false))
        : [];
      
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] Mapped job cards:', {
          jobCards,
          jobCardsLength: jobCards.length,
          firstJobCard: jobCards.length > 0 ? jobCards[0] : null,
        });
      }
      
      // CRITICAL: Filter out any requests that are already in accepted jobs
      // This ensures accepted requests NEVER show in available requests
      const currentActiveJobIds = new Set(activeJobsRef.current.map(job => job.requestId?.toString()));
      const filteredJobCards = jobCards.filter((job) => {
        const requestId = job.requestId?.toString();
        const isAccepted = currentActiveJobIds.has(requestId);
        
        if (__DEV__ && isAccepted) {
          console.log('🔍 [loadAvailableRequests] Filtering out accepted request:', {
            requestId,
            jobTitle: job.service,
          });
        }
        
        return !isAccepted;
      });
      
      if (__DEV__ && filteredJobCards.length !== jobCards.length) {
        console.log('🔍 [loadAvailableRequests] Filtered out accepted requests:', {
          originalCount: jobCards.length,
          filteredCount: filteredJobCards.length,
          removedCount: jobCards.length - filteredJobCards.length,
          activeJobIds: Array.from(currentActiveJobIds),
        });
      }
      
      setPendingJobs(filteredJobCards);
      
    } catch (error: any) {
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] Error caught in UI:', {
          error,
          errorType: typeof error,
          errorName: error?.name,
          errorMessage: error?.message,
          errorStatus: error?.status,
          errorDetails: error?.details,
          errorResponse: error?.response,
          isAuthError: error instanceof AuthError,
          errorKeys: error ? Object.keys(error) : [],
        });
      }
      
      // If AuthError, redirect immediately (silent - no logs, no errors shown)
      if (error instanceof AuthError) {
        if (__DEV__) {
          console.log('🔍 [loadAvailableRequests] AuthError detected, redirecting...');
        }
        await handleAuthErrorRedirect(router);
        return;
      }
      
      // Check if it's a 500 error that might be auth-related
      // For provider endpoints, 500 errors are often auth-related (expired/invalid token)
      const status = error?.status || 500;
      if (status === 500) {
        if (__DEV__) {
          console.log('🔍 [loadAvailableRequests] 500 error detected, checking token...');
        }
        try {
          const { authService } = await import('@/services/authService');
          const token = await authService.getAuthToken();
          if (__DEV__) {
            console.log('🔍 [loadAvailableRequests] Token check:', {
              hasToken: !!token,
              tokenLength: token?.length,
            });
          }
          if (!token) {
            // No token = auth error, redirect silently
            if (__DEV__) {
              console.log('🔍 [loadAvailableRequests] No token found, redirecting...');
            }
            await handleAuthErrorRedirect(router);
            return;
          }
          // Even if token exists, 500 on provider protected route usually means expired/invalid token
          // Be aggressive - redirect on any 500 error for provider endpoints
          if (__DEV__) {
            console.log('🔍 [loadAvailableRequests] Token exists but 500 error, redirecting...');
          }
          await handleAuthErrorRedirect(router);
          return;
        } catch (redirectError) {
          if (__DEV__) {
            console.log('🔍 [loadAvailableRequests] Redirect error:', redirectError);
          }
          // If redirect fails, try again with fallback
          try {
            router.replace('/ProviderSignInScreen' as any);
          } catch {
            // Silent fail
          }
          return;
        }
      }
      
      // Don't log errors - silent handling for auth errors
      // Check if it's a network error first
      const isNetworkError = error?.isNetworkError || 
                            error?.message?.includes('Network') || 
                            error?.message?.includes('Failed to fetch') ||
                            error?.message?.includes('Network request failed');
      
      if (isNetworkError) {
        if (__DEV__) {
          console.log('🔍 [loadAvailableRequests] Network error detected');
        }
        showError('No internet connection. Please check your connection and reconnect to continue.');
        setPendingJobs([]);
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
      
      if (__DEV__) {
        console.log('🔍 [loadAvailableRequests] Error text extracted:', {
          errorText,
          errorMessage,
        });
      }
      
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
      
      // Don't show errors for auth-related issues (already redirected)
      // Only show error if it's not a "no requests" case and not a 500 error
      if (!errorText.toLowerCase().includes('no requests') && 
          !errorText.toLowerCase().includes('no available') &&
          status !== 500) {
        if (__DEV__) {
          console.log('🔍 [loadAvailableRequests] Showing error to user:', errorMessage);
        }
        showError(errorMessage);
      } else {
        if (__DEV__) {
          console.log('🔍 [loadAvailableRequests] Suppressing error (no requests or 500):', {
            errorText,
            status,
          });
        }
      }
      
      setPendingJobs([]);
    } finally {
      setIsLoadingPending(false);
    }
  }, [showError]);

  // Load accepted requests (active jobs)
  const loadAcceptedRequests = useCallback(async () => {
    setIsLoadingActive(true);
    try {
      const requests = await providerService.getAcceptedRequests();
      
      // Ensure requests is always an array
      const requestsArray = Array.isArray(requests) ? requests : [];
      
      // Map to job cards and calculate distance if provider location is available
      const jobCards = requestsArray.length > 0
        ? requestsArray.map((req) => {
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
      // Load accepted requests FIRST to update the ref
      // Then load available requests which will filter out accepted ones
      (async () => {
        try {
          await loadAcceptedRequests();
          await loadAvailableRequests();
        } catch {
          // Silent error - already handled in individual functions
        }
      })();
      
      // Cleanup when screen loses focus
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
    // Load accepted requests first to update the ref
    await loadAcceptedRequests();
    // Then load available requests which will filter out accepted ones
    await loadAvailableRequests();
    setRefreshing(false);
    haptics.success();
  }, [loadAvailableRequests, loadAcceptedRequests]); 

  const renderJobCard = useCallback((job: JobCard, isActive: boolean) => (
    <View
      key={job.id}
      style={{
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {job.matchedTime && (
        <Text style={{ fontSize: 11, color: Colors.textTertiary, fontFamily: 'Poppins-Regular', marginBottom: 6 }}>
          matched {job.matchedTime}
        </Text>
      )}
      {isActive && (
        <View
          style={{
            backgroundColor: Colors.successLight,
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: BorderRadius.default,
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 11, color: Colors.success, fontFamily: 'Poppins-SemiBold' }}>In Progress</Text>
        </View>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            <MapPin size={12} color={Colors.textSecondaryDark} />
            <Text style={{ fontSize: 12, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Regular', marginLeft: 6, flex: 1 }}>
              {job.location}
            </Text>
            {isActive && job.distanceKm !== undefined && job.distanceKm > 0 && (
              <View
                style={{
                  backgroundColor: Colors.backgroundGray,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: BorderRadius.sm,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 11, color: Colors.textSecondaryDark, fontFamily: 'Poppins-Medium' }}>
                  {job.distanceKm < 1 ? `${Math.round(job.distanceKm * 1000)}m` : `${job.distanceKm.toFixed(1)}km`}
                </Text>
              </View>
            )}
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
      {isActive ? (
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
            if (!job.requestId) {
              showError('Invalid job ID');
              return;
            }
            
            router.push({
              pathname: '/ProviderJobDetailsScreen',
              params: {
                requestId: job.requestId.toString(),
              },
            } as any);
          }}
        >
          <Text style={{ color: Colors.white, fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
            Check Updates
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: BorderRadius.default,
              backgroundColor: Colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={async () => {
              if (!job.requestId) {
                showError('Invalid request ID');
                return;
              }
              
              haptics.light();
              try {
                // Get job location details for modal
                const jobRequest = pendingJobs.find(j => j.requestId === job.requestId);
                let jobLocationData = {
                  address: job.location || 'Location not specified',
                  city: '',
                  latitude: 0,
                  longitude: 0,
                };
                let distanceKm: number | undefined;
                let travelTimeMinutes: number | undefined;

                // Try to get location from the original request data
                try {
                  const requestDetails = await serviceRequestService.getRequestDetails(job.requestId);
                  
                  if (requestDetails?.location) {
                    jobLocationData = {
                      address: requestDetails.location.formattedAddress || requestDetails.location.address || job.location,
                      city: requestDetails.location.city || '',
                      latitude: requestDetails.location.latitude || 0,
                      longitude: requestDetails.location.longitude || 0,
                    };

                    // Calculate distance if we have both provider and job locations
                    if (providerLocation && jobLocationData.latitude && jobLocationData.longitude) {
                      distanceKm = calculateDistance(
                        providerLocation.latitude,
                        providerLocation.longitude,
                        jobLocationData.latitude,
                        jobLocationData.longitude
                      );
                      travelTimeMinutes = estimateTravelTime(distanceKm);
                    } else if (job.distanceKm !== undefined) {
                      // Use distance from API if available
                      distanceKm = job.distanceKm;
                      travelTimeMinutes = job.minutesAway;
                    }
                  } else if (job.distanceKm !== undefined) {
                    // Use distance from job card if available
                    distanceKm = job.distanceKm;
                    travelTimeMinutes = job.minutesAway;
                  }
                } catch (error) {
                  // If we can't get location details, use what we have from job card
                  if (job.distanceKm !== undefined) {
                    distanceKm = job.distanceKm;
                    travelTimeMinutes = job.minutesAway;
                  }
                }

                // Optimistically remove from available requests immediately
                setPendingJobs(prev => prev.filter(j => j.requestId !== job.requestId));
                
                await providerService.acceptRequest(job.requestId);
                haptics.success();
                
                // Show modal with location and navigation options
                // Show modal if we have address (even without coordinates) or if we have valid coordinates
                if (jobLocationData.address && jobLocationData.address !== 'Location not specified') {
                  // If we have valid coordinates, use them; otherwise use default (0,0) but still show modal
                  if (jobLocationData.latitude === 0 || jobLocationData.longitude === 0) {
                    // Try to get coordinates from the job card if available
                    const jobWithLocation = pendingJobs.find(j => j.requestId === job.requestId);
                    // If still no coordinates, modal will show but navigation won't work
                  }
                  
                  setAcceptedJobModal({
                    visible: true,
                    jobLocation: {
                      address: jobLocationData.address,
                      city: jobLocationData.city,
                      latitude: jobLocationData.latitude || 0,
                      longitude: jobLocationData.longitude || 0,
                    },
                    distanceKm,
                    travelTimeMinutes,
                    requestId: job.requestId,
                  });
                } else {
                  // Fallback to toast if no location data at all
                  showSuccess('Request accepted! Waiting for client confirmation.');
                }
                
                // Load accepted requests FIRST to update the ref
                await loadAcceptedRequests();
                
                // Then load available requests (which will filter out the accepted one)
                await loadAvailableRequests();
              } catch (error: any) {
                if (__DEV__) {
                  // Silent error handling - no logs
                }
                haptics.error();
                const errorMessage = getSpecificErrorMessage(error, 'accept_request');
                showError(errorMessage);
              }
            }}
          >
            <Text style={{ color: Colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 12, marginRight: 4 }}>
              Accept Request
            </Text>
            <ArrowRight size={14} color={Colors.textPrimary} />
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
            onPress={() => {
              haptics.light();
              router.push({
                pathname: '/ProviderJobDetailsScreen',
                params: {
                  requestId: job.requestId?.toString() || job.id,
                },
              } as any);
            }}
          >
            <Text style={{ color: Colors.error, fontFamily: 'Poppins-SemiBold', fontSize: 12 }}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [router, loadAvailableRequests, loadAcceptedRequests, showError, showSuccess, haptics]);

  // If checking token, show nothing (will redirect if no token)
  if (isChecking) {
    return null;
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
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
        <View style={{ paddingHorizontal: 16, paddingTop: 17, paddingBottom: 12 }}>
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
                  backgroundColor: Colors.black,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <MapPin size={16} color={Colors.accent} />
              </View>
              <Text 
                style={{ 
                  fontSize: 14, 
                  fontFamily: 'Poppins-Medium', 
                  color: location ? Colors.textPrimary : Colors.textSecondaryDark, 
                  flex: 1 
                }}
                numberOfLines={1}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>
              Welcome, {providerName}
            </Text>
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#000000' }}>Online</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E5E7EB', true: '#6A9B00' }}
                thumbColor="#FFFFFF"
              />
            </View> */}
          </View>

          {!hasActiveJobs && (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
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

          <Text style={{ fontSize: 15, fontFamily: 'Poppins-Medium', color: Colors.textPrimary, marginBottom: 10 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.black,
                borderRadius: BorderRadius.xl,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                haptics.light();
                router.push('/ProviderProfileSetupScreen' as any);
              }}
              activeOpacity={0.7}
            >
              <Plus size={16} color={Colors.white} />
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.white, marginLeft: 6 }}>
                Add Service
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.black,
                borderRadius: BorderRadius.xl,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                haptics.light();
                // Share referral link or navigate to referral screen
                router.push('/provider/profile' as any);
              }}
              activeOpacity={0.7}
            >
              <Users size={16} color={Colors.white} />
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Colors.white, marginLeft: 6 }}>
                Invite Friends
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {isLoadingActive ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Skeleton width={100} height={16} borderRadius={8} />
              <Skeleton width={60} height={12} borderRadius={6} />
            </View>
            {[1, 2].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </View>
        ) : Array.isArray(activeJobs) && activeJobs.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>Active Jobs</Text>
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
            </View>
            {activeJobs.slice(0, 2).map((job) => renderJobCard(job, true))}
          </View>
        ) : !isLoadingActive && (
          // Empty state for active jobs will be shown below if no pending jobs either
          null
        )}

        {isLoadingPending ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ width: 140, height: 16, backgroundColor: Colors.border, borderRadius: 8 }} />
              <View style={{ width: 60, height: 12, backgroundColor: Colors.border, borderRadius: 6 }} />
            </View>
            {[1, 2, 3].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </View>
        ) : Array.isArray(pendingJobs) && pendingJobs.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>Available Requests</Text>
              {pendingJobs.length > 3 && (
                <TouchableOpacity onPress={() => router.push('/provider/jobs')}>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    View all <ArrowRight size={12} color={Colors.accent} />
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {pendingJobs.slice(0, 3).map((job) => renderJobCard(job, false))}
          </View>
        ) : !isLoadingPending && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20, alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginBottom: 8 }}>
              No available requests
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 12 }}>
              New service requests will appear here when they match your registered categories and are within your location radius.
            </Text>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/ProviderProfileSetupScreen' as any);
              }}
              style={{
                backgroundColor: Colors.accent,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: BorderRadius.default,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                Update Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show empty state only if both sections are empty and not loading */}
        {!isLoadingPending && !isLoadingActive && 
         Array.isArray(pendingJobs) && pendingJobs.length === 0 && 
         Array.isArray(activeJobs) && activeJobs.length === 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20, alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.backgroundGray, borderRadius: BorderRadius.xl }}>
            <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 8 }}>
              No requests yet
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', maxWidth: 280, marginBottom: 16 }}>
              To see available requests, make sure you've:{'\n'}
              • Set your business location{'\n'}
              • Added service categories you offer
            </Text>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.push('/ProviderProfileSetupScreen' as any);
              }}
              style={{
                backgroundColor: Colors.black,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: BorderRadius.default,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
                Complete Profile Setup
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
            Featured Resources
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                overflow: 'hidden',
              }}
              onPress={() => {
                haptics.light();
                router.push('/UserGuideScreen' as any);
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  height: 100,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                }}
              >
                <Image source={require('../../assets/images/guideimg.jpg')} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode='cover' />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 3 }}>
                  How to get started
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                  Learn best practices and guidelines for providing services.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                overflow: 'hidden',
              }}
              onPress={() => {
                haptics.light();
                router.push('/SupportScreen' as any);
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  height: 100,
                  backgroundColor: Colors.black,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={require('../../assets/images/guideimg.jpg')} style={{ width: '100%', height: '100%', borderRadius: BorderRadius.xl }} resizeMode='cover' />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 3 }}>
                  FAQ & Support
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                  Find answers to common questions and get support.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights Section */}
        {hasActiveJobs ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: Colors.textPrimary }}>Job Completion Rate</Text>
                <TouchableOpacity onPress={() => router.push('/AnalyticsScreen' as any)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>
                    View full analytics <ArrowRight size={11} color={Colors.accent} />
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: Math.min(32, Dimensions.get('window').width * 0.08), fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 4 }}>
                95%
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>Last 30 Days </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>+5%</Text>
              </View>
              <View
                style={{
                  height: 32,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 3,
                }}
              >
                {[20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 65, 75, 80, 85, 90, 88, 92, 95, 93, 95].map(
                  (height, index) => (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        backgroundColor: Colors.accent,
                        borderRadius: 2,
                      }}
                    />
                  )
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 10 }}>
              Insights
            </Text>
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                borderWidth: 2,
                borderColor: Colors.border,
                borderStyle: 'dashed',
                padding: 32,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 6 }}>
                No insights yet
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 16 }}>
                Once you start getting jobs, you'll see insights here.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.black,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: BorderRadius.default,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>Learn more</Text>
              </TouchableOpacity>
            </View>
          </View>
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
