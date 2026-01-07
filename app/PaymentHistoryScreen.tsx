import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChevronRight, MapPin, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PaymentHistoryScreen() {
  const router = useRouter();

  const handleNavigation = (id: string) => {
    const card = paymentCards.find(c => c.id === id);
    if (card) {
      card.onPress();
    }
  };

  const paymentCards = [
    {
      id: '1',
      title: 'Payment History',
      subtitle: 'View invoices and receipts',
      icon: User,
      iconColor: '#666',
      iconBgColor: '#F5F5F5',
      onPress: () => { router.push('/PaymentMethodsScreen' as any); }
    },
    {
      id: '2',
      title: 'Payment Methods',
      subtitle: 'Transaction records and receipts',
      icon: MapPin,
      iconColor: '#6A9B00',
      iconBgColor: '#EEFFD9',
      onPress: () => { router.push('/PaymentMethodsScreen' as any); }
    }
  ];

  return (
    <SafeAreaWrapper backgroundColor="#F9FAFB">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          Payment History
        </Text>
        <View style={{ width: 24 }} />
      </View>


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

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
