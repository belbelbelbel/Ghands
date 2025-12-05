import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Colors, Fonts, Spacing, BorderRadius, CommonStyles } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../../hooks/useAuth';

export default function ProviderProfileScreen() {
  const { logout } = useAuthRole();
  const router = useRouter();
  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <ScrollView
        contentContainerStyle={{
          ...CommonStyles.container,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: 'center',
            marginBottom: Spacing.xl,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.border,
              marginBottom: Spacing.sm + 2,
            }}
          />
          <Text style={{ ...Fonts.h3, color: Colors.textPrimary }}>Isaac Okoro</Text>
          <Text style={{ ...Fonts.bodySmall, fontFamily: 'Poppins-Medium', color: Colors.textSecondaryDark, marginTop: Spacing.xs }}>
            Professional Electrician
          </Text>
        </View>

        <View style={CommonStyles.card}>
          <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-SemiBold', color: Colors.textPrimary, marginBottom: Spacing.sm }}>
            Metrics
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ ...Fonts.h3, fontSize: 18, color: Colors.textPrimary }}>4.9</Text>
              <Text style={{ ...Fonts.bodyTiny, color: Colors.textSecondaryDark }}>Rating</Text>
            </View>
            <View>
              <Text style={{ ...Fonts.h3, fontSize: 18, color: Colors.textPrimary }}>128</Text>
              <Text style={{ ...Fonts.bodyTiny, color: Colors.textSecondaryDark }}>Jobs</Text>
            </View>
            <View>
              <Text style={{ ...Fonts.h3, fontSize: 18, color: Colors.textPrimary }}>98%</Text>
              <Text style={{ ...Fonts.bodyTiny, color: Colors.textSecondaryDark }}>On-time</Text>
            </View>
          </View>
        </View>

        {[
          'Edit profile',
          'Verification & documents',
          'Availability & schedule',
          'Notifications',
          'Support',
        ].map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.8}
            style={{
              ...CommonStyles.card,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.md + 2,
              marginBottom: Spacing.sm + 2,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-Medium', color: Colors.textPrimary }}>{item}</Text>
            <Text style={{ fontSize: 16, color: Colors.textTertiary }}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            marginTop: Spacing.xs + 2,
            borderRadius: BorderRadius.default,
            borderWidth: 1,
            borderColor: Colors.errorBorder,
            backgroundColor: Colors.errorLight,
            paddingVertical: Spacing.md,
            alignItems: 'center',
          }}
          onPress={async () => {
            await logout();
            router.replace('/onboarding');
          }}
        >
          <Text style={{ ...Fonts.bodyMedium, fontFamily: 'Poppins-SemiBold', color: Colors.error }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
