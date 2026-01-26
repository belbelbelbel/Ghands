import FilterTransactionsModal from '@/components/FilterTransactionsModal';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, Filter, Receipt, Search, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Transaction {
  id: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'completed',
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
    status: 'pending',
  },
  {
    id: '4',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'pending',
  },
  {
    id: '5',
    serviceName: 'Elite Plumbing Services',
    serviceDescription: 'Pipe Repair & Installation',
    date: 'Dec 15, 2024',
    time: '2:30 PM',
    amount: 485.00,
    status: 'failed',
  },
];

export default function ActivityScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'completed' | 'pending' | 'failed'>('completed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const totalSpent = 12847.50;
  const totalTransactions = 28;
  const completedCount = 24;
  const pendingCount = 3;
  const failedCount = 1;

  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.status === selectedTab
  );

  const handleViewDetails = (transaction: Transaction) => {
    if (transaction.status === 'completed') {
      router.push({
        pathname: '/PaymentSuccessfulScreen',
        params: {
          transactionId: transaction.id,
          providerName: transaction.serviceName,
          serviceName: transaction.serviceDescription,
        },
      } as any);
    } else if (transaction.status === 'pending') {
      router.push({
        pathname: '/PaymentPendingScreen',
        params: {
          transactionId: transaction.id,
          amount: transaction.amount.toString(),
          providerName: transaction.serviceName,
        },
      } as any);
    } else if (transaction.status === 'failed') {
      router.push({
        pathname: '/TransactionFailedScreen',
        params: {
          transactionId: transaction.id,
          amount: transaction.amount.toString(),
          providerName: transaction.serviceName,
          serviceFee: (transaction.amount * 0.93).toFixed(2), // Approximate service fee
          platformFee: (transaction.amount * 0.07).toFixed(2), // Approximate platform fee
          totalAmount: transaction.amount.toFixed(2),
        },
      } as any);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Poppins-Bold',
            color: Colors.textPrimary,
            flex: 1,
          }}
        >
          Activity
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* Monthly Spending Summary Card */}
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: 16,
            marginTop: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Medium',
              color: Colors.textSecondaryDark,
              marginBottom: 8,
            }}
          >
            Total spent this month
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 4,
              letterSpacing: -0.4,
            }}
          >
            ₦{totalSpent.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              marginBottom: 16,
            }}
          >
            Across {totalTransactions} transactions
          </Text>

          {/* Status Breakdown */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}
          >
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: Colors.accent,
                  marginBottom: 4,
                }}
              >
                {completedCount}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Completed
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: '#F59E0B',
                  marginBottom: 4,
                }}
              >
                {pendingCount}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Pending
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins-Bold',
                  color: '#EF4444',
                  marginBottom: 4,
                }}
              >
                {failedCount}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins-Medium',
                  color: Colors.textSecondaryDark,
                }}
              >
                Failed
              </Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.lg,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <TextInput
              placeholder="Lagos, 100001"
              placeholderTextColor={Colors.textSecondaryDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
              }}
            />
          </View>
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              backgroundColor: Colors.black,
              borderRadius: BorderRadius.default,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Search size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 48,
              height: 48,
              backgroundColor: Colors.white,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Filter size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Transaction Status Tabs */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          {(['completed', 'pending', 'failed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={{
                flex: 1,
                paddingBottom: 12,
                alignItems: 'center',
                borderBottomWidth: selectedTab === tab ? 3 : 0,
                borderBottomColor: selectedTab === tab ? Colors.accent : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: selectedTab === tab ? 'Poppins-SemiBold' : 'Poppins-Regular',
                  color: selectedTab === tab ? Colors.textPrimary : Colors.textSecondaryDark,
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        <View style={{ gap: 12 }}>
          {filteredTransactions.map((transaction) => (
            <View
              key={transaction.id}
              style={{
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.xl,
                padding: 14,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: 12,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.backgroundGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {transaction.status === 'completed' ? (
                    <CheckCircle size={20} color={Colors.textSecondaryDark} />
                  ) : transaction.status === 'pending' ? (
                    <Clock size={20} color="#F59E0B" />
                  ) : (
                    <XCircle size={20} color="#EF4444" />
                  )}
                </View>

                {/* Transaction Details */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-Bold',
                      color: Colors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {transaction.serviceName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 4,
                    }}
                  >
                    {transaction.serviceDescription}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                    }}
                  >
                    {transaction.date} • {transaction.time}
                  </Text>
                </View>

                {/* Status and Amount */}
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      backgroundColor:
                        transaction.status === 'completed'
                          ? Colors.accent
                          : transaction.status === 'pending'
                          ? '#F59E0B'
                          : '#EF4444',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-SemiBold',
                        color: Colors.white,
                        textTransform: 'capitalize',
                      }}
                    >
                      {transaction.status}
                    </Text>
                  </View>
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

              {/* Action Buttons */}
              {transaction.status === 'completed' ? (
                <TouchableOpacity
                  onPress={() => handleViewDetails(transaction)}
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
              ) : transaction.status === 'pending' ? (
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
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterTransactionsModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          // Handle filter application
          console.log('Applied filters:', filters);
        }}
      />
    </SafeAreaWrapper>
  );
}
