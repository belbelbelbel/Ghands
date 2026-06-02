import { SageHeroPanel } from '@/components/provider/SageHeroPanel';
import {
  SageAmountSkeleton,
  TransactionCardSkeleton,
} from '@/components/LoadingSkeleton';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useSkeletonGate } from '@/hooks/useSkeletonGate';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, useTabScrollContentPaddingTop, useSageHeroPanelMetrics } from '@/lib/designSystem';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import {
  providerHomeActionButton,
  providerHomeActionLabel,
  providerHomeSectionTitle,
  providerHomeSurface,
  providerHomeSurfacePadding,
  providerHomeViewAllLabel,
} from '@/lib/providerSurfaceStyles';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Receipt, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { walletService } from '@/services/api';
import { openProviderReceipt } from '@/utils/receiptNavigation';

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
  const { amountFontSize: sageAmountFontSize } = useSageHeroPanelMetrics();
  const { balance, walletId, isLoading: isLoadingBalance, refresh: refreshWalletBalance } = useWalletBalance({
    refreshOnFocus: true,
  });
  const activitiesReadyRef = useRef(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(true);
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
    if (!activitiesReadyRef.current) {
      setIsLoadingActivities(true);
    }
    try {
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
      activitiesReadyRef.current = true;
      setIsLoadingActivities(false);
    }
  }, [mapTransactionToActivity]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const { showSkeleton: showBalanceSkeleton, isLoadingEmpty: isBalanceLoadingEmpty } =
    useSkeletonGate(isLoadingBalance, balance === null);
  const { showSkeleton: showActivitiesSkeleton, isLoadingEmpty: isActivitiesLoadingEmpty } =
    useSkeletonGate(isLoadingActivities, activities.length === 0);

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight} tabletShellTop>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: PROVIDER_TAB_GUTTER,
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
          paddingHorizontal: PROVIDER_TAB_GUTTER,
          paddingBottom: 100,
        }}
      >
        <SageHeroPanel style={{ marginTop: 12, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              {walletId != null && (
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.white,
                    opacity: 0.55,
                    marginBottom: 4,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                  numberOfLines={1}
                >
                  GH-WLT-{String(walletId).padStart(8, '0')}
                </Text>
              )}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: '#E5E7EB',
                }}
              >
                Available balance
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.11)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: 8,
                borderRadius: 999,
              }}
            >
              <Wallet size={14} color={Colors.white} strokeWidth={2.2} />
            </View>
          </View>

          {(showBalanceSkeleton || isBalanceLoadingEmpty) ? (
            <SageAmountSkeleton />
          ) : (
            <>
          <Text
            style={{
              fontSize: sageAmountFontSize,
              fontFamily: 'Poppins-Bold',
              color: Colors.white,
              marginBottom: 10,
              lineHeight: sageAmountFontSize * 1.12,
              letterSpacing: -0.8,
            }}
          >
            ₦{(balance ?? 0).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>

          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              backgroundColor: 'rgba(255, 255, 255, 0.10)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 999,
            }}
          >
            <Clock size={14} color="#F9FAFB" style={{ marginRight: 5 }} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins-SemiBold',
                color: '#F9FAFB',
              }}
            >
              Pending escrow · ₦{pendingEarnings.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
            </>
          )}
        </SageHeroPanel>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              ...providerHomeActionButton,
            }}
            activeOpacity={0.85}
            onPress={() => router.push('/WithdrawScreen' as any)}
          >
            <TrendingUp size={16} color={Colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={providerHomeActionLabel}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              ...providerHomeActionButton,
            }}
            activeOpacity={0.85}
            onPress={() => router.push('/ProviderActivityScreen' as any)}
          >
            <Clock size={16} color={Colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={providerHomeActionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <Text style={providerHomeSectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            onPress={() => router.push('/ProviderActivityScreen' as any)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text style={{ ...providerHomeViewAllLabel, marginRight: 4 }}>View all</Text>
            <ArrowRight size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Activity Cards */}
        {(showActivitiesSkeleton || isActivitiesLoadingEmpty) ? (
          <>
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </>
        ) : activities.length === 0 ? (
          <View
            style={{
              ...providerHomeSurface,
              padding: providerHomeSurfacePadding + 18,
              alignItems: 'center',
              justifyContent: 'center',
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
              ...providerHomeSurface,
              padding: providerHomeSurfacePadding,
              marginBottom: 12,
            }}
          >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              {/* Icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.default,
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
                    fontSize: 13,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 4,
                    lineHeight: 18,
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
                fontSize: 15,
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
                  ...providerHomeActionButton,
                  width: '100%',
                }}
                activeOpacity={0.85}
                onPress={() => router.push('/PaymentPendingScreen' as any)}
              >
                <Text style={providerHomeActionLabel}>View details</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  ...providerHomeActionButton,
                  width: '100%',
                }}
                activeOpacity={0.85}
                onPress={() =>
                  openProviderReceipt(router, {
                    transactionId: activity.id,
                    requestId: activity.requestId ? String(activity.requestId) : undefined,
                    amount: activity.amount.replace(/[₦,\s]/g, ''),
                    balanceAfter: activity.balanceAfter != null ? String(activity.balanceAfter) : undefined,
                    providerName: activity.serviceName,
                    serviceName: activity.serviceType,
                    serviceDate: activity.date,
                    serviceTime: activity.time,
                  })
                }
              >
                <Receipt size={15} color={Colors.textPrimary} style={{ marginRight: 5 }} />
                <Text style={providerHomeActionLabel}>View Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
          ))
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}
