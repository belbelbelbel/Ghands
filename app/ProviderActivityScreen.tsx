import FilterTransactionsModal from '@/components/FilterTransactionsModal';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { walletService } from '@/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Check, Filter, Receipt, Search, Wrench } from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

interface Transaction {
  id: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  amount: number;
  status: 'pending' | 'completed';
  type?: 'earnings' | 'withdrawal';
  reference?: string;
}

type TabType = 'all' | 'pending' | 'earnings' | 'withdrawals';

export default function ProviderActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const mapApiTransactionToUI = useCallback((apiTx: any): Transaction | null => {
    try {
      const apiType = (apiTx.type || '').toLowerCase();
      const desc = (apiTx.description || '').toLowerCase();
      const isWithdrawal = apiType === 'withdrawal' || desc.includes('withdrawal');
      const type: 'earnings' | 'withdrawal' = isWithdrawal ? 'withdrawal' : 'earnings';

      let serviceName = 'Service Payment';
      let serviceDescription = apiTx.description || 'Wallet transaction';
      if (desc.includes('earnings') || desc.includes('payment') || desc.includes('service request')) {
        serviceName = desc.includes('withdrawal') ? 'Withdrawal' : `Earnings${apiTx.requestId ? ` #${apiTx.requestId}` : ''}`;
        serviceDescription = apiTx.description || (isWithdrawal ? 'Funds withdrawn to bank' : 'Payment received');
      } else if (desc.includes('withdrawal')) {
        serviceName = 'Withdrawal to bank';
        serviceDescription = apiTx.reference ? `Ref: ${apiTx.reference}` : 'Funds withdrawn to bank';
      } else if (desc.includes('deposit')) {
        serviceName = 'Deposit';
        serviceDescription = 'Funds added to wallet';
      } else if (desc.includes('refund')) {
        serviceName = 'Refund';
        serviceDescription = apiTx.description;
      }

      const { date, time } = formatDate(apiTx.createdAt || apiTx.completedAt || new Date().toISOString());
      return {
        id: String(apiTx.id || apiTx.reference || Math.random()),
        serviceName,
        serviceDescription,
        date,
        time,
        amount: Math.abs(apiTx.amount || 0),
        status: apiTx.status === 'completed' ? 'completed' : 'pending',
        type,
        reference: apiTx.reference,
      };
    } catch (error) {
      if (__DEV__) console.error('Error mapping transaction:', error);
      return null;
    }
  }, [formatDate]);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await walletService.getTransactions({ limit: 100, offset: 0 });
      const mapped = result.transactions
        .map(mapApiTransactionToUI)
        .filter((t): t is Transaction => t !== null);
      setTransactions(mapped);
    } catch (error) {
      if (__DEV__) console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapApiTransactionToUI]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const getFilteredTransactions = useCallback((): Transaction[] => {
    let list = transactions;
    switch (activeTab) {
      case 'pending':
        list = transactions.filter((t) => t.status === 'pending');
        break;
      case 'earnings':
        list = transactions.filter((t) => t.type === 'earnings');
        break;
      case 'withdrawals':
        list = transactions.filter((t) => t.type === 'withdrawal');
        break;
      case 'all':
      default:
        break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.serviceName.toLowerCase().includes(q) ||
          t.serviceDescription.toLowerCase().includes(q) ||
          (t.reference && t.reference.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transactions, activeTab, searchQuery]);

  const filteredTransactions = getFilteredTransactions();

  const handleViewDetails = (transaction: Transaction) => {
    if (transaction.status === 'pending') {
      router.push({
        pathname: '/PaymentPendingScreen',
        params: {
          transactionId: transaction.id,
          amount: transaction.amount.toString(),
          providerName: transaction.serviceName,
        },
      } as any);
    }
  };

  const handleViewReceipt = (transaction: Transaction) => {
    router.push({
      pathname: '/ProviderReceiptScreen',
      params: {
        transactionId: transaction.id,
        providerName: transaction.serviceName,
        serviceName: transaction.serviceDescription,
      },
    } as any);
  };

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
        {/* Search and Filter Section */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            marginBottom: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.backgroundGray,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <TextInput
              placeholder="Search transactions..."
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
              borderRadius: 12,
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
              backgroundColor: Colors.black,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Filter size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          {(['all', 'pending', 'earnings', 'withdrawals'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingBottom: 12,
                alignItems: 'center',
                position: 'relative',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: activeTab === tab ? 'Poppins-SemiBold' : 'Poppins-Regular',
                  color: activeTab === tab ? Colors.textPrimary : Colors.textSecondaryDark,
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
              {activeTab === tab && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    marginLeft: -15,
                    width: 30,
                    height: 3,
                    backgroundColor: Colors.accent,
                    borderRadius: 2,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction Cards */}
        {isLoading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{ marginTop: 16, fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark }}>
              Loading transactions...
            </Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
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
              {searchQuery.trim() ? 'No matching transactions' : 'Your wallet activity will appear here'}
            </Text>
          </View>
        ) : (
        filteredTransactions.map((transaction) => (
          <View
            key={transaction.id}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              {/* Service Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: transaction.type === 'withdrawal' ? Colors.backgroundGray : Colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {transaction.type === 'withdrawal' ? (
                  <Check size={20} color={Colors.textSecondaryDark} />
                ) : (
                  <Wrench size={24} color={Colors.white} />
                )}
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

              {/* Amount and Status Badge */}
              <View style={{ alignItems: 'flex-end' }}>
                {/* Pending Badge */}
                {transaction.status === 'pending' && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: '#FEF3C7',
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#D97706',
                      }}
                    >
                      Pending
                    </Text>
                  </View>
                )}
                {/* Amount */}
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

            {/* Action Button */}
            {transaction.status === 'pending' ? (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.accent,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 8,
                }}
                activeOpacity={0.7}
                onPress={() => handleViewDetails(transaction)}
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
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginTop: 8,
                  borderWidth: 1.5,
                  borderColor: Colors.accent,
                }}
                activeOpacity={0.7}
                onPress={() => handleViewReceipt(transaction)}
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
