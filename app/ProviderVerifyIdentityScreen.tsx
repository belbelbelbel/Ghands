import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BorderRadius, Colors, CommonStyles, Fonts, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { Building, Camera, CheckCircle, CreditCard, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'completed';
}

export default function ProviderVerifyIdentityScreen() {
  const router = useRouter();

  const steps: VerificationStep[] = [
    {
      id: '1',
      title: 'Upload Business License',
      description: 'Verify your business registration and legal status.',
      icon: <User size={24} color={Colors.textSecondaryDark} />,
      status: 'pending',
    },
    {
      id: '2',
      title: 'Upload Corporate Tax Document',
      description: 'Verifies your business for regulatory purposes.',
      icon: <Camera size={24} color={Colors.textSecondaryDark} />,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Upload Representative ID',
      description: 'Helps us verify who manages this account.',
      icon: <Camera size={24} color={Colors.textSecondaryDark} />,
      status: 'completed',
    },
    {
      id: '4',
      title: 'Add Bank Account',
      description: 'Required for payouts and wallet withdrawals.',
      icon: <CreditCard size={24} color={Colors.textSecondaryDark} />,
      status: 'completed',
    },
  ];

  const handleFinishSetup = () => {
    router.replace('/provider/home');
  };

  return (
    <SafeAreaWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: 40 }}>
        <Text style={{
          ...Fonts.h1,
          fontSize: 28,
          color: Colors.textPrimary,
          marginBottom: Spacing.xs,
        }}>Verify your Identity</Text>

        <Text style={{
          ...Fonts.body,
          color: Colors.textSecondaryDark,
          marginBottom: Spacing.lg,
        }}>
          Complete these steps to start working and receive payments securely.
        </Text>

        {steps.map((step, index) => (
          <View key={step.id} style={{
            backgroundColor: Colors.backgroundLight,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: BorderRadius.default,
            paddingHorizontal: Spacing.xs + 4,
            paddingVertical: Spacing.md,
            marginBottom: Spacing.xs + 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: Colors.backgroundGray,
                borderRadius: BorderRadius.default,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.xs + 4,
              }}>
                {step.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  ...Fonts.body,
                  fontFamily: 'Poppins-SemiBold',
                  color: Colors.textPrimary,
                  marginBottom: 4,
                }}>
                  {step.title}
                </Text>
                <Text style={{
                  ...Fonts.bodySmall,
                  color: Colors.textSecondaryDark,
                  marginBottom: Spacing.xs + 2,
                }}>
                  {step.description}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: Spacing.sm + 1,
                  paddingVertical: 4,
                  borderRadius: BorderRadius.full,
                  backgroundColor: step.status === 'completed' ? Colors.successLight : '#FEF3C7',
                }}
              >
                <Text
                  style={{
                    ...Fonts.bodyTiny,
                    color: step.status === 'completed' ? Colors.success : '#D97706',
                    fontFamily: 'Poppins-SemiBold',
                  }}
                >
                  {step.status === 'completed' ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleFinishSetup}
          style={{
            ...CommonStyles.buttonSecondary,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg + 2,
            marginTop: Spacing.lg + 2,
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            ...Fonts.button,
            fontSize: 16,
            color: Colors.textPrimary,
            textAlign: 'center',
          }}>
            Finish Setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

