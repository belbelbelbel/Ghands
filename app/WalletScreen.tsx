import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, CheckCircle, Clock, Plus, Receipt, Wallet } from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { TransactionCardSkeleton } from '@/components/LoadingSkeleton';

interface Transaction {
  id: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  amount: number;
  status: 'pending' | 'completed';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'pending',
  },
  {
    id: '2',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'completed',
  },
  {
    id: '3',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'completed',
  },
];

export default function WalletScreen() {
  const router = useRouter();
  const [balance] = useState(12847.50);
  const walletId = 'GH-WLT-92837451';

  const [isLoading] = useState(false); // Add loading state for when real data is implemented

  const handleAddFunds = useCallback(() => {
    router.push('/TopUpScreen' as any);
  }, [router]);

  const handlePay = useCallback(() => {
    router.push('/PaymentMethodsScreen' as any);
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
                  {MOCK_TRANSACTIONS.length}
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
          {isLoading ? (
            <>
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
            </>
          ) : (
            MOCK_TRANSACTIONS.map((transaction) => (
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
