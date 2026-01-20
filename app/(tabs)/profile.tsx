import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { useAuthRole } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, ChevronRight, CreditCard, HelpCircle, MapPin, Settings, Share2, Star, Trash2, User, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = () => {
  const router = useRouter();
  const { logout } = useAuthRole();
  const { location } = useUserLocation();

  // Mock user data - in production, fetch from API
  const [userData] = useState({
    name: 'Marcus Johnson',
    location: location || 'New York, NY',
    rating: 4.8,
    reviews: 24,
    balance: 12847.50,
    referralCode: 'SARAH2024',
  });

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

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: Colors.white,
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
            style={{ position: 'relative', padding: 4 }}
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
            marginTop: 20,
            marginBottom: 24,
          }}
        >
          {/* Profile Picture */}
          <View style={{ marginRight: 16 }}>
            <Image
              source={require('../../assets/images/userimg.jpg')}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
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
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginRight: 8,
                }}
              >
                {userData.name}
              </Text>
            </View>

            {/* Location */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <MapPin size={14} color={Colors.textSecondaryDark} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
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
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textPrimary,
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
                  backgroundColor: Colors.textSecondaryDark,
                  marginHorizontal: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
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
              marginBottom: 12,
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
                  backgroundColor: Colors.white,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                activeOpacity={0.7}
              >
                <View 
                  style={{ 
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <IconComponent size={20} color={Colors.textSecondaryDark} />
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

        {/* Current Balance Section */}
        <View
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 12,
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
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.white,
                  opacity: 0.95,
                  marginBottom: 8,
                }}
              >
                Current balance
              </Text>
              <Text
                style={{
                  fontSize: Math.min(36, Dimensions.get('window').width * 0.09),
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
            <Wallet size={28} color={Colors.white} opacity={0.9} />
          </View>

          <TouchableOpacity
            onPress={handleViewWallet}
            style={{
              backgroundColor: Colors.black,
              borderRadius: 10,
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
                color: Colors.white,
                marginRight: 6,
              }}
            >
              View Wallet
            </Text>
            <ArrowRight size={16} color={Colors.white} />
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
                {userData.referralCode}
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
    </SafeAreaWrapper>
  );
};

const accountSettings = [
  {
    id: 'account',
    title: 'Account & Preferences',
    subtitle: 'personal info, Notification',
    icon: User,
  },
  {
    id: 'billing',
    title: 'Billing and payment',
    subtitle: 'Transaction history, payment methods',
    icon: MapPin,
  },
  {
    id: 'support',
    title: 'Support & Information',
    subtitle: 'Manage preferences',
    icon: MapPin,
  },
];

export default ProfileScreen;
