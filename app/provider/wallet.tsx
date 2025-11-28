import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const TRANSACTIONS = [
  { id: 'tx-1', label: 'Job payout · Plumbing', amount: '+₦18,500', time: 'Today · 12:40 PM' },
  { id: 'tx-2', label: 'Withdrawal to bank', amount: '-₦30,000', time: 'Yesterday · 5:05 PM' },
  { id: 'tx-3', label: 'Job payout · Cleaning', amount: '+₦8,200', time: 'Mon · 10:15 AM' },
];

export default function ProviderWalletScreen() {
  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 17,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Poppins-Bold',
            color: '#000000',
            marginBottom: 12,
          }}
        >
          Wallet
        </Text>

        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#000000',
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#F9FAFB', fontFamily: 'Poppins-Regular', fontSize: 12 }}>Available balance</Text>
          <Text style={{ color: '#6A9B00', fontFamily: 'Poppins-Bold', fontSize: 28, marginVertical: 8 }}>
            ₦142,300
          </Text>
          <Text style={{ color: '#999999', fontFamily: 'Poppins-Medium', fontSize: 12 }}>
            Next payout · Sep 28, 10:00 AM
          </Text>
        </View>

        <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#000000', marginBottom: 10 }}>
          Recent activity
        </Text>
        {TRANSACTIONS.map((tx) => (
          <View
            key={tx.id}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#fff',
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#000000' }}>{tx.label}</Text>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#000000', marginVertical: 4 }}>
              {tx.amount}
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#666666' }}>{tx.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
