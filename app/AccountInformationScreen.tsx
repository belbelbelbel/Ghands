import { useRouter } from 'expo-router';
import { ChevronRight, HelpCircle, MapPin, User } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const accountCards = [
  {
    id: '1',
    title: 'Personal Details',
    subtitle: 'Name, email, phone number',
    icon: User,
    iconColor: '#666',
    iconBgColor: '#F5F5F5',
    onPress: () => {} // Will handle navigation
  },
  {
    id: '2',
    title: 'Address Book',
    subtitle: 'Manage your saved addresses',
    icon: MapPin,
    iconColor: '#6A9B00',
    iconBgColor: '#EEFFD9',
    onPress: () => {} // Will handle navigation
  },
  {
    id: '3',
    title: 'Verification Status',
    subtitle: 'Identity Verified',
    icon: HelpCircle,
    iconColor: '#6A9B00',
    iconBgColor: '#EEFFD9',
    onPress: () => {} // Will handle navigation
  }
];

export default function AccountInformationScreen() {
  const router = useRouter();

  const handleNavigation = (id: string) => {
    if (id === '1') {
      router.push('/EditProfileScreen' as any);
    } else if (id === '2') {
      router.push('/PaymentHistoryScreen' as any);
    } else if (id === '3') {
      // Handle verification status navigation
      console.log('Verification Status pressed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />

      {/* Header */}
      <View className='flex-row items-center px-4 py-4 bg-white border-b border-gray-100'>
        <TouchableOpacity onPress={() => router.back()}>
          <View className='w-8 h-8 items-center justify-center'>
            <Text className='text-black text-2xl'>←</Text>
          </View>
        </TouchableOpacity>
        <Text 
          className='text-xl font-bold text-black flex-1 text-center mr-8' 
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Account Information
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-6">
          {accountCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleNavigation(card.id)}
                className="bg-white rounded-2xl px-4 py-5 mb-4 flex-row items-center  border border-gray-200"
                activeOpacity={0.7}
              >
                <View 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: card.iconBgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}
                >
                  <IconComponent size={24} color={card.iconColor} />
                </View>
                
                <View className="flex-1">
                  <Text 
                    className="text-base font-bold text-black mb-1" 
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {card.title}
                  </Text>
                  <Text 
                    className={`text-sm ${card.id === '3' ? 'text-[#6A9B00]' : 'text-gray-500'}`} 
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {card.subtitle}
                  </Text>
                </View>

                <ChevronRight size={24} color="#666" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
