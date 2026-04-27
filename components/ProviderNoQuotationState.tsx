import { BorderRadius, Colors } from '@/lib/designSystem';
import { FileText } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ProviderNoQuotationStateProps {
  onSendQuotation: () => void;
}

export default function ProviderNoQuotationState({ onSendQuotation }: ProviderNoQuotationStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: Colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <FileText size={40} color={Colors.textSecondaryDark} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'Poppins-Bold',
          color: Colors.textPrimary,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        No Quotation Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
          color: Colors.textSecondaryDark,
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 20,
        }}
      >
        A quotation hasn&apos;t been sent for this job yet.{'\n'}
        Once a quotation is sent and accepted, you&apos;ll see the details here.
      </Text>
      <TouchableOpacity
        onPress={onSendQuotation}
        style={{
          backgroundColor: Colors.accent,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: BorderRadius.default,
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
          }}
        >
          Send Quotation
        </Text>
      </TouchableOpacity>
    </View>
  );
}
