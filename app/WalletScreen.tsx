import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, CheckCircle, Clock, Plus, Receipt } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

  const handleAddFunds = () => {
    router.push('/TopUpScreen' as any);
  };

  const handlePay = () => {
    router.push('/PaymentMethodsScreen' as any);
  };

  const handleViewAll = () => {
    router.push('/ActivityScreen' as any);
  };

  const handleViewDetails = (transaction: Transaction) => {
    router.push({
      pathname: '/PaymentPendingScreen',
      params: {
        transactionId: transaction.id,
        amount: transaction.amount.toString(),
        providerName: transaction.serviceName,
      },
    } as any);
  };

  const handleViewReceipt = (transaction: Transaction) => {
    router.push({
      pathname: '/PaymentSuccessfulScreen',
      params: {
        transactionId: transaction.id,
        providerName: transaction.serviceName,
        serviceName: transaction.serviceDescription,
      },
    } as any);
  };

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
            fontSize: 20,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
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
        {/* Current Balance Card - BLACK BACKGROUND */}
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
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins-Bold',
                color: Colors.white,
              }}
            >
              ₦
            </Text>
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
            Id: {walletId}
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
            ₦{balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
          {/* Add Funds - BRIGHT LIME GREEN */}
          <TouchableOpacity
            onPress={handleAddFunds}
            style={{
              flex: 1,
              backgroundColor: Colors.accent,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Plus size={18} color={Colors.white} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginLeft: 6,
              }}
            >
              Add Funds
            </Text>
          </TouchableOpacity>

          {/* Pay - DARK GREY/BLACK */}
          <TouchableOpacity
            onPress={handlePay}
            style={{
              flex: 1,
              backgroundColor: 'rgba(18, 18, 18, 1)',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginRight: 6,
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
                fontSize: 16,
                fontFamily: 'Poppins-Bold',
                color: Colors.textPrimary,
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
                  fontSize: 14,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.accent,
                  marginRight: 4,
                }}
              >
                View all
              </Text>
              <ArrowRight size={16} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Transaction Cards */}
          {MOCK_TRANSACTIONS.map((transaction) => (
            <View
              key={transaction.id}
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: Colors.border,
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
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                    }}
                  >
                    ₦{transaction.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
