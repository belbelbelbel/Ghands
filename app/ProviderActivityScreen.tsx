import { EmptyState } from '@/components/EmptyState';
import FilterTransactionsModal from '@/components/FilterTransactionsModal';
import { TransactionCardSkeleton } from '@/components/LoadingSkeleton';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import {
  providerHomeActionButton,
  providerHomeActionLabel,
  providerHomeSurface,
  providerHomeSurfacePadding,
  providerUnderlineTabItem,
  providerUnderlineTabLabel,
  providerUnderlineTabRow,
} from '@/lib/providerSurfaceStyles';
import { walletService } from '@/services/api';
import { openProviderReceipt } from '@/utils/receiptNavigation';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Check, Filter, Receipt, Search, Wrench } from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Transaction {
  id: string;
  requestId?: number | null;
  balanceAfter?: number | null;
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
        requestId: apiTx.requestId ?? apiTx.request_id ?? null,
        balanceAfter: typeof apiTx.balanceAfter === 'number'
          ? apiTx.balanceAfter
          : typeof apiTx.balance_after === 'number'
            ? apiTx.balance_after
            : null,
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
    openProviderReceipt(router, {
      transactionId: transaction.id,
      requestId: transaction.requestId ? String(transaction.requestId) : undefined,
      amount: String(transaction.amount),
      balanceAfter: transaction.balanceAfter != null ? String(transaction.balanceAfter) : undefined,
      providerName: transaction.serviceName,
      serviceName: transaction.serviceDescription,
      serviceDate: transaction.date,
      serviceTime: transaction.time,
      reference: transaction.reference,
    });
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: PROVIDER_TAB_GUTTER,
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
          paddingHorizontal: PROVIDER_TAB_GUTTER,
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
              width: 44,
              height: 44,
              ...providerHomeSurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Search size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 44,
              height: 44,
              ...providerHomeSurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Filter size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={{ ...providerUnderlineTabRow, marginBottom: 20 }}>
          {(['all', 'pending', 'earnings', 'withdrawals'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={providerUnderlineTabItem(activeTab === tab)}
              activeOpacity={0.7}
            >
              <Text style={providerUnderlineTabLabel(activeTab === tab)}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction Cards */}
        {isLoading ? (
          <>
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={40} color={Colors.textSecondaryDark} />}
            title="No transactions yet"
            description={searchQuery.trim() ? 'No matching transactions' : 'Your wallet activity will appear here'}
            style={{
              flex: 0,
              ...providerHomeSurface,
              padding: providerHomeSurfacePadding + 18,
            }}
          />
        ) : (
        filteredTransactions.map((transaction) => (
          <View
            key={transaction.id}
            style={{
              ...providerHomeSurface,
              padding: providerHomeSurfacePadding,
              marginBottom: 12,
            }}
          >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              {/* Service Icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.default,
                  backgroundColor: transaction.type === 'withdrawal' ? Colors.backgroundGray : 'rgba(79, 103, 57, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {transaction.type === 'withdrawal' ? (
                  <Check size={18} color={Colors.textSecondaryDark} />
                ) : (
                  <Wrench size={18} color="#2A3B1F" />
                )}
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    marginBottom: 2,
                    lineHeight: 18,
                  }}
                  numberOfLines={1}
                >
                  {transaction.serviceName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Medium',
                    color: Colors.textSecondaryDark,
                    marginBottom: 2,
                    lineHeight: 17,
                  }}
                  numberOfLines={2}
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
                  {transaction.date} · {transaction.time}
                </Text>
              </View>

              {/* Amount and Status Badge */}
              <View style={{ alignItems: 'flex-end' }}>
                {transaction.status === 'pending' && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: 'rgba(245, 158, 11, 0.18)',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-SemiBold',
                        color: '#92400E',
                      }}
                    >
                      Pending
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                    letterSpacing: -0.3,
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
                  ...providerHomeActionButton,
                  width: '100%',
                }}
                activeOpacity={0.85}
                onPress={() => handleViewDetails(transaction)}
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
                onPress={() => handleViewReceipt(transaction)}
              >
                <Receipt size={15} color={Colors.textPrimary} style={{ marginRight: 5 }} />
                <Text style={providerHomeActionLabel}>View Receipt</Text>
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
        onApply={(_filters) => {
          // Filter UI can be wired to reload when needed
        }}
      />
    </SafeAreaWrapper>
  );
}
