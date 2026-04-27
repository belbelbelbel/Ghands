import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors } from '@/lib/designSystem';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export function ProviderJobLoadingState() {
  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginTop: 16 }}>
          Loading job details...
        </Text>
      </View>
    </SafeAreaWrapper>
  );
}

interface ProviderJobNotFoundStateProps {
  onGoBack: () => void;
}

export function ProviderJobNotFoundState({ onGoBack }: ProviderJobNotFoundStateProps) {
  return (
    <SafeAreaWrapper backgroundColor={Colors.white}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: 8 }}>
          Job not found
        </Text>
        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 20 }}>
          The job details could not be loaded. Please try again.
        </Text>
        <TouchableOpacity
          onPress={onGoBack}
          style={{
            backgroundColor: Colors.accent,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: BorderRadius.default,
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Colors.white }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}
