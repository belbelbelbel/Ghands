import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Button } from '@/components/ui/Button';
import { useAuthRole } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, ChevronRight, CreditCard, HelpCircle, MapPin, Share2, Star, Trash2, User, Wallet } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = () => {
  const router = useRouter();
  const { logout } = useAuthRole();
  const { location } = useUserLocation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Mock user data - in production, fetch from API
  const [userData] = useState({
    name: 'Marcus Johnson',
    isVerified: true,
    location: location || 'New York, NY',
    rating: 4.8,
    reviews: 24,
    balance: 12847.50,
    referralCode: 'SARAH2024',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyles = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const handleOptionPress = (id: string) => {
    if (id === 'account') {
      router.push('../AccountInformationScreen' as any);
    } else if (id === 'billing') {
      router.push('../PaymentHistoryScreen' as any);
    } else if (id === 'support') {
      router.push('../HelpSupportScreen' as any);
    }
  };

  const handleViewWallet = () => {
    router.push('../WalletScreen' as any);
  };

  const handleShareReferral = async () => {
    try {
      const message = `Join GHands using my referral code ${userData.referralCode} and get $10!`;
      await Share.share({
        message,
        title: 'Refer GHands',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral code');
    }
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
            await logout();
            router.replace('/onboarding');
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

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <Animated.View style={[animatedStyles, { flex: 1 }]}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
            backgroundColor: Colors.backgroundLight,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
              textAlign: 'center',
            }}
          >
            Profile
          </Text>
          <TouchableOpacity
            onPress={() => router.push('../NotificationsScreen' as any)}
            style={{ position: 'relative' }}
            activeOpacity={0.7}
          >
            <Bell size={24} color={Colors.textPrimary} />
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
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
            paddingBottom: 100,
          }}
        >
          {/* User Profile Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              paddingVertical: 0,
              paddingHorizontal: 10,
              marginTop: 24,
              marginBottom: 32,
              borderWidth: 0,
              borderColor: Colors.border,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            {/* Profile Picture */}
            <View style={{ position: 'relative', marginRight: 16 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: Colors.backgroundGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={40} color={Colors.accent} />
              </View>
            </View>

            {/* User Info */}
            <View style={{ flex: 1, paddingTop: 4 }}>
              {/* Name with Verified Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginRight: 6,
                  }}
                >
                  {userData.name}
              </Text>
                {userData.isVerified && (
                  <View
                    style={{
                      backgroundColor: Colors.accent,
                      paddingHorizontal: 6 ,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
              <Text 
                      style={{
                        fontSize: 10,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.white,
                      }}
                    >
                      Verified
                    </Text>
                  </View>
                )}
              </View>

              {/* Location */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <MapPin size={14} color={Colors.textSecondaryDark} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
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
                <Star size={14} color="#FACC15" fill="#FACC15" />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: '#FACC15',
                    marginLeft: 4,
                  }}
                >
                  {userData.rating}
                </Text>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: Colors.textSecondaryDark,
                    marginHorizontal: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
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
                marginBottom: 16,
              }}
            >
              Account Settings
            </Text>

            {accountSettings.map((setting) => {
              const IconComponent = setting.icon;
              return (
                <TouchableOpacity
                  key={setting.id}
                  onPress={() => handleOptionPress(setting.id)}
                  style={{
                    backgroundColor: Colors.backgroundLight,
                    borderRadius: BorderRadius.lg,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <View 
                    style={{ 
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: setting.iconBgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <IconComponent size={24} color={setting.iconColor} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text 
                      style={{
                        fontSize: 16,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {setting.title}
                    </Text>
                    <Text 
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textSecondaryDark,
                      }}
                    >
                      {setting.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={20} color={Colors.textSecondaryDark} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Current Balance Section */}
          <View
            style={{
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.lg,
              padding: 20,
              marginBottom: 24,
              position: 'relative',
            }}
          >
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
                    fontSize: 14,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.white,
                    opacity: 0.9,
                    marginBottom: 8,
                  }}
                >
                  Current balance
                </Text>
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                  }}
                >
                  ₦{userData.balance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <Wallet size={32} color={Colors.white} opacity={0.3} />
            </View>

            <Button
              title="View Wallet"
              onPress={handleViewWallet}
              variant="secondary"
              size="medium"
              fullWidth
              icon={<ArrowRight size={18} color={Colors.white} />}
              iconPosition="right"
              style={{
                backgroundColor: Colors.black,
              }}
            />
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
                marginBottom: 8,
              }}
            >
              Refer Friends
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
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
                backgroundColor: Colors.backgroundLight,
                borderRadius: BorderRadius.default,
                padding: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textPrimary,
                }}
              >
                Your code:{' '}
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  {userData.referralCode}
                </Text>
              </Text>
              <Button
                title="Share"
                onPress={handleShareReferral}
                variant="primary"
                size="small"
                icon={<Share2 size={16} color={Colors.white} />}
                iconPosition="left"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                backgroundColor: Colors.backgroundLight,
                borderRadius: BorderRadius.default,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
              }}
              activeOpacity={0.7}
            >
              <ArrowRight size={20} color="#DC2626" />
              <Text 
                style={{
                  fontSize: 16,
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
              backgroundColor: Colors.backgroundLight,
                borderRadius: BorderRadius.default,
                padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={Colors.textPrimary} />
              <Text 
                style={{
                  fontSize: 16,
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
      </Animated.View>
    </SafeAreaWrapper>
  );
};

const accountSettings = [
  {
    id: 'account',
    title: 'Account & Preferences',
    subtitle: 'Personal info, Notification',
    icon: User,
    iconColor: '#666666',
    iconBgColor: '#F5F5F5',
  },
  {
    id: 'billing',
    title: 'Billing and payment',
    subtitle: 'Transaction history, payment methods',
    icon: CreditCard,
    iconColor: '#2563EB',
    iconBgColor: '#EEF1FF',
  },
  {
    id: 'support',
    title: 'Support & Information',
    subtitle: 'Manage preferences',
    icon: HelpCircle,
    iconColor: '#2563EB',
    iconBgColor: '#EEF1FF',
  },
];

export default ProfileScreen;
