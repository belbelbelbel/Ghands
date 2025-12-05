import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Bell, BookOpen, Camera, ChevronRight, FileText, HelpCircle, LogOut, MapPin, Trash2, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../../hooks/useAuth';

const ProfileScreen = () => {
  const router = useRouter();
  const { logout } = useAuthRole();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
    transform: [{ translateY: slideAnim }]
  };

  const handleOptionPress = (id: string) => {
    if (id === '1') {
      router.push('../AccountInformationScreen' as any);
    } else if (id === '2') {
      router.push('../PaymentMethodsScreen' as any);
    } else if (id === '4') {
      router.push('../HelpSupportScreen' as any);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.borderLight}>
      <Animated.View style={[animatedStyles, { flex: 1, paddingTop: Spacing.xl }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: Spacing.huge }}
          style={{ flex: 1, marginHorizontal: Spacing.sm + 1 }}
        >
          <View style={{
            backgroundColor: Colors.accent,
            borderRadius: BorderRadius.xl + 4,
            paddingHorizontal: Spacing.lg + 2,
            paddingTop: Spacing.xxxl,
            paddingBottom: Spacing.lg,
            marginBottom: Spacing.lg + 2,
          }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xs + 4 }}>
              <View style={{ position: 'relative' }}>
                <View style={{
                  width: 128,
                  height: 128,
                  backgroundColor: Colors.border,
                  borderRadius: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: Colors.white,
                }}>
                  <User size={60} color={Colors.accent} />
                </View>
                <TouchableOpacity style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: Colors.white,
                  borderRadius: 16,
                  padding: Spacing.xs + 2,
                }}>
                  <Camera size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ alignItems: 'center', marginBottom: Spacing.lg + 2 }}>
              <Text 
                style={{
                  ...Fonts.h1,
                  fontSize: 28,
                  color: Colors.white,
                  marginBottom: Spacing.xs + 2,
                }}
              >
                Sarah Johnson
              </Text>
              <Text 
                style={{
                  ...Fonts.body,
                  color: Colors.white,
                  opacity: 0.9,
                }}
              >
                Individual Client
              </Text>
            </View>

            <TouchableOpacity style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg + 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text 
                style={{
                  ...Fonts.button,
                  fontSize: 16,
                  color: Colors.textPrimary,
                  marginRight: Spacing.xs + 2,
                }}
              >
                View Job History
              </Text>
              <ChevronRight size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: Spacing.xs + 4, marginBottom: Spacing.lg + 2 }}>
            {profileOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleOptionPress(option.id)}
                  style={{
                    backgroundColor: Colors.backgroundLight,
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.xs + 4,
                    paddingVertical: Spacing.lg + 2,
                    marginBottom: Spacing.sm + 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <View 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 22, 
                      backgroundColor: option.iconColor === Colors.accent ? '#EEFFD9' : Colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: Spacing.lg,
                    }}
                  >
                    <IconComponent size={22} color={option.iconColor} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text 
                      style={{
                        ...Fonts.body,
                        fontFamily: 'Poppins-Bold',
                        color: Colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {option.title}
                    </Text>
                    <Text 
                      style={{
                        ...Fonts.bodySmall,
                        color: option.subtitle.includes('Identity Verified') ? Colors.accent : Colors.textSecondaryDark,
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      {option.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={24} color={Colors.textSecondaryDark} />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ paddingHorizontal: Spacing.xs + 4, marginBottom: Spacing.lg + 2 }}>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.errorLight,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.xs + 4,
                paddingVertical: Spacing.md,
                marginBottom: Spacing.sm + 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.errorBorder,
              }}
              onPress={async () => {
                await logout();
                router.replace('/onboarding');
              }}
              activeOpacity={0.8}
            >
              <LogOut size={20} color={Colors.error} />
              <Text 
                style={{
                  ...Fonts.body,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.error,
                  marginLeft: Spacing.xs + 2,
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              backgroundColor: Colors.backgroundLight,
              borderRadius: BorderRadius.lg,
              paddingHorizontal: Spacing.xs + 4,
              paddingVertical: Spacing.xs + 4,
              marginBottom: Spacing.sm + 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}>
              <Trash2 size={20} color={Colors.textSecondaryDark} />
              <Text 
                style={{
                  ...Fonts.body,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textSecondaryDark,
                  marginLeft: Spacing.xs + 2,
                }}
              >
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
};

const profileOptions = [
  {
    id: '1',
    title: 'Account Information',
    subtitle: 'Personal, Address, Status',
    icon: User,
    iconColor: '#666'
  },
  {
    id: '2',
    title: 'Payment Information',
    subtitle: 'Billing, Payment',
    icon: MapPin,
    iconColor: '#666'
  },
  {
    id: '3',
    title: 'Notification',
    subtitle: 'Notification settings',
    icon: Bell,
    iconColor: '#666'
  },
  {
    id: '4',
    title: 'Help & Support',
    subtitle: 'Identity Verified',
    icon: HelpCircle,
    iconColor: '#666'
  },
  {
    id: '5',
    title: 'Legal & About',
    subtitle: 'Identity Verified',
    icon: FileText,
    iconColor: '#666'
  },
  {
    id: '6',
    title: 'Userguide',
    subtitle: 'Identity Verified',
    icon: BookOpen,
    iconColor: '#666'
  }
];

export default ProfileScreen;
