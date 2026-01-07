import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Check, Clock, Receipt, TrendingUp, Wallet } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ActivityItem {
  id: string;
  serviceName: string;
  serviceType: string;
  date: string;
  time: string;
  amount: string;
  status: 'pending' | 'completed';
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    serviceName: 'Elite Plumbing Services',
    serviceType: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: '₦485.00',
    status: 'pending',
  },
  {
    id: '2',
    serviceName: 'Elite Plumbing Services',
    serviceType: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: '₦485.00',
    status: 'completed',
  },
  {
    id: '3',
    serviceName: 'Elite Plumbing Services',
    serviceType: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: '₦485.00',
    status: 'completed',
  },
];

export default function ProviderWalletScreen() {
  const router = useRouter();

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
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins-Bold',
              color: Colors.textSecondaryDark,
            }}
          >
            JD
          </Text>
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
          Wallet
        </Text>
        <View style={{ position: 'relative', width: 40, alignItems: 'flex-end' }}>
          <Bell size={24} color={Colors.textPrimary} />
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: Colors.accent,
            }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Wallet Balance Card */}
        <View
          style={{
            backgroundColor: 'rgba(18, 18, 18, 1)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Wallet Icon */}
          <View
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={24} color={Colors.white} />
          </View>

          {/* Wallet ID */}
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins-Regular',
              color: Colors.white,
              opacity: 0.7,
              marginBottom: 8,
            }}
          >
            Id: GH-WLT-92837451
          </Text>

          {/* Current Balance */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.white,
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Current balance
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'Poppins-Bold',
              color: Colors.white,
              marginBottom: 16,
            }}
          >
            ₦12,847.50
          </Text>

          {/* Pending Earnings */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-Regular',
              color: Colors.white,
              opacity: 0.8,
            }}
          >
            Pending Earnings (Escrow): ₦4,200.00
          </Text>
        </View>

        {/* Action Buttons */}
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
              backgroundColor: Colors.accent,
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <TrendingUp size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
              }}
            >
              Withdraw
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(18, 18, 18, 1)',
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
            onPress={() => router.push('/ProviderActivityScreen' as any)}
          >
            <Clock size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
              }}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
            }}
          >
            Recent Activity
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/ProviderActivityScreen' as any)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.accent,
                marginRight: 4,
              }}
            >
              View all
            </Text>
            <ArrowRight size={16} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Activity Cards */}
        {ACTIVITIES.map((activity) => (
          <View
            key={activity.id}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 10,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              {/* Icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F5F5F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Check size={20} color={Colors.textSecondaryDark} />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {activity.serviceName}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                    marginBottom: 8,
                  }}
                >
                  {activity.serviceType}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.textSecondaryDark,
                  }}
                >
                  {activity.date} · {activity.time}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: activity.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-SemiBold',
                    color: activity.status === 'pending' ? '#D97706' : '#059669',
                  }}
                >
                  {activity.status === 'pending' ? 'Pending' : 'Completed'}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                marginBottom: 12,
                marginLeft: 52,
              }}
            >
              {activity.amount}
            </Text>

            {/* Action Button */}
            {activity.status === 'pending' ? (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/PaymentPendingScreen' as any)}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.white,
                  }}
                >
                  View details
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: Colors.accent,
                  flexDirection: 'row',
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/ProviderReceiptScreen' as any)}
              >
                <Receipt size={16} color={Colors.accent} style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: Colors.accent,
                  }}
                >
                  View Receipt
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
