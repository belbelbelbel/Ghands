import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Building, Camera, CheckCircle, CreditCard, User, FileText, Shield } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/lib/designSystem';
import { haptics } from '@/hooks/useHaptics';

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
      icon: <User size={24} color="#666666" />,
      status: 'pending',
    },
    {
      id: '2',
      title: 'Upload Corporate Tax Document',
      description: 'Verifies your business for regulatory purposes.',
      icon: <FileText size={24} color="#666666" />,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Upload Representative ID',
      description: 'Helps us verify who manages this account.',
      icon: <Camera size={24} color="#666666" />,
      status: 'completed',
    },
    {
      id: '4',
      title: 'Add Bank Account',
      description: 'Required for payouts and wallet withdrawals.',
      icon: <CreditCard size={24} color="#666666" />,
      status: 'completed',
    },
  ];

  const handleFinishSetup = () => {
    router.replace('/provider/home');
  };

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1, backgroundColor: Colors.backgroundLight }}>
        {/* Header */}
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 12 }}>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.back();
            }} 
            style={{ marginBottom: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ 
            paddingHorizontal: 20, 
            paddingBottom: 40,
            backgroundColor: Colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text 
            style={{
              fontSize: 24,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Verify you Identity
          </Text>

          {/* Description */}
          <Text 
            style={{
              fontSize: 15,
              fontFamily: 'Poppins-Regular',
              color: Colors.textSecondaryDark,
              marginBottom: 32,
              lineHeight: 22,
            }}
          >
            Complete these steps to start working and receive payments securely.
          </Text>

          {/* Verification Steps */}
          {steps.map((step, index) => (
            <View 
              key={step.id} 
              style={{
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Icon */}
                <View 
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: Colors.backgroundGray,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {step.icon}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text 
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins-SemiBold',
                      color: Colors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text 
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins-Regular',
                      color: Colors.textSecondaryDark,
                      marginBottom: 8,
                      lineHeight: 18,
                    }}
                  >
                    {step.description}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: step.status === 'completed' ? '#D1FAE5' : '#FEF3C7',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Poppins-SemiBold',
                      color: step.status === 'completed' ? '#065F46' : '#92400E',
                    }}
                  >
                    {step.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Finish Setup Button */}
          <TouchableOpacity
            onPress={() => {
              haptics.success();
              handleFinishSetup();
            }}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginTop: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Text 
              style={{
                fontSize: 16,
                fontFamily: 'Poppins-SemiBold',
                color: Colors.white,
              }}
            >
              Finish Setup
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

