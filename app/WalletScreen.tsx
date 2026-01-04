import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, CheckCircle, Plus, User } from 'lucide-react-native';
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
          paddingTop: 16,
          paddingBottom: 16,
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
          <User size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 24,
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
            backgroundColor: 'rgba(18, 18, 18, 1)', // Dark grey/black
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 20,
            position: 'relative',
          }}
        >
          {/* Wallet ID at top */}
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins-Medium',
              color: Colors.white,
              opacity: 0.8,
              marginBottom: 10,
            }}
          >
            Id: {walletId}
          </Text>

          {/* Balance Info */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.white,
                  opacity: 0.9,
                  marginBottom: 6,
                }}
              >
                Current balance
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                }}
              >
                ₦{balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            {/* Green circular icon with currency symbol */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.white,
                }}
              >
                ₦
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {/* Add Funds - BRIGHT LIME GREEN */}
          <TouchableOpacity
            onPress={handleAddFunds}
            style={{
              flex: 1,
              backgroundColor: Colors.accent, // Bright lime green
              borderRadius: BorderRadius.default,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Plus size={20} color={Colors.white} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginLeft: 8,
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
              backgroundColor: 'rgba(18, 18, 18, 1)', // Dark grey/black
              borderRadius: BorderRadius.default,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
                marginRight: 8,
              }}
            >
              Pay
            </Text>
            <ArrowRight size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={{ marginTop: 8, marginBottom: 12 }}>
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
                fontSize: 18,
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
                borderRadius: BorderRadius.xl,
                padding: 14,
                marginBottom: 10,
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
                  <CheckCircle
                    size={20}
                    color={
                      transaction.status === 'completed'
                        ? Colors.accent
                        : Colors.textSecondaryDark
                    }
                  />
                </View>

                {/* Service Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginBottom: 3,
                    }}
                  >
                    {transaction.serviceName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Medium',
                      color: Colors.textSecondaryDark,
                      marginBottom: 3,
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
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-SemiBold',
                      color:
                        transaction.status === 'pending'
                          ? '#F97316' // Light orange
                          : Colors.accent, // Green
                      marginBottom: 6,
                    }}
                  >
                    {transaction.status === 'pending'
                      ? 'Pending'
                      : 'Completed'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
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
                <Button
                  title="View details"
                  onPress={() => handleViewDetails(transaction)}
                  variant="primary"
                  size="medium"
                  fullWidth
                />
              ) : (
                <TouchableOpacity
                  onPress={() => handleViewReceipt(transaction)}
                  style={{
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.default,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: Colors.accent,
                      marginRight: 8,
                    }}
                  />
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
