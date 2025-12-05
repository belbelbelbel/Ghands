import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const TRANSACTIONS = [
  { id: 'tx-1', label: 'Job payout · Plumbing', amount: '+₦18,500', time: 'Today · 12:40 PM' },
  { id: 'tx-2', label: 'Withdrawal to bank', amount: '-₦30,000', time: 'Yesterday · 5:05 PM' },
  { id: 'tx-3', label: 'Job payout · Cleaning', amount: '+₦8,200', time: 'Mon · 10:15 AM' },
];

export default function ProviderWalletScreen() {
  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <ScrollView
        contentContainerStyle={{
          ...CommonStyles.container,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ ...Fonts.h2, color: Colors.textPrimary, marginBottom: Spacing.md }}>
          Wallet
        </Text>

        <View
          style={{
            borderRadius: BorderRadius.lg,
            backgroundColor: Colors.black,
            padding: Spacing.xl,
            marginBottom: Spacing.xl,
          }}
        >
          <Text style={{ ...Fonts.bodySmall, color: Colors.softWarm }}>Available balance</Text>
          <Text style={{ ...Fonts.h1, fontSize: 28, color: Colors.accent, marginVertical: Spacing.sm }}>
            ₦142,300
          </Text>
          <Text style={{ ...Fonts.bodySmall, color: Colors.textTertiary, fontFamily: 'Poppins-Medium' }}>
            Next payout · Sep 28, 10:00 AM
          </Text>
        </View>

        <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: Spacing.sm + 2 }}>
          Recent activity
        </Text>
        {TRANSACTIONS.map((tx) => (
          <View
            key={tx.id}
            style={CommonStyles.card}
          >
            <Text style={{ ...Fonts.bodyMedium, fontSize: 13, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>{tx.label}</Text>
            <Text style={{ ...Fonts.bodyMedium, fontSize: 14, color: Colors.textPrimary, marginVertical: Spacing.xs }}>
              {tx.amount}
            </Text>
            <Text style={{ ...Fonts.bodyTiny, color: Colors.textSecondaryDark }}>{tx.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
