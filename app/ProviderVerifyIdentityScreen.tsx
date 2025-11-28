import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
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
      icon: <User size={24} color="#666666" />,
      status: 'pending',
    },
    {
      id: '2',
      title: 'Upload Corporate Tax Document',
      description: 'Verifies your business for regulatory purposes.',
      icon: <Camera size={24} color="#666666" />,
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
    <SafeAreaWrapper>
      <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-3xl font-bold text-black mb-4" style={{
          fontFamily: 'Poppins-ExtraBold',
        }}>Verify your Identity</Text>

        <Text className="text-base text-gray-600 mb-8" style={{
          fontFamily: 'Poppins-Medium',
        }}>
          Complete these steps to start working and receive payments securely.
        </Text>

        {steps.map((step, index) => (
          <View key={step.id} className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-4">
            <View className="flex-row items-start">
              <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-4">
                {step.icon}
              </View>
              <View className="flex-1">
                <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {step.title}
                </Text>
                <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins-Regular' }}>
                  {step.description}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  step.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'
                }`}
              >
                <Text
                  className={`text-xs ${
                    step.status === 'completed' ? 'text-green-700' : 'text-orange-700'
                  }`}
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  {step.status === 'completed' ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleFinishSetup}
          className="bg-[#6A9B00] rounded-xl py-4 px-6 mt-6"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold text-center" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Finish Setup
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

