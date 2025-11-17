import Demcatorline from "@/components/Demacator";
import HeaderComponent from "@/components/HeaderComponent";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type ProgressStepStatus = 'completed' | 'in-progress' | 'pending';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: ProgressStepStatus;
  statusText: string;
  statusColor: string;
}
export default function OngoingJobDetails() {
  const routes = useRouter()
  const [animatedSteps, setAnimatedSteps] = useState<number[]>([]);
  const [activeBar, setActiveBar] = useState('Updates')
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    PROGRESS_STEPS.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSteps((prev) => [...prev, index]);
      }, 300 + index * 150);
    });
  }, [fadeAnim, slideAnim]);


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

  const handleTabs = (id: string) => {
    setActiveBar(id)
  }
  const OngoingTabs = ['Updates', 'Quotations']
  return (
    <SafeAreaProvider >
      <SafeAreaView className="flex-1  pt-3 bg-white px-5">
        <HeaderComponent name={`${activeBar === 'Updates' ? "Updates" : "Quotations"}`} onPress={() => routes.back()} />

        <View className="mb-6 mt-7">
          <TouchableOpacity className="flex flex-row gap-10">
            {
              OngoingTabs.map((tab) => (
                <Text className={`text-md   ${activeBar === tab ? "text-[#6A9B00] font-bold" : ""}`} style={{
                  fontFamily: 'Poppins-Medium'
                }} onPress={() => handleTabs(tab)}>
                  {tab}
                </Text>
              ))
            }
          </TouchableOpacity>
          <View className="mb-6">
            <Demcatorline />
          </View>
          <ScrollView className="mt-0">
            {
              activeBar === 'Updates' && (
                <View>
                  {PROGRESS_STEPS.map((step, index) => {
                    const isAnimated = animatedSteps.includes(index);
                    const stepColor = getStepColor(step.status);
                    const textColor = getStepTextColor(step.status);
                    const isLast = index === PROGRESS_STEPS.length - 1;

                    return (
                      <View>
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
                            <View
                              className="rounded-full px-3 py-1 self-start"
                              style={{ backgroundColor: step.statusColor }}
                            >
                              <Text
                                className="text-xs"
                                style={{ fontFamily: 'Poppins-SemiBold', color: textColor }}
                              >
                                {step.statusText}
                              </Text>
                            </View>
                          </View>
                        </View>

                      </View>
                    );
                  })}
                  <TouchableOpacity className="flex items-center py-3 bg-gray-400 rounded-xl justify-center">
                    <Text className="" style={{
                      fontFamily: "Poppins-Medium"
                    }}>Mark as Complete</Text>
                  </TouchableOpacity>
                </View>
              )

            }
            {
              activeBar === "Quotations" && (
                <View>
                  <View className="flex flex-row items-center gap-3 bg-blue-100 rounded-xl p-4">
                    <Text> <Ionicons name="alert-circle" size={25} color={'blue'}/></Text>
                    <View className="flex">
                      <Text className="text-blue-700 text-sm" style={{
                        fontFamily: "Poppins-SemiBold"
                      }}>All quotations received</Text>
                      <Text className="text-[#1D4ED8] text-sm">Review and select your preferred service provider</Text>
                    </View>
                  </View>
                </View>
              )
            }

          </ScrollView>
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  )
}