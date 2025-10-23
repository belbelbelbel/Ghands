import { useRouter } from 'expo-router';
import { BarChart3, Clock, DollarSign, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const SimpleBarChart = () => (
  <Svg width={200} height={120} viewBox="0 0 200 120">
    <Defs>
      <LinearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ADF802" />
        <Stop offset="100%" stopColor="#8BC34A" />
      </LinearGradient>
      <LinearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4A90E2" />
        <Stop offset="100%" stopColor="#357ABD" />
      </LinearGradient>
      <LinearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#E74C3C" />
      </LinearGradient>
    </Defs>
    <Rect x="20" y="40" width="30" height="60" rx="4" fill="url(#barGrad1)" />
    <Rect x="60" y="20" width="30" height="80" rx="4" fill="url(#barGrad2)" />
    <Rect x="100" y="30" width="30" height="70" rx="4" fill="url(#barGrad3)" />
    <Rect x="140" y="10" width="30" height="90" rx="4" fill="url(#barGrad1)" />
    <Rect x="180" y="50" width="30" height="50" rx="4" fill="url(#barGrad2)" />
  </Svg>
);

const metrics: MetricCard[] = [
  {
    title: 'Total Requests',
    value: '24',
    change: '+12%',
    icon: <TrendingUp size={20} color="#ADF802" />,
    color: '#ADF802'
  },
  {
    title: 'Active Providers',
    value: '8',
    change: '+5%',
    icon: <Users size={20} color="#4A90E2" />,
    color: '#4A90E2'
  },
  {
    title: 'Revenue',
    value: '$1,240',
    change: '+18%',
    icon: <DollarSign size={20} color="#32CD32" />,
    color: '#32CD32'
  },
  {
    title: 'Avg. Response',
    value: '2.4h',
    change: '-15%',
    icon: <Clock size={20} color="#FF6B6B" />,
    color: '#FF6B6B'
  }
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-6">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-[#ADF802] rounded-full items-center justify-center mr-3">
              <BarChart3 size={24} color="black" />
            </View>
            <View className="flex-1">
              <Text 
                className="text-2xl font-bold text-black"
                style={{ fontFamily: 'Poppins-ExtraBold' }}
              >
                Analytics
              </Text>
              <Text 
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Track your performance and insights
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Metrics Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            {metrics.map((metric, index) => (
              <View
                key={index}
                className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-200"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    {metric.icon}
                  </View>
                  <Text 
                    className="text-xs font-semibold"
                    style={{ 
                      color: metric.change.startsWith('+') ? '#32CD32' : '#FF6B6B',
                      fontFamily: 'Poppins-SemiBold'
                    }}
                  >
                    {metric.change}
                  </Text>
                </View>
                <Text 
                  className="text-2xl font-bold text-black mb-1"
                  style={{ fontFamily: 'Poppins-ExtraBold' }}
                >
                  {metric.value}
                </Text>
                <Text 
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {metric.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Performance Chart */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
            <Text 
              className="text-lg font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-ExtraBold' }}
            >
              Weekly Performance
            </Text>
            <View className="items-center">
              <SimpleBarChart />
              <View className="flex-row justify-between w-full mt-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                  <Text 
                    key={index}
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {day}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Top Services */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
            <Text 
              className="text-lg font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-ExtraBold' }}
            >
              Top Services
            </Text>
            {[
              { name: 'Plumbing', requests: 12, revenue: '$480' },
              { name: 'Electrical', requests: 8, revenue: '$600' },
              { name: 'Cleaning', requests: 6, revenue: '$180' },
              { name: 'Carpentry', requests: 4, revenue: '$320' }
            ].map((service, index) => (
              <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <View className="flex-1">
                  <Text 
                    className="text-base font-semibold text-black"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    {service.name}
                  </Text>
                  <Text 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {service.requests} requests
                  </Text>
                </View>
                <Text 
                  className="text-base font-bold text-[#ADF802]"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  {service.revenue}
                </Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
            <Text 
              className="text-lg font-bold text-black mb-4"
              style={{ fontFamily: 'Poppins-ExtraBold' }}
            >
              Recent Activity
            </Text>
            {[
              { action: 'New request received', time: '2 hours ago', type: 'request' },
              { action: 'Payment completed', time: '4 hours ago', type: 'payment' },
              { action: 'Provider assigned', time: '6 hours ago', type: 'assignment' },
              { action: 'Job completed', time: '1 day ago', type: 'completion' }
            ].map((activity, index) => (
              <View key={index} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
                <View 
                  className={`w-3 h-3 rounded-full mr-3 ${
                    activity.type === 'request' ? 'bg-[#ADF802]' :
                    activity.type === 'payment' ? 'bg-[#4A90E2]' :
                    activity.type === 'assignment' ? 'bg-[#FFD700]' : 'bg-[#32CD32]'
                  }`}
                />
                <View className="flex-1">
                  <Text 
                    className="text-sm font-medium text-black"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {activity.action}
                  </Text>
                  <Text 
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Spacer for Tab Navigation */}
        <View style={{ height: 100 }} />
      </Animated.View>
    </SafeAreaView>
  );
}
