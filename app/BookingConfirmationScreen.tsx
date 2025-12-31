import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import AnimatedStatusChip from '@/components/AnimatedStatusChip';
import { haptics } from '@/hooks/useHaptics';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ProgressStepStatus = 'completed' | 'in-progress' | 'pending';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: ProgressStepStatus;
  statusText: string;
  statusColor: string;
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'step-1',
    title: 'Job Request Submitted',
    description: 'Request sent to 3 selected providers',
    status: 'completed',
    statusText: 'Completed - 2 hours ago',
    statusColor: '#DCFCE7',
  },
  {
    id: 'step-2',
    title: 'Inspection & Quotation',
    description: 'Request sent to 3 selected providers',
    status: 'in-progress',
    statusText: 'In Progress - 2 of 3 completed',
    statusColor: '#DBEAFE',
  },
  {
    id: 'step-3',
    title: 'Work In Progress',
    description: 'Request sent to 3 selected providers',
    status: 'pending',
    statusText: 'Pending',
    statusColor: '#DBEAFE',
  },
  {
    id: 'step-4',
    title: 'Job Completed',
    description: 'Request sent to 3 selected providers',
    status: 'pending',
    statusText: 'Pending',
    statusColor: '#DBEAFE',
  },
];

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const [animatedSteps, setAnimatedSteps] = useState<number[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger success haptic on mount (booking confirmation)
    haptics.success();
    
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
    
    // Animate steps with staggered timing and haptics
    PROGRESS_STEPS.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSteps((prev) => [...prev, index]);
        // Light haptic for each step animation
        if (index > 0) {
          haptics.light();
        }
      }, 300 + index * 150);
    });
  }, [fadeAnim, slideAnim]);

  const handleContinue = () => {
    haptics.selection();
    router.push('/(tabs)/home');
  };

  const getStepColor = (status: ProgressStepStatus) => {
    switch (status) {
      case 'completed':
        return '#6A9B00';
      case 'in-progress':
        return '#F59E0B';
      default:
        return '#D1D5DB';
    }
  };

  const getStepTextColor = (status: ProgressStepStatus) => {
    switch (status) {
      case 'completed':
        return '#166534';
      case 'in-progress':
        return '#92400E';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaWrapper className="flex-1 bg-white">
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 20 }}
        >
          <View className="items-center mb-6">
            <Text
              className="text-4xl text-[#6A9B00] mb-4"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Booking Successful!
            </Text>
          </View>

          <View className="bg-gray-100 rounded-2xl px-4 py-4 mb-8 border border-gray-200">
            <Text className="text-base text-black leading-6" style={{ fontFamily: 'Poppins-Regular' }}>
              Hi <Text style={{ fontFamily: 'Poppins-Bold' }}>Larry</Text>, your{' '}
              <Text style={{ fontFamily: 'Poppins-Bold', textDecorationLine: 'underline' }}>
                plumbing service
              </Text>{' '}
              has been booked for{' '}
              <Text style={{ fontFamily: 'Poppins-Bold', textDecorationLine: 'underline' }}>
                Dec 12
              </Text>
              . Our service provider will contact you soon.
            </Text>
          </View>

          <View className="mb-8">
            {PROGRESS_STEPS.map((step, index) => {
              const isAnimated = animatedSteps.includes(index);
              const stepColor = getStepColor(step.status);
              const textColor = getStepTextColor(step.status);
              const isLast = index === PROGRESS_STEPS.length - 1;

              return (
                <View key={step.id} className="flex-row">
                  <View className="items-center mr-4">
                    <Animated.View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isAnimated ? stepColor : '#D1D5DB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isAnimated ? 1 : 0.5,
                      }}
                    >
                      {step.status === 'completed' && (
                        <CheckCircle size={16} color="#FFFFFF" />
                      )}
                      {step.status === 'in-progress' && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      )}
                      {step.status === 'pending' && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      )}
                    </Animated.View>
                    {!isLast && (
                      <View
                        className="w-0.5"
                        style={{
                          flex: 1,
                          backgroundColor: isAnimated && step.status !== 'pending' ? stepColor : '#E5E7EB',
                          minHeight: 60,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </View>

                  <View className="flex-1 pb-6">
                    <Text
                      className="text-base mb-1"
                      style={{ fontFamily: 'Poppins-Bold', color: '#111827' }}
                    >
                      {step.title}
                    </Text>
                    <Text
                      className="text-sm mb-2"
                      style={{ fontFamily: 'Poppins-Medium', color: '#6B7280' }}
                    >
                      {step.description}
                    </Text>
                    <AnimatedStatusChip
                      status={step.statusText}
                      statusColor={step.statusColor}
                      textColor={textColor}
                      size="small"
                      animated={isAnimated}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.85}
            className="bg-black rounded-xl py-4 items-center justify-center flex-row"
          >
            <Text className="text-white text-base mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Continue
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

