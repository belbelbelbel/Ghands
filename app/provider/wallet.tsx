import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Transaction {
  id: string;
  label: string;
  amount: string;
  time: string;
  type: 'credit' | 'debit';
}

const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    label: 'Payment received - Plumbing Service',
    amount: '+₦150.00',
    time: '2 hours ago',
    type: 'credit',
  },
  {
    id: '2',
    label: 'Payment received - Electrical Repair',
    amount: '+₦85.00',
    time: '1 day ago',
    type: 'credit',
  },
  {
    id: '3',
    label: 'Withdrawal to bank account',
    amount: '-₦200.00',
    time: '3 days ago',
    type: 'debit',
  },
  {
    id: '4',
    label: 'Payment received - AC Servicing',
    amount: '+₦120.00',
    time: '5 days ago',
    type: 'credit',
  },
];

export default function ProviderWalletScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
            flex: 1,
            textAlign: 'center',
          }}
        >
          Wallet
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Balance Card */}
        <View
          style={{
            backgroundColor: Colors.accent,
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Medium',
              color: Colors.white,
              opacity: 0.9,
              marginBottom: 8,
            }}
          >
            Available Balance
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontFamily: 'Poppins-Bold',
              color: Colors.white,
              marginBottom: 12,
            }}
          >
            ₦1,250.00
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TrendingUp size={16} color={Colors.white} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.white,
                marginLeft: 6,
              }}
            >
              +₦235 this month
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
              }}
            >
              Withdraw
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.lg,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
              }}
            >
              Add Payment Method
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Recent activity
          </Text>
          {TRANSACTIONS.map((tx) => (
            <View
              key={tx.id}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.lg,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                {tx.label}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: tx.type === 'credit' ? Colors.accent : '#DC2626',
                  marginBottom: 8,
                }}
              >
                {tx.amount}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Regular',
                  color: Colors.textSecondaryDark,
                }}
              >
                {tx.time}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
