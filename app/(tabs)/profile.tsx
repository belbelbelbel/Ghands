import SafeAreaWrapper from '@/components/SafeAreaWrapper';
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
    <SafeAreaWrapper backgroundColor="#F9FAFB">
      <Animated.View style={[animatedStyles, { flex: 1, paddingTop: 20 }]}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mx-3">
          {/* Profile Banner */}
          <View className="bg-[#8BC34A] rounded-3xl px-6 py-8 pt-12 mb-6">
            {/* Profile Picture */}
            <View className="items-center mb-4">
              <View className="relative">
                <View className="w-32 h-32 bg-gray-200 rounded-full items-center justify-center border-4 border-white">
                  <User size={60} color="#6A9B00" />
                </View>
                <TouchableOpacity className="absolute bottom-0 right-0 bg-white rounded-full p-2">
                  <Camera size={20} color="#6A9B00" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Info */}
            <View className="items-center mb-6">
              <Text 
                className="text-3xl font-bold text-white mb-2" 
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Sarah Johnson
              </Text>
              <Text 
                className="text-base text-white/90" 
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Individual Client
              </Text>
            </View>

            {/* View Job History Button */}
            <TouchableOpacity className="bg-white rounded-xl py-4 px-6 flex-row items-center justify-center">
              <Text 
                className="text-black text-lg font-semibold mr-2" 
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                View Job History
              </Text>
              <ChevronRight size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Profile Options */}
          <View className="px-4 mb-6">
            {profileOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleOptionPress(option.id)}
                  className="bg-white rounded-2xl px-4 py-6 mb-3 flex-row items-center border-gray-200 border-[1px]"
                  activeOpacity={0.7}
                >
                  <View 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 22, 
                      backgroundColor: option.iconColor === '#6A9B00' ? '#EEFFD9' : '#F5F5F5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16
                    }}
                  >
                    <IconComponent size={22} color={option.iconColor} />
                  </View>
                  
                  <View className="flex-1">
                    <Text 
                      className="text-base font-bold text-black mb-1" 
                      style={{ fontFamily: 'Poppins-Bold' }}
                    >
                      {option.title}
                    </Text>
                    <Text 
                      className={`text-sm ${option.subtitle.includes('Identity Verified') ? 'text-[#6A9B00]' : 'text-gray-500'}`} 
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {option.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={24} color="#666" />
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="px-4 mb-6">
            <TouchableOpacity
              className="bg-red-50 rounded-2xl px-4 py-4 mb-3 flex-row items-center justify-center border border-red-200"
              onPress={async () => {
                await logout();
                router.replace('/onboarding');
              }}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#EF4444" />
              <Text 
                className="text-red-600 text-base font-semibold ml-2" 
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center justify-center border border-gray-200">
              <Trash2 size={20} color="#666" />
              <Text 
                className="text-gray-600 text-base font-semibold ml-2" 
                style={{ fontFamily: 'Poppins-SemiBold' }}
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
