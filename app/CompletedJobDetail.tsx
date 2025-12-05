import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import Demcatorline from "@/components/Demacator";
import HeaderComponent from "@/components/HeaderComponent";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Animated, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Jobdetails() {
  const iconStack = [
    {
      id: 1,
      icons: <Ionicons name="call" size={14} color={'white'} />
    },
    {
      id: 2,
      icons: <Ionicons name="chatbubble" size={14} color={'white'} />
    }
  ]

  const BookedDate = [
    {
      name: "Scheduled Date",
      subtitle: 'October 20, 2024 - 2:00 PM',
      icon: <Ionicons name="calendar"  color={'#9CA3AF'} size={18}/>
    },
    {
      name: "Location",
      subtitle: '123 Main St, Downtown',
      icon: <Ionicons name="location"  color={'#9CA3AF'} size={18}/>
    },
    {
      name: 'Total Cost',
      subtitle: '$150.00',
      icon: <Ionicons name="cash"  color={'#9CA3AF'} size={18}/>
    }
  ]

  const TIMELINE_STEPS = [
    {
      id: 'step-1',
      title: 'Job Request Submitted',
      description: 'Request sent to 3 selected providers',
      status: 'Completed - 2 hours ago',
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
    },
    {
      id: 'step-2',
      title: 'Inspection & Quotation',
      description: 'Request sent to 3 selected providers',
      status: 'Completed - 2 hours ago',
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
    },
    {
      id: 'step-3',
      title: 'Job in Progress',
      description: 'Provider is on site',
      status: 'Completed - 2 hours ago',
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
    },
    {
      id: 'step-4',
      title: 'Complete',
      description: 'Review the job and provide feedback!!',
      status: 'Completed - 2 hours ago',
      accent: '#DCFCE7',
      dotColor: '#6A9B00',
    },
  ];

  const timelineAnimations = useMemo(
    () => TIMELINE_STEPS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const timelineSequence = timelineAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        delay: index * 120,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, timelineSequence).start();
  }, [timelineAnimations]);

  const renderTimeline = () => (
    <View className="mb-8">
      {TIMELINE_STEPS.map((step, index) => {
        const isLast = index === TIMELINE_STEPS.length - 1;
        const animation = timelineAnimations[index];

        return (
          <View key={step.id} className="flex-row mb-6">
            <View className="items-center mr-5">
              <Animated.View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: step.dotColor,
                  transform: [
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                  opacity: animation,
                }}
              />
              {!isLast && (
                <View
                  className="w-0.5"
                  style={{
                    flex: 1,
                    backgroundColor: '#6A9B00',
                    marginTop: 6,
                  }}
                />
              )}
            </View>
            <Animated.View
              style={{
                flex: 1,
                opacity: animation,
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                {step.title}
              </Text>
              <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins-Regular' }}>
                {step.description}
              </Text>
              <View className="rounded-full px-3 py-1.5 self-start" style={{ backgroundColor: step.accent }}>
                <Text className="text-xs text-gray-900" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {step.status}
                </Text>
              </View>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );

  const routes = useRouter();
  return (
    <SafeAreaWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-5" style={{ paddingTop: 20 }}>
            <View className="mb-6">
              <HeaderComponent name="Job details" onPress={routes.back} />
            </View>
            <View className="mb-6">
              <Text
                className="text-xl mb-4"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                }}
              >
                Service Provider
              </Text>
              <View className="flex flex-row items-center justify-between px-5 py-5 bg-white rounded-2xl border border-gray-100">
                <View className="flex flex-row items-center gap-5">
                  <View className="w-14 h-14 rounded-full overflow-hidden">
                    <Image
                      source={require('../assets/images/plumbericon.png')}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View>
                    <Text
                      className="text-base mb-1"
                      style={{
                        fontFamily: 'Poppins-Bold',
                      }}
                    >
                      Mike Johnson
                    </Text>
                    <View className="flex flex-row gap-2 items-center">
                      <View className="flex-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons key={i} name="star" size={14} color="#FACC15" />
                        ))}
                      </View>
                      <Text
                        className="text-sm text-gray-600"
                        style={{
                          fontFamily: 'Poppins-Regular',
                        }}
                      >
                        4.8 (127 reviews)
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex flex-row gap-2">
                  {iconStack.map((icons) => (
                    <TouchableOpacity
                      className="p-3 rounded-xl bg-[#6A9B00]"
                      key={icons.id}
                      activeOpacity={0.85}
                    >
                      <View>{icons.icons}</View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <Demcatorline />
            <View className="mt-6 mb-6">
              <Text
                className="text-xl mb-4"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                }}
              >
                Job Description
              </Text>
              <Text
                className="text-sm text-[#4B5563] leading-5"
                style={{
                  fontFamily: 'Poppins-Regular',
                }}
              >
                Kitchen sink pipe has developed a leak underneath the cabinet. Water is dripping continuously and
                needs immediate repair. The pipe appears to be loose at the joint connection.
              </Text>
            </View>
            <Demcatorline />
            <View className="mt-6 mb-8">
              {BookedDate.map((items, index) => (
                <View key={index} className="flex mb-4 flex-row gap-4 items-start">
                  <View className="mt-1">{items.icon}</View>
                  <View className="flex-1">
                    <Text
                      className="text-sm text-gray-500 mb-1"
                      style={{
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      {items.name}
                    </Text>
                    <Text
                      className="text-base text-black"
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                      }}
                    >
                      {items.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                className="flex gap-3 flex-row mt-4 py-4 rounded-xl items-center justify-center bg-[#6A9B00]"
                activeOpacity={0.85}
              >
                <Text
                  className="text-white text-base"
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                  }}
                >
                  View receipt
                </Text>
                <Ionicons size={18} name="arrow-forward" color="white" />
              </TouchableOpacity>
            </View>

            
            <View className="mb-8">
              {renderTimeline()}
            </View>

            
            <TouchableOpacity
              className="w-full py-4 rounded-xl items-center justify-center bg-gray-400 mb-4"
              activeOpacity={0.85}
              disabled
            >
              <Text
                className="text-white text-base"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                }}
              >
                Job Completed
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </SafeAreaWrapper>
  );
}