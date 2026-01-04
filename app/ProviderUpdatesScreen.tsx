import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { BorderRadius, Colors, Spacing } from '@/lib/designSystem';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TIMELINE_STEPS = [
  {
    id: '1',
    title: 'Job Request Received',
    description: 'Awaiting your quotation',
    status: 'Completed - 2 hours ago',
    dotColor: Colors.accent,
    lineColor: Colors.accent,
  },
  {
    id: '2',
    title: 'Quotation Sent',
    description: 'Waiting for confirmation',
    status: '',
    dotColor: '#F59E0B',
    lineColor: '#F59E0B',
  },
  {
    id: '3',
    title: 'Quotation Accepted',
    description: 'Client Accepted your quote',
    status: '',
    dotColor: '#9CA3AF',
    lineColor: '#9CA3AF',
  },
  {
    id: '4',
    title: 'Payment Confirmed',
    description: 'Payment Secured',
    status: '',
    dotColor: '#9CA3AF',
    lineColor: '#9CA3AF',
  },
  {
    id: '5',
    title: 'Job in Progress',
    description: 'You are Onsite!',
    status: '',
    dotColor: '#9CA3AF',
    lineColor: '#9CA3AF',
  },
  {
    id: '6',
    title: 'Complete',
    description: 'Job Approved',
    status: '',
    dotColor: '#9CA3AF',
    lineColor: '#9CA3AF',
  },
];

export default function ProviderUpdatesScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor={Colors.backgroundLight}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: Colors.white,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins-Bold',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Updates
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 100,
          }}
        >
          {/* Timeline Section */}
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            {TIMELINE_STEPS.map((step, index) => {
              const isLast = index === TIMELINE_STEPS.length - 1;
              return (
                <View key={step.id} style={{ flexDirection: 'row', marginBottom: isLast ? 0 : 16 }}>
                  {/* Timeline Indicator */}
                  <View style={{ alignItems: 'center', marginRight: 16 }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: step.dotColor,
                        borderWidth: 2,
                        borderColor: Colors.white,
                      }}
                    />
                    {!isLast && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: step.lineColor,
                          marginTop: 4,
                          minHeight: 40,
                        }}
                      />
                    )}
                  </View>

                  {/* Timeline Content */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Bold',
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
                        marginBottom: 4,
                      }}
                    >
                      {step.description}
                    </Text>
                    {step.status && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          color: Colors.accent,
                        }}
                      >
                        {step.status}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Mark as Complete Button */}
          <TouchableOpacity
            disabled
            style={{
              backgroundColor: Colors.backgroundGray,
              borderRadius: BorderRadius.xl,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins-Medium',
                color: Colors.textTertiary,
              }}
            >
              Mark as complete
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
