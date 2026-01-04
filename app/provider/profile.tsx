import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Copy,
  Edit,
  Image as ImageIcon,
  Plus,
  Share2,
  Star,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

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
          onPress: () => {
            // Handle sign out
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
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Marcus Johnson
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                  marginBottom: 6,
                }}
              >
                Professional Electrician
              </Text>
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
              {['Installation', 'Plumbing', 'Electrician'].map((service, index) => (
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
                    {service}
                  </Text>
                </View>
              ))}
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
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
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
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: BorderRadius.default,
                    backgroundColor: Colors.backgroundGray,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
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
                  fontSize: 32,
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
              backgroundColor: Colors.backgroundGray,
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
                Refer Friends
              </Text>
              <TouchableOpacity
                onPress={handleShareReferral}
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
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
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginBottom: 12,
              }}
            >
              Get 2% off platform fees
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Share2 size={16} color={Colors.textSecondaryDark} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textPrimary,
                  flex: 1,
                }}
              >
                https://www.ghandsdummylink.com/chima
              </Text>
              <TouchableOpacity
                onPress={handleCopyLink}
                style={{
                  backgroundColor: Colors.black,
                  borderRadius: BorderRadius.default,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  Copy link
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                backgroundColor: Colors.error,
                borderRadius: BorderRadius.xl,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              activeOpacity={0.8}
            >
              <ArrowRight size={18} color={Colors.white} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.white,
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color={Colors.error} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.error,
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
