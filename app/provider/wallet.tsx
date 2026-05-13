import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, useTabScrollContentPaddingTop } from '@/lib/designSystem';
import { surfaceElevation } from '@/lib/surfaceStyles';
import { CLIENT_HOME_SCROLL_GUTTER } from '@/lib/tabletLayout';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Receipt, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { walletService } from '@/services/api';

const WALLET_CTA_BLACK = '#0A0A0A';

interface ActivityItem {
  id: string;
  requestId?: number | null;
  balanceAfter?: number | null;
  serviceName: string;
  serviceType: string;
  date: string;
  time: string;
  amount: string;
  status: 'pending' | 'completed';
}

export default function ProviderWalletScreen() {
  const router = useRouter();
  const headerTopPad = useTabScrollContentPaddingTop(16);
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(true);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState<number>(0);

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
        requestId: apiTransaction.requestId ?? apiTransaction.request_id ?? null,
        balanceAfter: typeof apiTransaction.balanceAfter === 'number'
          ? apiTransaction.balanceAfter
          : typeof apiTransaction.balance_after === 'number'
            ? apiTransaction.balance_after
            : null,
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

  // Load activities and calculate pending earnings
  const loadActivities = useCallback(async () => {
    try {
      setIsLoadingActivities(true);
      const result = await walletService.getTransactions({ limit: 50, offset: 0 }); // Get more to calculate pending
      const mappedActivities = result.transactions
        .map(mapTransactionToActivity)
        .filter((a): a is ActivityItem => a !== null);
      setActivities(mappedActivities.slice(0, 10)); // Show only first 10 in UI
      
      // Calculate pending earnings from transactions with status 'pending' and type 'earnings'
      const pendingTotal = result.transactions
        .filter((tx: any) => {
          const desc = (tx.description || '').toLowerCase();
          return tx.status === 'pending' && (
            desc.includes('earnings') || 
            desc.includes('payment') ||
            desc.includes('service request')
          );
        })
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
      
      setPendingEarnings(pendingTotal);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading activities:', error);
      }
      setActivities([]);
      setPendingEarnings(0);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [mapTransactionToActivity]);

  // Load wallet balance and ID
  const loadWalletBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const wallet = await walletService.getWallet();
      const balanceValue = typeof wallet.balance === 'number' 
        ? wallet.balance 
        : parseFloat(String(wallet.balance)) || 0;
      setBalance(balanceValue);
      setWalletId(wallet.id || null);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      // Keep current balance on error
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Load balance, activities on mount
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
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight} tabletShellTop>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
          paddingTop: headerTopPad,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
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
        <View style={{ position: 'relative', width: 44, alignItems: 'flex-end' }}>
          <TouchableOpacity
            onPress={() => router.push('/NotificationsScreen' as any)}
            style={{ padding: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Bell size={24} color={Colors.textPrimary} />
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: Colors.accent,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: CLIENT_HOME_SCROLL_GUTTER,
          paddingBottom: 100,
        }}
      >
        {/* Wallet balance — sage panel (client / app primary) */}
        <View
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 24,
            padding: 22,
            marginTop: 12,
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: Colors.sagePanelBorder,
            elevation: surfaceElevation(2),
            shadowColor: '#1a2414',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -54,
              right: -54,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: '#FFFFFF',
              opacity: 0.1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -52,
              left: -52,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: '#FFFFFF',
              opacity: 0.07,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
          >
            <Wallet size={24} color={Colors.white} />
          </View>

          {/* Wallet ID */}
          {walletId && (
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Medium',
                color: Colors.white,
                opacity: 0.62,
                marginBottom: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Wallet ID: GH-WLT-{String(walletId).padStart(8, '0')}
            </Text>
          )}

          {/* Current Balance */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins-SemiBold',
              color: Colors.white,
              opacity: 0.78,
              marginBottom: 8,
              letterSpacing: 0.7,
              textTransform: 'uppercase',
            }}
          >
            Available Balance
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
                fontSize: 34,
                fontFamily: 'Poppins-Bold',
                color: Colors.white,
                marginBottom: 16,
                letterSpacing: -0.8,
              }}
            >
              ₦{balance.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          )}

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.15)',
              paddingTop: 14,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Regular',
                color: Colors.white,
                opacity: 0.65,
                marginBottom: 6,
              }}
            >
              Pending escrow earnings
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.white,
              }}
            >
              ₦{pendingEarnings.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
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
              backgroundColor: WALLET_CTA_BLACK,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            activeOpacity={0.85}
            onPress={() => router.push('/WithdrawScreen' as any)}
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
              backgroundColor: WALLET_CTA_BLACK,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            activeOpacity={0.85}
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
              Loading wallet activity...
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
              borderColor: 'rgba(17, 24, 39, 0.045)',
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
              No wallet activity yet
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                textAlign: 'center',
              }}
            >
              Completed jobs, withdrawals, and pending earnings will appear here.
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View
            key={activity.id}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 18,
              padding: 15,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(17, 24, 39, 0.045)',
              shadowColor: '#101828',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.035,
              shadowRadius: 10,
              elevation: 0.76,
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
                  backgroundColor: activity.status === 'pending' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(79, 103, 57, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Check size={20} color={activity.status === 'pending' ? '#92400E' : '#2A3B1F'} />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                    lineHeight: 19,
                  }}
                  numberOfLines={1}
                >
                  {activity.serviceName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 17,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: 8,
                  }}
                  numberOfLines={2}
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
                  backgroundColor: activity.status === 'pending' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(79, 103, 57, 0.14)',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-SemiBold',
                    color: activity.status === 'pending' ? '#92400E' : '#2A3B1F',
                  }}
                >
                  {activity.status === 'pending' ? 'Pending' : 'Completed'}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <Text
              style={{
                fontSize: 17,
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
                  backgroundColor: WALLET_CTA_BLACK,
                borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.85}
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
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: WALLET_CTA_BLACK,
                  flexDirection: 'row',
                }}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/ProviderReceiptScreen' as any,
                  params: {
                    transactionId: activity.id,
                    ...(activity.requestId ? { requestId: String(activity.requestId) } : {}),
                    amount: activity.amount.replace(/[₦,\s]/g, ''),
                    ...(activity.balanceAfter != null ? { balanceAfter: String(activity.balanceAfter) } : {}),
                    providerName: activity.serviceName,
                    serviceName: activity.serviceType,
                    serviceDate: activity.date,
                    serviceTime: activity.time,
                  },
                } as any)}
              >
                <Receipt size={16} color={WALLET_CTA_BLACK} style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins-SemiBold',
                    color: WALLET_CTA_BLACK,
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
