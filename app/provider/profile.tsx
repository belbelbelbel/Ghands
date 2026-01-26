import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useAuthRole } from '@/hooks/useAuth';
import { haptics } from '@/hooks/useHaptics';
import { AuthError } from '@/utils/errors';
import { handleAuthErrorRedirect } from '@/utils/authRedirect';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Copy,
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
} from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { Dimensions, ActivityIndicator } from 'react-native';
import { Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { providerService, Provider, serviceRequestService, ServiceCategory, ProviderQuotationListItem, authService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { logout, switchRole } = useAuthRole();
  const [isOnline, setIsOnline] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<{ id: number; categoryName: string }[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerName, setProviderName] = useState<string>('Loading...');
  const [firstCategory, setFirstCategory] = useState<string>('');

  // Load provider data
  const loadProviderData = useCallback(async () => {
    try {
      setIsLoading(true);
      
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
        if (businessName) {
          setProviderName(businessName);
        }
        setIsLoading(false);
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
      // If AuthError, redirect immediately
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
    }
  }, []);

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProviderData();
    }, [loadProviderData])
  );

  const handleShareReferral = async () => {
    try {
      const referralLink = 'https://www.ghandsdummylink.com/chima';
      await Share.share({
        message: `Join GHands using my referral link: ${referralLink}`,
        title: 'Refer GHands',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral link');
    }
  };

  const handleCopyLink = () => {
    Alert.alert('Copied', 'Referral link copied to clipboard');
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
  const QuotationsPreview = () => {
    const [quotations, setQuotations] = useState<ProviderQuotationListItem[]>([]);
    const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);

    const loadQuotations = useCallback(async () => {
      setIsLoadingQuotations(true);
      try {
        const data = await providerService.getProviderQuotations();
        // Show only first 3 quotations
        setQuotations(data.slice(0, 3));
      } catch (error: any) {
        // If AuthError, redirect immediately
        if (error instanceof AuthError) {
          await handleAuthErrorRedirect(router);
          return;
        }
        
        if (__DEV__) {
          console.error('Error loading quotations:', error);
        }
        setQuotations([]);
      } finally {
        setIsLoadingQuotations(false);
      }
    }, []);

    useEffect(() => {
      loadQuotations();
    }, [loadQuotations]);

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
            bgColor: '#DCFCE7',
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

    if (isLoadingQuotations) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      );
    }

    if (quotations.length === 0) {
      return (
        <View
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.default,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <FileText size={32} color={Colors.textTertiary} style={{ marginBottom: 8 }} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 4,
            }}
          >
            No quotations yet
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-Regular',
              color: Colors.textTertiary,
              textAlign: 'center',
            }}
          >
            Start accepting requests to send quotations
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
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.default,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: statusConfig.color,
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
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/SettingsScreen' as any)}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
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
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100,
          }}
        >
          {/* Profile Summary */}
          <View
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
                  borderColor: Colors.white,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} style={{ marginBottom: 4 }} />
              ) : (
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {providerName || 'Provider'}
                </Text>
              )}
              {firstCategory ? (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 6,
                  }}
                >
                  {firstCategory}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
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
                  <ToggleLeft size={32} color={Colors.textTertiary} />
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: isOnline ? Colors.accent : Colors.textSecondaryDark,
                    marginLeft: 8,
                  }}
                >
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                lineHeight: 20,
              }}
            >
              Licensed electrician with 8+ years of experience. Specialized in residential and commercial electrical
              work. Committed to safety, quality, and customer satisfaction. Available for emergency calls and
              scheduled appointments.
            </Text>
          </View>

          {/* Services Offered */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
              Services Offered
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : services.length > 0 ? (
                services.map((service) => (
                  <View
                    key={service.id}
                    style={{
                      backgroundColor: Colors.backgroundGray,
                      borderRadius: BorderRadius.default,
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
                provider.categories.map((category, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: Colors.backgroundGray,
                      borderRadius: BorderRadius.default,
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
                  backgroundColor: Colors.black,
                  borderRadius: BorderRadius.default,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => {
                  haptics.light();
                  router.push('/ProviderProfileSetupScreen' as any);
                }}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* My Quotations Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
            <QuotationsPreview />
          </View>

          {/* Photos Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
                    borderRadius: BorderRadius.default,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>

          {/* License & Certification */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
                  backgroundColor: Colors.backgroundGray,
                  borderRadius: BorderRadius.default,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: BorderRadius.default,
                    backgroundColor: Colors.border,
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

          {/* Insights Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
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
                Insights
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/AnalyticsScreen' as any)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                    marginRight: 4,
                  }}
                >
                  View full analytics
                </Text>
                <ArrowRight size={14} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: Colors.accent,
                borderRadius: BorderRadius.xl,
                padding: 20,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.white,
                  marginBottom: 8,
                }}
              >
                Total Earnings This Month
              </Text>
              <Text
                style={{
                  fontSize: Math.min(32, Dimensions.get('window').width * 0.08),
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                  marginBottom: 4,
                }}
              >
                $4,285.50
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.white,
                }}
              >
                ↑ +12.5% vs last month
              </Text>
            </View>
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
              Get $10 for each referral
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                Your code:{' '}
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.textPrimary,
                  }}
                >
                  {providerName.toUpperCase().slice(0, 5)}2024
                </Text>
              </Text>
              <TouchableOpacity
                onPress={handleShareReferral}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 8,
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
            <TouchableOpacity
              onPress={handleBecomeClient}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 12,
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
                Become a Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <ArrowRight size={18} color="#DC2626" />
              <Text 
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: '#DC2626',
                  marginLeft: 12,
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={Colors.textPrimary} />
              <Text 
                style={{
                  fontSize: 15,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
