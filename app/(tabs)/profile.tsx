import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useAuthRole } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { BorderRadius, Colors, REFRESH_CONTROL, Spacing, useTabScrollContentPaddingTop } from '@/lib/designSystem';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowRight, Bell, ChevronRight, CreditCard, HelpCircle, LogOut, MapPin, Settings, Share2, Star, Trash2, User, Wallet } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { Alert, Dimensions, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { shareReferral } from '@/utils/referral';
import { profileService, walletService } from '@/services/api';

const ProfileScreen = () => {
  const headerTopPad = useTabScrollContentPaddingTop(16);
  const scrollBodyTopPad = useTabScrollContentPaddingTop(20);
  const router = useRouter();
  const { logout, switchRole } = useAuthRole();
  const { location } = useUserLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    location: location || '',
    rating: 0,
    reviews: 0,
    balance: 0,
    referralCode: 'SARAH2024',
  });

  // Load wallet balance
  const loadWalletBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const wallet = await walletService.getWallet();
      const balanceValue = typeof wallet.balance === 'number' 
        ? wallet.balance 
        : parseFloat(String(wallet.balance)) || 0;
      
      setUserData(prev => ({
        ...prev,
        balance: balanceValue,
      }));
    } catch {
      // Keep current balance on error
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Load user profile from API
  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load profile and wallet balance in parallel
      await Promise.all([
        (async () => {
          try {
            const profile = await profileService.getCurrentUserProfile();
            
            // Extract user data from API response
            const firstName = profile?.firstName || profile?.data?.firstName || '';
            const lastName = profile?.lastName || profile?.data?.lastName || '';
            const fullName = firstName && lastName 
              ? `${firstName} ${lastName}`.trim()
              : firstName || lastName || 'User';
            
            setUserData(prev => ({
              ...prev,
              name: fullName,
              location: location || prev.location,
            }));
          } catch {
            // Profile optional; keep cached UI
          }
        })(),
        loadWalletBalance(), // Also load wallet balance
      ]);
    } catch {
      // Still try to load wallet balance even if profile fails
      await loadWalletBalance();
    } finally {
      setIsLoading(false);
    }
  }, [location, loadWalletBalance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  }, [loadUserProfile]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  const handleOptionPress = (id: string) => {
    if (id === 'account') {
      router.push('../AccountInformationScreen' as any);
    } else if (id === 'billing') {
      router.push('../PaymentMethodsScreen' as any);
    } else if (id === 'support') {
      router.push('../HelpSupportScreen' as any);
    }
  };

  const handleViewWallet = () => {
    router.push('../WalletScreen' as any);
  };

  const handleShareReferral = async () => {
    await shareReferral({ role: 'client', code: userData.referralCode });
  };

  const handleSignOut = async () => {
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
            // Handle account deletion
            Alert.alert('Account Deletion', 'Account deletion feature coming soon.');
          },
        },
      ]
    );
  };

  const handleBecomeProvider = () => {
    Alert.alert(
      'Switch to Provider',
      'Switch to provider mode for demo and testing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await switchRole('provider');
            } catch (error) {
              Alert.alert('Error', 'Failed to switch role. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight} tabletShellTop>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: headerTopPad,
          paddingBottom: 16,
          backgroundColor: Colors.backgroundLight,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <TouchableOpacity
            onPress={() => router.push('../SettingsScreen' as any)}
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
            <Settings size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <TouchableOpacity
            onPress={() => router.push('../NotificationsScreen' as any)}
            style={{ position: 'relative', padding: 4, borderRadius: 20, backgroundColor: Colors.white }}
            activeOpacity={0.7}
          >
            <Bell size={22} color={Colors.textPrimary} />
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: Colors.accent,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={REFRESH_CONTROL.tintColor}
            colors={REFRESH_CONTROL.colors as unknown as string[]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* User Profile Section */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: scrollBodyTopPad,
            marginBottom: 24,
            backgroundColor: '#0a0a0a',
            borderRadius: 26,
            padding: 18,
            overflow: 'hidden',
            shadowColor: '#101828',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -54,
              right: -54,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: Colors.accent,
              opacity: 0.14,
            }}
          />
          {/* Profile Picture */}
          <View style={{ marginRight: 16 }}>
            <Image
              source={require('../../assets/images/userimg.jpg')}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.18)',
              }}
              resizeMode="cover"
            />
          </View>

          {/* User Info */}
          <View style={{ flex: 1 }}>
            {/* Name */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                    marginRight: 8,
                    letterSpacing: -0.4,
                  }}
                  numberOfLines={1}
                >
                  {userData.name}
                </Text>
              )}
            </View>

            {/* Location */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <MapPin size={14} color="rgba(255,255,255,0.62)" />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: 'rgba(255,255,255,0.68)',
                  marginLeft: 4,
                }}
              >
                {userData.location}
              </Text>
            </View>

            {/* Rating */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Star size={14} color={Colors.accent} fill={Colors.accent} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.white,
                  marginLeft: 4,
                }}
              >
                {userData.rating}
              </Text>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                  marginHorizontal: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: 'rgba(255,255,255,0.68)',
                }}
              >
                {userData.reviews} reviews
              </Text>
            </View>
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 12,
            }}
          >
            Account settings
          </Text>
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(17, 24, 39, 0.08)',
              overflow: 'hidden',
              shadowColor: '#101828',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.035,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            {accountSettings.map((setting, index) => {
              const IconComponent = setting.icon;
              return (
                <TouchableOpacity
                  key={setting.id}
                  onPress={() => handleOptionPress(setting.id)}
                  style={{
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: index === accountSettings.length - 1 ? 0 : 1,
                    borderBottomColor: 'rgba(17, 24, 39, 0.06)',
                  }}
                  activeOpacity={0.7}
                >
                <View 
                  style={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: setting.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <IconComponent size={20} color={setting.color} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text 
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {setting.title}
                  </Text>
                  <Text 
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {setting.subtitle}
                  </Text>
                </View>

                <ChevronRight size={18} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Current Balance Section */}
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View
            style={{
              position: 'absolute',
              bottom: -48,
              right: -48,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: Colors.accent,
              opacity: 0.13,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.white,
                  opacity: 0.95,
                  marginBottom: 8,
                }}
              >
                Current balance
              </Text>
              {isLoadingBalance ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontSize: Math.min(36, Dimensions.get('window').width * 0.09),
                      fontFamily: 'Poppins-Bold',
                      color: Colors.white,
                      opacity: 0.7,
                    }}
                  >
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: Math.min(36, Dimensions.get('window').width * 0.09),
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                  }}
                >
                  ₦{userData.balance.toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
            </View>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: 'rgba(202,255,51,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(202,255,51,0.28)',
              }}
            >
              <Wallet size={24} color={Colors.accent} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleViewWallet}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginRight: 6,
              }}
            >
              View Wallet
            </Text>
            <ArrowRight size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Refer Friends Section */}
        <View style={{ marginBottom: 24 }}>
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
          Get rewards for each referral
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: Colors.white,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(17, 24, 39, 0.08)',
              shadowColor: '#101828',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.035,
              shadowRadius: 10,
              elevation: 2,
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
                {userData.referralCode}
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
          <TouchableOpacity
            onPress={handleBecomeProvider}
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
              Switch to provider mode
            </Text>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E7EBDf',
              overflow: 'hidden',
              shadowColor: '#111827',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.04,
              shadowRadius: 18,
              elevation: 2,
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
                  Permanently remove your profile and data.
                </Text>
              </View>
              <ChevronRight size={21} color="rgba(180, 35, 24, 0.35)" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const accountSettings = [
  {
    id: 'account',
    title: 'Account & Preferences',
    subtitle: 'Personal info, notifications, and privacy',
    icon: User,
    bg: '#F2F8EA',
    color: Colors.accent,
  },
  {
    id: 'billing',
    title: 'Billing and payment',
    subtitle: 'Payment methods and billing history',
    icon: CreditCard,
    bg: '#F7F8FA',
    color: Colors.textPrimary,
  },
  {
    id: 'support',
    title: 'Support & Information',
    subtitle: 'Help center, safety, and app information',
    icon: HelpCircle,
    bg: '#FFF7DF',
    color: '#92400E',
  },
];

export default ProfileScreen;
