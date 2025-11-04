import { useRouter } from 'expo-router';
import { ChevronRight, MapPin, User } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const paymentCards = [
  {
    id: '1',
    title: 'Billing History',
    subtitle: 'View invoices and receipts',
    icon: User,
    iconColor: '#666',
    iconBgColor: '#F5F5F5',
    onPress: () => {} // Will handle navigation
  },
  {
    id: '2',
    title: 'Payment History',
    subtitle: 'Transaction records and receipts',
    icon: MapPin,
    iconColor: '#6A9B00',
    iconBgColor: '#EEFFD9',
    onPress: () => {} // Will handle navigation
  }
];

export default function PaymentHistoryScreen() {
  const router = useRouter();

  const handleNavigation = (id: string) => {
    if (id === '1') {
      // Handle billing history navigation
      console.log('Billing History pressed');
    } else if (id === '2') {
      // Handle payment history navigation
      console.log('Payment History pressed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
          Payment History
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-6">
          {paymentCards.map((card) => {
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
                    borderRadius: 12, 
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
                    className="text-sm text-gray-500" 
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
