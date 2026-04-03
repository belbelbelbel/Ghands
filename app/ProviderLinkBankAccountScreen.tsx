import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/useToast';
import { walletService, type Bank } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChevronDown, Lock } from 'lucide-react-native';
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

// Fallback list used when backend returns an empty bank list.
// Strictly cosmetic: codes match common Nigerian banks used by paystack/monnify-style APIs.
const NIGERIA_FALLBACK_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '014', name: 'Afrigo' },
  { code: '023', name: 'CitiBank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'GTBank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'UBA' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
];

export default function ProviderLinkBankAccountScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadBanks = useCallback(async () => {
    try {
      setIsLoadingBanks(true);
      const list = await walletService.getBanks('NG');
      if (Array.isArray(list) && list.length > 0) {
        setBanks(list);
      } else {
        // Backend returned an empty array – fall back to a safe local list
        setBanks(NIGERIA_FALLBACK_BANKS);
      }
    } catch (err) {
      // If API fails entirely, still show local fallback so providers can continue onboarding
      setBanks(NIGERIA_FALLBACK_BANKS);
      showError('Unable to load bank list from server. Showing common Nigerian banks instead.');
    } finally {
      setIsLoadingBanks(false);
    }
  }, [showError]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  const resolveAccount = useCallback(async () => {
    if (!selectedBank?.code || accountNumber.trim().length !== 10) return;
    try {
      setIsResolving(true);
      const result = await walletService.resolveBankAccount(selectedBank.code, accountNumber.trim());
      setAccountHolderName(result.accountName || '');
      if (result.accountName) {
        haptics.success();
      }
    } catch {
      showError('Could not verify account. Check the number and try again.');
    } finally {
      setIsResolving(false);
    }
  }, [selectedBank?.code, accountNumber, showError]);

  const handleSave = async () => {
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) {
      showError('Please fill in all fields');
      return;
    }
    if (accountNumber.trim().length !== 10) {
      showError('Account number must be 10 digits');
      return;
    }
    try {
      setIsSaving(true);
      await walletService.addBankAccount({
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
      });
      haptics.success();
      showSuccess('Bank account linked successfully');
      router.push('/ProviderVerifyIdentityScreen' as any);
    } catch (err: any) {
      const msg = err?.message || err?.details?.error || 'Failed to link bank account';
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setShowBankModal(false);
    haptics.selection();
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
        >
          {/* Back Button and Title */}
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Link your Bank Account
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              marginBottom: 32,
            }}
          >
            Securely link your bank to receive payments
          </Text>

          {/* Bank Name Field */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Bank Name
            </Text>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setShowBankModal(true);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: selectedBank ? Colors.accent : Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: selectedBank ? 'Poppins-Medium' : 'Poppins-Regular',
                  color: selectedBank ? Colors.textPrimary : Colors.textSecondaryDark,
                  flex: 1,
                }}
              >
                {selectedBank?.name || 'Choose a bank'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
          </View>

          {/* Account Number Field */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Account Number
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput
              value={accountNumber}
              onChangeText={(t) => {
                setAccountNumber(t.replace(/\D/g, '').slice(0, 10));
              }}
              placeholder="Enter 10-digit account number"
              placeholderTextColor={Colors.textSecondaryDark}
              keyboardType="numeric"
              maxLength={10}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
                borderWidth: 1,
                borderColor: accountNumber ? Colors.accent : Colors.border,
                flex: 1,
              }}
            />
            <TouchableOpacity
              onPress={resolveAccount}
              disabled={!selectedBank?.code || accountNumber.trim().length !== 10 || isResolving}
              style={{
                backgroundColor: accountNumber.trim().length === 10 && selectedBank ? Colors.accent : Colors.border,
                borderRadius: BorderRadius.lg,
                paddingVertical: 16,
                paddingHorizontal: 16,
                minWidth: 100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isResolving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>Verify</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>

          {/* Account Holder Name - resolved from API or manual entry */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Account Holder Name
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Auto-filled when account number is valid"
              placeholderTextColor={Colors.textSecondaryDark}
              style={{
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 15,
                fontFamily: 'Poppins-Regular',
                color: Colors.textPrimary,
                borderWidth: 1,
                borderColor: accountHolderName ? Colors.accent : Colors.border,
              }}
              />
              {isResolving && (
                <View style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                </View>
              )}
            </View>
          </View>

          {/* Security Message */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 40,
              paddingHorizontal: 4,
            }}
          >
            <Lock size={16} color={Colors.textSecondaryDark} />
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins-Regular',
                color: Colors.textSecondaryDark,
                marginLeft: 8,
              }}
            >
              Your bank details are protected
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.xl,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.black} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.black,
                }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Bank Selection Modal */}
        <Modal
          visible={showBankModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBankModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: Colors.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '70%',
                paddingTop: 20,
                paddingBottom: 40,
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    color: Colors.textPrimary,
                  }}
                >
                  Select Bank
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setShowBankModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Bank List */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
              >
                {isLoadingBanks ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.accent} />
                  </View>
                ) : (
                banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.code + bank.name}
                    onPress={() => handleBankSelect(bank)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Poppins-Medium',
                        color: Colors.textPrimary,
                      }}
                    >
                      {bank.name}
                    </Text>
                  </TouchableOpacity>
                )))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
}
