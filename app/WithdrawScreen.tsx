import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { walletService, type BankAccount } from '@/services/api';
import { getSpecificErrorMessage } from '@/utils/errorMessages';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Building2, ChevronDown, Lock, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000];

export default function WithdrawScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const pinRefs = React.useRef<TextInput[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wallet, accounts] = await Promise.all([
        walletService.getWallet(),
        walletService.getBankAccounts(),
      ]);
      const b = typeof wallet.balance === 'number' ? wallet.balance : parseFloat(String(wallet.balance)) || 0;
      setBalance(b);
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
        setSelectedAccount(defaultAcc);
      }
    } catch (err) {
      showError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const amount = parseFloat(customAmount) || selectedAmount;
  const hasEnoughBalance = balance >= amount && amount >= 100;

  const handleWithdraw = () => {
    if (!selectedAccount) {
      showError('Please select a bank account');
      return;
    }
    if (!hasEnoughBalance) {
      showError(amount < 100 ? 'Minimum withdrawal is ₦100' : 'Insufficient balance');
      return;
    }
    setPin(['', '', '', '']);
    setShowPinModal(true);
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  };

  const handlePinChange = (value: string, index: number) => {
    const num = value.replace(/\D/g, '').slice(0, 1);
    const newPin = [...pin];
    newPin[index] = num;
    setPin(newPin);
    if (num && index < 3) pinRefs.current[index + 1]?.focus();
    if (index === 3 && num) submitWithdraw(newPin.join(''));
  };

  const submitWithdraw = async (pinValue: string) => {
    if (!pinValue || pinValue.length !== 4 || !selectedAccount) return;
    try {
      setIsWithdrawing(true);
      setShowPinModal(false);
      await walletService.withdraw({
        bankAccountId: selectedAccount.id,
        amount,
        pin: pinValue,
        narration: 'Withdrawal',
      });
      haptics.success();
      showSuccess(`₦${amount.toLocaleString()} withdrawal initiated`);
      loadData();
      router.back();
    } catch (err: any) {
      showError(getSpecificErrorMessage(err, 'withdraw') || 'Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <SafeAreaWrapper>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Building2 size={64} color={Colors.textSecondaryDark} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
            No bank account linked
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 24 }}>
            Link a bank account to withdraw your earnings
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/ProviderLinkBankAccountScreen' as any)}
            style={{ backgroundColor: Colors.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: BorderRadius.lg }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.black }}>Link Bank Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: Colors.textPrimary, flex: 1, textAlign: 'center' }}>
          Withdraw
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: BorderRadius.xl,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            Available Balance
          </Text>
          <Text style={{ fontSize: 28, fontFamily: 'Poppins-Bold', color: Colors.white }}>
            ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 12 }}>
          Bank Account
        </Text>
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.lg,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Building2 size={20} color={Colors.textSecondaryDark} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary }}>
              {selectedAccount?.bankName} ••••{selectedAccount?.accountNumber?.slice(-4)}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
              {selectedAccount?.accountName}
            </Text>
          </View>
          <ChevronDown size={20} color={Colors.textSecondaryDark} />
        </TouchableOpacity>

        <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginTop: 24, marginBottom: 12 }}>
          Amount
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {PRESET_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => { setSelectedAmount(a); setCustomAmount(String(a)); haptics.light(); }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: BorderRadius.md,
                backgroundColor: selectedAmount === a ? Colors.accent : Colors.backgroundGray,
                borderWidth: 1,
                borderColor: selectedAmount === a ? Colors.accent : Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: selectedAmount === a ? Colors.black : Colors.textPrimary }}>
                ₦{a.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={customAmount}
          onChangeText={(t) => {
            const num = t.replace(/\D/g, '');
            setCustomAmount(num);
            const n = parseInt(num, 10);
            if (!isNaN(n)) setSelectedAmount(n);
          }}
          placeholder="Custom amount"
          placeholderTextColor={Colors.textSecondaryDark}
          keyboardType="numeric"
          style={{
            backgroundColor: Colors.backgroundGray,
            borderRadius: BorderRadius.lg,
            padding: 16,
            fontSize: 16,
            fontFamily: 'Poppins-Medium',
            color: Colors.textPrimary,
          }}
        />

        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={!hasEnoughBalance || isWithdrawing}
          style={{
            marginTop: 32,
            backgroundColor: hasEnoughBalance ? Colors.accent : Colors.border,
            borderRadius: BorderRadius.xl,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          {isWithdrawing ? (
            <ActivityIndicator color={Colors.black} />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: hasEnoughBalance ? Colors.black : Colors.textSecondaryDark }}>
              Withdraw ₦{(amount || 0).toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Account picker modal */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowAccountModal(false)}
        >
          <View
            style={{ backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 20 }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 16 }}>Select Account</Text>
            <ScrollView>
              {bankAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => { setSelectedAccount(acc); setShowAccountModal(false); }}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                >
                  <Text style={{ fontSize: 15, fontFamily: 'Poppins-SemiBold' }}>{acc.bankName}</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark }}>
                    {acc.accountNumber} • {acc.accountName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 24, width: '100%', maxWidth: 320 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Lock size={24} color={Colors.accent} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold' }}>Enter PIN</Text>
            </View>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, marginBottom: 20 }}>
              Enter your 4-digit wallet PIN to confirm
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              {[0, 1, 2, 3].map((i) => (
                <TextInput
                  key={i}
                  ref={(r) => { if (r) pinRefs.current[i] = r; }}
                  value={pin[i]}
                  onChangeText={(v) => handlePinChange(v, i)}
                  onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && !pin[i] && i > 0 && pinRefs.current[i - 1]?.focus()}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: pin[i] ? Colors.accent : Colors.border,
                    fontSize: 24,
                    fontFamily: 'Poppins-Bold',
                    textAlign: 'center',
                  }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowPinModal(false)} style={{ alignSelf: 'center' }}>
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.accent }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}
