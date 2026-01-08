import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ChevronDown, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank',
  'United Bank for Africa',
  'Zenith Bank',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Union Bank of Nigeria',
  'First City Monument Bank',
  'Ecobank Nigeria',
];

export default function ProviderLinkBankAccountScreen() {
  const router = useRouter();
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('John Doe Akpi');
  const [showBankModal, setShowBankModal] = useState(false);

  const handleSave = () => {
    if (!selectedBank || !accountNumber || !accountHolderName) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    haptics.success();
    Alert.alert('Success', 'Bank account linked successfully', [
      {
        text: 'OK',
        onPress: () => {
          router.push('/ProviderVerifyIdentityScreen' as any);
        },
      },
    ]);
  };

  const handleBankSelect = (bank: string) => {
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
                {selectedBank || 'Choose a bank'}
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
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter account number"
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
              }}
            />
          </View>

          {/* Account Holder Name Field */}
          <View style={{ marginBottom: 32 }}>
            <TextInput
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Account Holder Name"
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
            activeOpacity={0.8}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: BorderRadius.xl,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.black,
              }}
            >
              Save
            </Text>
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
                {BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
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
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
}
