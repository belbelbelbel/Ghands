import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, CheckCircle, Clock, Plus, Receipt, Wallet } from 'lucide-react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { TransactionCardSkeleton } from '@/components/LoadingSkeleton';
import { walletService } from '@/services/api';

interface Transaction {
  id: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  amount: number;
  status: 'pending' | 'completed';
}

export default function WalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);
  const walletId = 'GH-WLT-92837451';

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

  // Helper function to map API transaction to UI transaction
  const mapTransactionToUI = useCallback((apiTransaction: any): Transaction | null => {
    try {
      // Extract service name from description or use default
      let serviceName = 'Service Payment';
      let serviceDescription = apiTransaction.description || 'Wallet transaction';
      
      // Try to extract service name from description
      if (apiTransaction.description) {
        const desc = apiTransaction.description.toLowerCase();
        if (desc.includes('service request')) {
          serviceName = `Service Request #${apiTransaction.requestId || 'N/A'}`;
          serviceDescription = apiTransaction.description;
        } else if (desc.includes('deposit')) {
          serviceName = 'Wallet Deposit';
          serviceDescription = 'Funds added to wallet';
        } else if (desc.includes('withdrawal')) {
          serviceName = 'Withdrawal';
          serviceDescription = 'Funds withdrawn to bank';
        } else if (desc.includes('earnings')) {
          serviceName = 'Earnings';
          serviceDescription = 'Payment received for completed service';
        } else if (desc.includes('refund')) {
          serviceName = 'Refund';
          serviceDescription = apiTransaction.description;
        }
      }

      const { date, time } = formatDate(apiTransaction.createdAt || apiTransaction.completedAt || new Date().toISOString());
      
      return {
        id: String(apiTransaction.id || apiTransaction.reference || Math.random()),
        serviceName,
        serviceDescription,
        date,
        time,
        amount: Math.abs(apiTransaction.amount || 0), // Use absolute value for display
        status: apiTransaction.status === 'completed' ? 'completed' : 'pending',
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error mapping transaction:', error);
      }
      return null;
    }
  }, [formatDate]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoadingTransactions(true);
      const result = await walletService.getTransactions({ limit: 10, offset: 0 });
      const mappedTransactions = result.transactions
        .map(mapTransactionToUI)
        .filter((t): t is Transaction => t !== null);
      setTransactions(mappedTransactions);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading transactions:', error);
      }
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [mapTransactionToUI]);

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

  // Load balance and transactions on mount
  useEffect(() => {
    loadWalletBalance();
    loadTransactions();
  }, [loadWalletBalance, loadTransactions]);

  // Refresh balance and transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWalletBalance();
      loadTransactions();
    }, [loadWalletBalance, loadTransactions])
  );

  const handleAddFunds = useCallback(() => {
    router.push('/TopUpScreen' as any);
  }, [router]);

  const handlePay = useCallback(() => {
    // Navigate to jobs screen to see pending service requests that need payment
    // The Pay button should show pending payments, not just go to payment methods
    router.push('/(tabs)/jobs' as any);
  }, [router]);

  const handleViewAll = useCallback(() => {
    router.push('/ActivityScreen' as any);
  }, [router]);

  const handleViewDetails = useCallback((transaction: Transaction) => {
    router.push({
      pathname: '/PaymentPendingScreen',
      params: {
        transactionId: transaction.id,
        amount: transaction.amount.toString(),
        providerName: transaction.serviceName,
      },
    } as any);
  }, [router]);

  const handleViewReceipt = useCallback((transaction: Transaction) => {
    router.push({
      pathname: '/PaymentSuccessfulScreen',
      params: {
        transactionId: transaction.id,
        providerName: transaction.serviceName,
        serviceName: transaction.serviceDescription,
      },
    } as any);
  }, [router]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.backgroundGray,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
            letterSpacing: -0.3,
          }}
        >
          Wallet
        </Text>
        <TouchableOpacity
          onPress={() => router.push('../NotificationsScreen' as any)}
          style={{ position: 'relative' }}
          activeOpacity={0.7}
        >
          <Bell size={24} color={Colors.textPrimary} />
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: Colors.accent,
            }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Current Balance Card - Ultra Premium Design */}
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: 28,
            marginTop: 20,
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 12,
            },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            elevation: 20,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Enhanced Decorative Gradient Circles */}
          <View
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: Colors.accent,
              opacity: 0.15,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: Colors.accent,
              opacity: 0.12,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 80,
              right: 40,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: Colors.accent,
              opacity: 0.08,
            }}
          />

          {/* Wallet Icon - Top Right - Enhanced */}
          <View
            style={{
              position: 'absolute',
              top: 28,
              right: 28,
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: Colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: Colors.accent,
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 12,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Wallet size={32} color={Colors.white} />
          </View>

          <View style={{ padding: 32 }}>
            {/* Wallet ID */}
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Medium',
                color: Colors.white,
                opacity: 0.65,
                marginBottom: 20,
                letterSpacing: 1,
              }}
            >
              WALLET ID: {walletId}
            </Text>

            {/* Current Balance Label - Enhanced */}
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                opacity: 0.95,
                marginBottom: 16,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Available Balance
            </Text>

            {/* Balance Amount - Extra Large and Ultra Prominent */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                    opacity: 0.9,
                    marginTop: 8,
                    marginRight: 4,
                    letterSpacing: 0.5,
                  }}
                >
                  ₦
                </Text>
                {isLoadingBalance ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 12 }} />
                    <Text
                      style={{
                        fontSize: 24,
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
                      fontSize: 64,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.white,
                      letterSpacing: -2,
                      lineHeight: 72,
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    }}
                  >
                    {balance.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).replace('₦', '')}
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Stats Row - Enhanced */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: 24,
                borderTopWidth: 1.5,
                borderTopColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.white,
                    opacity: 0.65,
                    marginBottom: 6,
                    letterSpacing: 0.3,
                  }}
                >
                  Total Transactions
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.white,
                  }}
                >
                  {isLoadingTransactions ? '...' : transactions.length}
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  marginHorizontal: 20,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins-Regular',
                    color: Colors.white,
                    opacity: 0.65,
                    marginBottom: 6,
                    letterSpacing: 0.3,
                  }}
                >
                  Status
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: Colors.accent,
                      marginRight: 8,
                      shadowColor: Colors.accent,
                      shadowOffset: {
                        width: 0,
                        height: 0,
                      },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.white,
                    }}
                  >
                    Active
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons - Enhanced Premium Design */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {/* Add Funds - Enhanced Premium Button */}
          <TouchableOpacity
            onPress={handleAddFunds}
            style={{
              flex: 1,
              backgroundColor: Colors.accent,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: Colors.accent,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            activeOpacity={0.85}
          >
            <Plus size={18} color={Colors.white} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginLeft: 8,
                letterSpacing: 0.3,
              }}
            >
              Add Funds
            </Text>
          </TouchableOpacity>

          {/* Pay - Enhanced Premium Button */}
          <TouchableOpacity
            onPress={handlePay}
            style={{
              flex: 1,
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginRight: 8,
                letterSpacing: 0.3,
              }}
            >
              Pay
            </Text>
            <ArrowRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={{ marginTop: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Recent Activity
            </Text>
            <TouchableOpacity
              onPress={handleViewAll}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.accent,
                  marginRight: 4,
                }}
              >
                View all
              </Text>
              <ArrowRight size={14} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Transaction Cards */}
          {isLoadingTransactions ? (
            <>
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
            </>
          ) : transactions.length === 0 ? (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 18,
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
                No transactions yet
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
            transactions.map((transaction) => (
            <View
              key={transaction.id}
              style={{
                backgroundColor: Colors.white,
                borderRadius: 18,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: Colors.border,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                {/* Circular icon on left - light grey background */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {transaction.status === 'completed' ? (
                    <CheckCircle size={20} color={Colors.accent} />
                  ) : (
                    <Clock size={20} color="#F59E0B" />
                  )}
                </View>

                {/* Service Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {transaction.serviceName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.textSecondaryDark,
                      marginBottom: 2,
                    }}
                  >
                    {transaction.serviceDescription}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {transaction.date} • {transaction.time}
                  </Text>
                </View>

                {/* Status and Amount on right */}
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: transaction.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-SemiBold',
                        color: transaction.status === 'pending' ? '#D97706' : '#059669',
                      }}
                    >
                      {transaction.status === 'pending' ? 'Pending' : 'Completed'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      letterSpacing: -0.3,
                    }}
                  >
                    ₦{formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </View>

              {/* Action Button at bottom */}
              {transaction.status === 'pending' ? (
                <TouchableOpacity
                  onPress={() => handleViewDetails(transaction)}
                  style={{
                    backgroundColor: Colors.accent,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
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
                  onPress={() => handleViewReceipt(transaction)}
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: Colors.accent,
                  }}
                  activeOpacity={0.7}
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
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
