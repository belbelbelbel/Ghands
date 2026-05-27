import { SageHeroPanel } from '@/components/provider/SageHeroPanel';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, useTabScrollContentPaddingTop } from '@/lib/designSystem';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import { providerListCard } from '@/lib/providerSurfaceStyles';
import { useAuthRole } from '@/hooks/useAuth';
import { haptics } from '@/hooks/useHaptics';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { isConnectivityOrNetworkError } from '@/utils/isNetworkFailure';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Edit,
  Image as ImageIcon,
  Settings,
  Plus,
  Share2,
  Star,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  LogOut,
} from 'lucide-react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { providerService, Provider, serviceRequestService, ServiceCategory, ProviderQuotationListItem, authService } from '@/services/api';
import Skeleton from '@/components/LoadingSkeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareReferral } from '@/utils/referral';


// Helper function to format category name (camelCase to readable)
const formatCategoryName = (categoryName: string, allCategories: ServiceCategory[] = []): string => {
  if (!categoryName) return '';
  
  // Try to find display name from categories list
  const category = allCategories.find(cat => cat.name === categoryName);
  if (category?.displayName) {
    return category.displayName;
  }
  
  // Fallback: Convert camelCase to Title Case
  return categoryName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const headerTopPad = useTabScrollContentPaddingTop(16);
  const scrollBodyTopPad = useTabScrollContentPaddingTop(20);
  const { logout, switchRole } = useAuthRole();
  const [isOnline, setIsOnline] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<{ id: number; categoryName: string }[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerName, setProviderName] = useState<string>('');
  const [firstCategory, setFirstCategory] = useState<string>('');

  const profileReadyOnceRef = useRef(false);

  /** Sage header card reveals once profile is ready. */
  const heroContentLoading = isLoading;

  // Load provider data
  const loadProviderData = useCallback(async () => {
    if (!profileReadyOnceRef.current) {
      setIsLoading(true);
    }
    try {
      
      // Load all categories first (to get display names)
      let categoriesList: ServiceCategory[] = [];
      try {
        categoriesList = await serviceRequestService.getCategories();
        setAllCategories(categoriesList);
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading categories:', error);
        }
      }
      
      // Get provider ID
      const providerId = await authService.getCompanyId();
      if (!providerId) {
        // Try to get from business name storage as fallback
        const businessName = await AsyncStorage.getItem('@ghands:business_name');
        setProviderName(businessName ?? '');
        return;
      }

      // Load provider details
      const providerData = await providerService.getProvider(providerId);
      setProvider(providerData);
      
      // Set provider name
      if (providerData.name) {
        setProviderName(providerData.name);
        // Also save to storage for consistency
        await AsyncStorage.setItem('@ghands:company_name', providerData.name);
      } else {
        // Fallback to business name from storage
        const businessName = await AsyncStorage.getItem('@ghands:business_name');
        if (businessName) {
          setProviderName(businessName);
        }
      }

      // Extract services/categories from provider data
      // Provider response includes categories as array of strings: ["plumbing", "electrical"]
      // Convert to expected format: [{ id: number, categoryName: string }]
      if (providerData.categories && Array.isArray(providerData.categories)) {
        const providerServices = providerData.categories.map((categoryName: string, index: number) => ({
          id: index + 1,
          categoryName: categoryName,
        }));
        setServices(providerServices);
        
        // Set first category as profession/title (with display name if available)
        if (providerServices.length > 0) {
          const firstService = formatCategoryName(providerServices[0].categoryName, categoriesList);
          setFirstCategory(firstService);
        }
      } else {
        // Try to get services using the service method as fallback
        try {
          const providerServices = await providerService.getServices(providerId);
          setServices(providerServices);
          
          if (providerServices.length > 0) {
            const firstService = formatCategoryName(providerServices[0].categoryName, categoriesList);
            setFirstCategory(firstService);
          }
        } catch (error) {
          // If getServices fails, just use empty array
          setServices([]);
        }
      }

    } catch (error: any) {
      if (isConnectivityOrNetworkError(error)) {
        if (__DEV__) {
          console.warn('Provider profile: offline or network error — staying signed in.');
        }
        return;
      }
      if (error instanceof AuthError) {
        await handleAuthErrorRedirect(router);
        return;
      }

      if (__DEV__) {
        console.error('Error loading provider profile:', error);
      }
      // Fallback to business name from storage
      try {
        const businessName = await AsyncStorage.getItem('@ghands:business_name');
        if (businessName) {
          setProviderName(businessName);
        }
      } catch (e) {
        if (__DEV__) {
          console.error('Error loading business name:', e);
        }
      }
    } finally {
      setIsLoading(false);
      profileReadyOnceRef.current = true;
    }
  }, []);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!profileReadyOnceRef.current) {
        loadProviderData();
      }
    }, [loadProviderData])
  );

  const handleShareReferral = async () => {
    const code = (provider as any)?.referralCode ?? (provider as any)?.referral_code ?? null;
    await shareReferral({ role: 'provider', code });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle delete account
          },
        },
      ]
    );
  };

  const handleBecomeClient = () => {
    Alert.alert(
      'Switch to Client',
      'Switch to client mode for demo and testing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await switchRole('client');
            } catch (error) {
              Alert.alert('Error', 'Failed to switch role. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Quotations Preview Component
  const QuotationsPreview = ({ profileLoading }: { profileLoading: boolean }) => {
    const [quotations, setQuotations] = useState<ProviderQuotationListItem[]>([]);
    const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
    const [quotationsLoadOffline, setQuotationsLoadOffline] = useState(false);
    const quotationsFetchInFlight = useRef(false);

    const loadQuotations = useCallback(async () => {
      if (quotationsFetchInFlight.current) return;
      quotationsFetchInFlight.current = true;
      setIsLoadingQuotations(true);
      try {
        const data = await providerService.getProviderQuotations();
        setQuotationsLoadOffline(false);
        // Show only first 2 quotations in profile preview
        setQuotations(data.slice(0, 2));
      } catch (error: any) {
        if (isConnectivityOrNetworkError(error)) {
          setQuotationsLoadOffline(true);
          setQuotations([]);
          if (__DEV__) {
            console.warn('Quotations preview: offline — not logging out.');
          }
          return;
        }
        if (error instanceof AuthError) {
          await handleAuthErrorRedirect(router);
          return;
        }

        if (__DEV__) {
          console.error('Error loading quotations:', error);
        }
        setQuotationsLoadOffline(false);
        setQuotations([]);
      } finally {
        setIsLoadingQuotations(false);
        quotationsFetchInFlight.current = false;
      }
    }, [router]);

    useEffect(() => {
      if (profileLoading) return;
      loadQuotations();
    }, [profileLoading, loadQuotations]);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'accepted':
          return {
            color: '#16A34A',
            bgColor: 'rgba(79, 103, 57, 0.14)',
            icon: CheckCircle2,
            label: 'Accepted',
          };
        case 'rejected':
          return {
            color: '#DC2626',
            bgColor: '#FEE2E2',
            icon: XCircle,
            label: 'Rejected',
          };
        case 'pending':
        default:
          return {
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            icon: Clock,
            label: 'Pending',
          };
      }
    };

    const showQuotationsSkeleton = profileLoading || (isLoadingQuotations && quotations.length === 0);

    if (showQuotationsSkeleton) {
      return (
        <View>
          {[0, 1].map((idx) => (
            <View
              key={`q-skel-${idx}`}
              style={{
                ...providerListCard,
                marginBottom: 8,
              }}
            >
              <Skeleton width="68%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="44%" height={12} borderRadius={6} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width={72} height={22} borderRadius={BorderRadius.xl} />
                <Skeleton width={64} height={14} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (quotations.length === 0) {
      return (
        <View
          style={{
            ...providerListCard,
            alignItems: 'center',
            paddingVertical: 20,
          }}
        >
          <FileText size={32} color={Colors.textTertiary} style={{ marginBottom: 8 }} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {quotationsLoadOffline ? 'No connection' : 'No quotations yet'}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-Regular',
              color: Colors.textTertiary,
              textAlign: 'center',
            }}
          >
            {quotationsLoadOffline
              ? 'Check your internet and try again. You are still signed in.'
              : 'Start accepting requests to send quotations'}
          </Text>
        </View>
      );
    }

    return (
      <View>
        {quotations.map((quotation) => {
          const statusConfig = getStatusConfig(quotation.status);
          const StatusIcon = statusConfig.icon;

          return (
            <TouchableOpacity
              key={quotation.id}
              activeOpacity={0.7}
              onPress={() => {
                haptics.light();
                router.push({
                  pathname: '/ProviderJobDetailsScreen',
                  params: { requestId: quotation.requestId.toString() },
                } as any);
              }}
              style={{
                ...providerListCard,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {quotation.request?.jobTitle || `Request #${quotation.requestId}`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                    numberOfLines={1}
                  >
                    {quotation.user?.firstName} {quotation.user?.lastName}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: BorderRadius.xl,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <StatusIcon size={12} color={statusConfig.color} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins-SemiBold',
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  ₦{formatCurrency(quotation.total)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.accent,
                      marginRight: 4,
                    }}
                  >
                    View
                  </Text>
                  <ArrowRight size={12} color={Colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight} tabletShellTop>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: PROVIDER_TAB_GUTTER,
            paddingTop: headerTopPad,
            paddingBottom: 12,
          backgroundColor: Colors.backgroundLight,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/SettingsScreen' as any)}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: Colors.white,
            }}
            activeOpacity={0.7}
          >
            <Settings size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
              textAlign: 'center',
            }}
          >
            Profile
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            activeOpacity={0.7}
            onPress={() => router.push('/NotificationsScreen' as any)}
          >
            <Bell size={24} color={Colors.textPrimary} />
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: Colors.accent,
              }}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: PROVIDER_TAB_GUTTER,
            paddingTop: scrollBodyTopPad,
            paddingBottom: 100,
          }}
        >
          {/* Profile Summary */}
          <SageHeroPanel
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <View style={{ position: 'relative', marginRight: 16 }}>
              <Image
                source={require('../../assets/images/userimg.jpg')}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.38)',
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: Colors.accent,
                  borderWidth: 3,
                  borderColor: Colors.accent,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              {heroContentLoading ? (
                <View>
                  <Skeleton
                    width="78%"
                    height={22}
                    borderRadius={8}
                    variant="sage"
                    style={{ marginBottom: 10 }}
                  />
                  <Skeleton
                    width="52%"
                    height={14}
                    borderRadius={7}
                    variant="sage"
                    style={{ marginBottom: 12 }}
                  />
                  <Skeleton
                    width={110}
                    height={16}
                    borderRadius={6}
                    variant="sage"
                    style={{ marginBottom: 12 }}
                  />
                  <Skeleton
                    width={140}
                    height={32}
                    borderRadius={999}
                    variant="sage"
                  />
                </View>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.white,
                      marginBottom: 4,
                      letterSpacing: -0.4,
                    }}
                    numberOfLines={1}
                  >
                    {providerName.trim() || 'Provider'}
                  </Text>
                  {firstCategory ? (
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Regular',
                        color: 'rgba(255,255,255,0.68)',
                        marginBottom: 6,
                      }}
                    >
                      {firstCategory}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Star size={16} color={Colors.accent} fill={Colors.accent} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                        marginLeft: 4,
                      }}
                    >
                      4.9 (127)
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsOnline(!isOnline)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                    }}
                    activeOpacity={0.7}
                  >
                    {isOnline ? (
                      <ToggleRight size={32} color={Colors.accent} />
                    ) : (
                      <ToggleLeft size={32} color="rgba(255,255,255,0.45)" />
                    )}
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Medium',
                        color: isOnline ? Colors.accent : 'rgba(255,255,255,0.62)',
                        marginLeft: 8,
                      }}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </SageHeroPanel>

          {/* About Section */}
          <View
            style={{
              ...providerListCard,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                About
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/ProviderProfileSetupScreen' as any)}
              >
                <Edit size={16} color={Colors.accent} style={{ marginRight: 4 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View>
                <Skeleton width="94%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                <Skeleton width="88%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                <Skeleton width="72%" height={14} borderRadius={6} />
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  lineHeight: 20,
                }}
              >
                {(provider as any)?.about?.trim?.() || 'No profile bio available yet.'}
              </Text>
            )}
          </View>

          {/* Services Offered */}
          <View
            style={{
              ...providerListCard,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                Services Offered
              </Text>
              {(services.length > 2 || (!services.length && provider?.categories && provider.categories.length > 2)) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    haptics.light();
                    router.push('/YourServicesScreen' as any);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.accent,
                    }}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {isLoading ? (
                <>
                  <Skeleton width={92} height={36} borderRadius={999} style={{ marginRight: 8 }} />
                  <Skeleton width={104} height={36} borderRadius={999} style={{ marginRight: 8 }} />
                </>
              ) : services.length > 0 ? (
                services.slice(0, 2).map((service) => (
                  <View
                    key={service.id}
                    style={{
                      backgroundColor: '#F2F8EA',
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textPrimary,
                      }}
                    >
                      {formatCategoryName(service.categoryName, allCategories)}
                    </Text>
                  </View>
                ))
              ) : provider?.categories && provider.categories.length > 0 ? (
                provider.categories.slice(0, 2).map((category, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#F2F8EA',
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textPrimary,
                      }}
                    >
                      {formatCategoryName(category, allCategories)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    fontStyle: 'italic',
                  }}
                >
                  No services added yet
                </Text>
              )}
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: Colors.accent,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: Colors.sagePanelBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoading ? 0.45 : 1,
                }}
                disabled={isLoading}
                activeOpacity={0.7}
                onPress={() => {
                  haptics.light();
                  router.push('/YourServicesScreen' as any);
                }}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* My Quotations Section */}
          <View
            style={{
              ...providerListCard,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                My Quotations
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => {
                  haptics.light();
                  router.push('/provider/quotations' as any);
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                    marginRight: 4,
                  }}
                >
                  View all
                </Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <QuotationsPreview profileLoading={isLoading} />
          </View>

          {/* Photos Section */}
          <View
            style={{
              ...providerListCard,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                }}
              >
                Photos
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/PhotosGalleryScreen' as any)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                    marginRight: 4,
                  }}
                >
                  View all
                </Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                require('../../assets/images/jobcardimg.png'),
                require('../../assets/images/guideimg.jpg'),
                require('../../assets/images/onboarding1.png'),
              ].map((imageSource, index) => (
                <Image
                  key={index}
                  source={imageSource}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(17, 24, 39, 0.045)',
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>

          {/* License & Certification */}
          <View
            style={{
              ...providerListCard,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 12,
              }}
            >
              License & Certification
            </Text>
            {[1, 2].map((index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  padding: 12,
                  backgroundColor: '#F7F8FA',
                  borderRadius: 16,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: BorderRadius.default,
                    backgroundColor: Colors.white,
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={24} color={Colors.textSecondaryDark} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textPrimary,
                    flex: 1,
                  }}
                >
                  Cert.pdf
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
              }}
              activeOpacity={0.7}
              onPress={() => {
                haptics.light();
                router.push('/ProviderUploadDocumentsScreen' as any);
              }}
            >
              <Plus size={18} color={Colors.accent} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.accent,
                }}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {/* Refer Friends Section */}
          <View
            style={{
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 6,
              }}
            >
              Refer Friends
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 12,
              }}
            >
              Invite friends and earn rewards
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
                padding: 16,
                shadowColor: '#101828',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.035,
              shadowRadius: 10,
              elevation: 0,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 4,
                  }}
                >
                  Your code
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  {(provider as any)?.referralCode ||
                    (provider as any)?.referral_code ||
                    '—'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleShareReferral}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginBottom: 24 }}>
            {__DEV__ ? (
            <TouchableOpacity
              onPress={handleBecomeClient}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text 
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                }}
              >
                Switch to client mode (dev)
              </Text>
            </TouchableOpacity>
            ) : null}

            <View
              style={{
                ...providerListCard,
                overflow: 'hidden',
                padding: 0,
              }}
            >
              <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  Account access
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginTop: 2,
                  }}
                >
                  Manage your session and account security.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  minHeight: 92,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.72}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    backgroundColor: '#FFF4ED',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 15,
                  }}
                >
                  <LogOut size={20} color="#C2413D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                    }}
                  >
                    Sign out
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginTop: 5,
                      lineHeight: 18,
                    }}
                  >
                    End this session and return to login.
                  </Text>
                </View>
                <ChevronRight size={21} color="rgba(17, 24, 39, 0.28)" />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#EEF1E8', marginLeft: 78, marginRight: 18 }} />

              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{
                  minHeight: 94,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFBFA',
                }}
                activeOpacity={0.72}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 15,
                  }}
                >
                  <Trash2 size={20} color="#B42318" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: '#B42318',
                    }}
                  >
                    Delete account
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: '#7F1D1D',
                      marginTop: 5,
                      lineHeight: 18,
                    }}
                  >
                    Permanently remove your provider profile and data.
                  </Text>
                </View>
                <ChevronRight size={21} color="rgba(180, 35, 24, 0.35)" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
