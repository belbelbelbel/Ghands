import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Check, Clock, Receipt, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { walletService } from '@/services/api';
import { useFocusEffect } from 'expo-router';

interface ActivityItem {
  id: string;
  serviceName: string;
  serviceType: string;
  date: string;
  time: string;
  amount: string;
  status: 'pending' | 'completed';
}

export default function ProviderWalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(true);

  // Helper function to format date
  const formatDate = useCallback((dateString: string): { date: string; time: string } => {
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: 'N/A', time: 'N/A' };
    }
  }, []);

  // Helper function to map API transaction to UI activity
  const mapTransactionToActivity = useCallback((apiTransaction: any): ActivityItem | null => {
    try {
      // Extract service name from description or use default
      let serviceName = 'Service Payment';
      let serviceType = apiTransaction.description || 'Wallet transaction';
      
      // Try to extract service name from description
      if (apiTransaction.description) {
        const desc = apiTransaction.description.toLowerCase();
        if (desc.includes('earnings')) {
          serviceName = 'Earnings';
          serviceType = 'Payment received for completed service';
        } else if (desc.includes('withdrawal')) {
          serviceName = 'Withdrawal';
          serviceType = 'Funds withdrawn to bank';
        } else if (desc.includes('service request')) {
          serviceName = `Service Request #${apiTransaction.requestId || 'N/A'}`;
          serviceType = apiTransaction.description;
        } else if (desc.includes('deposit')) {
          serviceName = 'Deposit';
          serviceType = 'Funds added to wallet';
        } else if (desc.includes('refund')) {
          serviceName = 'Refund';
          serviceType = apiTransaction.description;
        }
      }

      const { date, time } = formatDate(apiTransaction.createdAt || apiTransaction.completedAt || new Date().toISOString());
      
      return {
        id: String(apiTransaction.id || apiTransaction.reference || Math.random()),
        serviceName,
        serviceType,
        date,
        time,
        amount: `₦${Math.abs(apiTransaction.amount || 0).toLocaleString('en-NG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        status: apiTransaction.status === 'completed' ? 'completed' : 'pending',
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error mapping transaction:', error);
      }
      return null;
    }
  }, [formatDate]);

  // Load activities
  const loadActivities = useCallback(async () => {
    try {
      setIsLoadingActivities(true);
      const result = await walletService.getTransactions({ limit: 10, offset: 0 });
      const mappedActivities = result.transactions
        .map(mapTransactionToActivity)
        .filter((a): a is ActivityItem => a !== null);
      setActivities(mappedActivities);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading activities:', error);
      }
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [mapTransactionToActivity]);

  // Load wallet balance
  const loadWalletBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const wallet = await walletService.getWallet();
      const balanceValue = typeof wallet.balance === 'number' 
        ? wallet.balance 
        : parseFloat(String(wallet.balance)) || 0;
      setBalance(balanceValue);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      // Keep current balance on error
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Load balance and activities on mount
  useEffect(() => {
    loadWalletBalance();
    loadActivities();
  }, [loadWalletBalance, loadActivities]);

  // Refresh balance and activities when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWalletBalance();
      loadActivities();
    }, [loadWalletBalance, loadActivities])
  );

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
          {isLoadingBalance ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                  opacity: 0.7,
                }}
              >
                Loading...
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins-Bold',
                color: Colors.white,
                marginBottom: 16,
              }}
            >
              ₦{balance.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          )}

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
            onPress={() => router.push('/ProviderLinkBankAccountScreen' as any)}
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
        {isLoadingActivities ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{ marginTop: 16, fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark }}>
              Loading activities...
            </Text>
          </View>
        ) : activities.length === 0 ? (
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Receipt size={48} color={Colors.textSecondaryDark} style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              No activities yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
              }}
            >
              Your recent wallet activity will appear here
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
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
          ))
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
