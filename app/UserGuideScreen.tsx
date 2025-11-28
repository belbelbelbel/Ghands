import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, MapPin, Search } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GuideStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  highlights: Array<{
    text: string;
    position: { x: number; y: number };
    arrowDirection?: 'left' | 'right' | 'up' | 'down';
  }>;
}

const renderHomeScreenMockup = () => (
  <View className="flex-1 bg-white px-2 pt-1">
    <View className="flex-row items-center mb-1">
      <View className="w-3 h-3 rounded-full bg-[#D7FF6B] items-center justify-center mr-1">
        <MapPin size={6} color="#111827" />
      </View>
      <Text className="text-[6px] text-gray-600 flex-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
        1, veekee james ave...
      </Text>
    </View>
    <View className="bg-gray-100 rounded-lg px-1.5 py-1 mb-1.5 flex-row items-center">
      <Text className="text-[6px] text-gray-500 flex-1">Lagos, 100001</Text>
      <Search size={7} color="#666" />
    </View>
    <View className="flex-row items-center justify-between mb-1">
      <Text className="text-[7px] text-black" style={{ fontFamily: 'Poppins-Bold' }}>
        Categories
      </Text>
      <Text className="text-[6px] text-[#6A9B00]" style={{ fontFamily: 'Poppins-SemiBold' }}>
        View all →
      </Text>
    </View>
    <View className="flex-row justify-between mb-1.5">
      {['Auto', 'Elec', 'Clean', 'Paint'].map((cat, i) => (
        <View key={i} className="w-[22%] bg-gray-100 rounded-lg p-1 items-center">
          <View className="w-4 h-4 bg-gray-200 rounded mb-0.5" />
          <Text className="text-[6px] text-black text-center" style={{ fontFamily: 'Poppins-Medium' }}>
            {cat}
          </Text>
        </View>
      ))}
    </View>
    <View className="flex-row items-center justify-between mb-1">
      <Text className="text-[7px] text-black" style={{ fontFamily: 'Poppins-Bold' }}>
        Job Activity
      </Text>
      <Text className="text-[6px] text-[#6A9B00]" style={{ fontFamily: 'Poppins-SemiBold' }}>
        View all →
      </Text>
    </View>
    <View className="bg-white rounded-lg p-1 border border-gray-200">
      <View className="flex-row items-center">
        <View className="w-3 h-3 bg-gray-200 rounded mr-1" />
        <View className="flex-1">
          <Text className="text-[6px] text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Kitchen Sink
          </Text>
          <Text className="text-[5px] text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
            Plumbing • 2d
          </Text>
        </View>
        <View className="bg-[#DCFCE7] px-1 py-0.5 rounded-full">
          <Text className="text-[5px] text-[#166534]" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Done
          </Text>
        </View>
      </View>
    </View>
  </View>
);

const renderRequestServiceMockup = () => (
  <View className="flex-1 bg-white px-4 pt-2">
    <View className="bg-gray-100 rounded-xl px-3 py-2 mb-4 flex-row items-center">
      <Text className="text-xs text-gray-500 flex-1">Automotive</Text>
      <Search size={14} color="#666" />
    </View>
    <Text className="text-sm text-black mb-3" style={{ fontFamily: 'Poppins-Bold' }}>
      All Categories
    </Text>
    <View className="space-y-2">
      {['Automotive', 'Electrical', 'Plumbing', 'Cleaning', 'Carpentry'].map((cat, idx) => (
        <View
          key={idx}
          className="bg-white rounded-xl p-3 flex-row items-center border border-gray-200"
        >
          <View className="w-10 h-10 bg-gray-100 rounded-lg mr-3" />
          <View className="flex-1">
            <Text className="text-xs text-black mb-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
              {cat}
            </Text>
            <Text className="text-[10px] text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
              Get car repairs from anywhere around the globe
            </Text>
            <Text className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: 'Poppins-Regular' }}>
              245 providers
            </Text>
          </View>
          <View
            className={`w-4 h-4 rounded-full border-2 ${
              idx === 0 ? 'bg-gray-400 border-gray-400' : 'border-gray-300'
            }`}
          />
        </View>
      ))}
    </View>
    <View className="bg-black rounded-xl py-3 px-4 mt-4 flex-row items-center justify-center">
      <Text className="text-xs text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
        Add details
      </Text>
      <ChevronRight size={14} color="white" />
    </View>
  </View>
);

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Home Screen',
    description: 'Choose a service category that matches what you need, or use the search bar to find it quickly.',
    content: renderHomeScreenMockup(),
    highlights: [
      { text: 'Search for services', position: { x: 50, y: 15 }, arrowDirection: 'down' },
      { text: 'Select category', position: { x: 30, y: 25 }, arrowDirection: 'right' },
    ],
  },
  {
    id: 2,
    title: 'Request Service',
    description: "You'll see a list of available services. Select the one you need, or change it if you want something different.",
    content: renderRequestServiceMockup(),
    highlights: [
      { text: 'Select service', position: { x: 50, y: 30 }, arrowDirection: 'right' },
      { text: 'Add details', position: { x: 50, y: 75 }, arrowDirection: 'up' },
    ],
  },
  {
    id: 3,
    title: 'Job Details',
    description: 'Type a short description of the job and confirm your location. This helps the app find qualified providers close to you.',
    content: (
      <View className="flex-1 bg-white px-4 pt-2">
        <View className="bg-[#E3F4DF] rounded-xl p-3 mb-4">
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color="#6A9B00" />
            <Text className="text-xs text-black ml-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Current Location
            </Text>
            <Text className="text-xs text-[#6A9B00] ml-auto" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Change
            </Text>
          </View>
          <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
            123 Main Street, Apt 4B
          </Text>
          <Text className="text-[10px] text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
            Downtown District, MetroCity 12345
          </Text>
        </View>
        <Text className="text-xs text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
          Job Title *
        </Text>
        <View className="bg-gray-100 rounded-xl px-3 py-2 mb-4">
          <Text className="text-[10px] text-gray-400" style={{ fontFamily: 'Poppins-Regular' }}>
            e.g., Kitchen faucet repair...
          </Text>
        </View>
        <Text className="text-xs text-black mb-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
          Description *
        </Text>
        <View className="bg-gray-100 rounded-xl px-3 py-3 mb-4" style={{ minHeight: 80 }}>
          <Text className="text-[10px] text-gray-400" style={{ fontFamily: 'Poppins-Regular' }}>
            Description
          </Text>
        </View>
        <View className="bg-black rounded-xl py-3 px-4 flex-row items-center justify-center">
          <Text className="text-xs text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Next
          </Text>
          <ChevronRight size={14} color="white" />
        </View>
      </View>
    ),
    highlights: [
      { text: 'Enter job title', position: { x: 50, y: 30 }, arrowDirection: 'down' },
      { text: 'Add description', position: { x: 50, y: 45 }, arrowDirection: 'down' },
    ],
  },
  {
    id: 4,
    title: 'Date & Time',
    description: 'Pick a convenient date and time for the inspection. When ready, tap "Find Providers" to start the matchmaking process.',
    content: (
      <View className="flex-1 bg-white px-4 pt-2">
        <Text className="text-xs text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
          Select Date
        </Text>
        <View className="bg-gray-50 rounded-xl p-3 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Ionicons name="chevron-back" size={16} color="#666" />
            <Text className="text-xs text-black" style={{ fontFamily: 'Poppins-SemiBold' }}>
              November 2024
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>
          <View className="flex-row justify-between">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} className="text-[10px] text-gray-500 text-center" style={{ width: '14%' }}>
                {day}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((day) => (
              <View
                key={day}
                className={`w-[14%] aspect-square items-center justify-center mb-1 ${
                  day === 17 ? 'bg-[#6A9B00] rounded-full' : ''
                }`}
              >
                <Text
                  className={`text-[10px] ${day === 17 ? 'text-white' : 'text-gray-600'}`}
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text className="text-xs text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
          Select Hours
        </Text>
        <View className="mb-4">
          <Text className="text-[10px] text-gray-500 mb-2" style={{ fontFamily: 'Poppins-Medium' }}>
            AM
          </Text>
          <View className="flex-row flex-wrap">
            {['09:00', '10:00', '11:00', '12:00'].map((time, idx) => (
              <View
                key={time}
                className={`rounded-xl px-3 py-2 mr-2 mb-2 ${
                  idx === 0 ? 'bg-[#6A9B00]' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-[10px] ${idx === 0 ? 'text-white' : 'text-gray-600'}`}
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                >
                  {time}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View className="bg-black rounded-xl py-3 px-4 flex-row items-center justify-center mb-2">
          <Text className="text-xs text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Next
          </Text>
          <ChevronRight size={14} color="white" />
        </View>
        <View className="bg-gray-200 rounded-xl py-3 px-4 items-center">
          <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Cancel request
          </Text>
        </View>
      </View>
    ),
    highlights: [
      { text: 'Select date', position: { x: 50, y: 20 }, arrowDirection: 'down' },
      { text: 'Choose time slot', position: { x: 50, y: 50 }, arrowDirection: 'down' },
    ],
  },
  {
    id: 5,
    title: 'Add Pictures',
    description: 'You can take or upload pictures of the issue. This helps providers understand the problem and give accurate quotes.',
    content: (
      <View className="flex-1 bg-white px-4 pt-2">
        <View className="items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-[#6A9B00] items-center justify-center mb-2">
            <Ionicons name="camera" size={24} color="white" />
          </View>
          <Text className="text-xs text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
            Add Photos of the Issue
          </Text>
          <Text className="text-[10px] text-gray-500 text-center" style={{ fontFamily: 'Poppins-Regular' }}>
            Help providers understand the problem better
          </Text>
        </View>
        <View className="bg-[#6A9B00] rounded-xl py-3 px-4 items-center mb-4">
          <Text className="text-xs text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
            + Upload Photos
          </Text>
        </View>
        <View className="flex-row justify-between mb-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="w-[30%] h-20 bg-gray-200 rounded-xl" />
          ))}
        </View>
        <View className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-200">
          <Text className="text-[10px] text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
            Photo Tips
          </Text>
          <Text className="text-[10px] text-gray-600 mb-1" style={{ fontFamily: 'Poppins-Regular' }}>
            • Take clear, well-lit photos
          </Text>
          <Text className="text-[10px] text-gray-600 mb-1" style={{ fontFamily: 'Poppins-Regular' }}>
            • Include surrounding area for context
          </Text>
          <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
            • Show the problem from multiple angles
          </Text>
        </View>
        <View className="bg-black rounded-xl py-3 px-4 items-center mb-2">
          <Text className="text-xs text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Done
          </Text>
        </View>
        <View className="bg-gray-200 rounded-xl py-2 px-4 items-center">
          <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Cancel request
          </Text>
        </View>
      </View>
    ),
    highlights: [
      { text: 'Upload photos', position: { x: 50, y: 25 }, arrowDirection: 'right' },
      { text: 'Photo tips', position: { x: 50, y: 55 }, arrowDirection: 'down' },
    ],
  },
  {
    id: 6,
    title: 'Select Providers',
    description: 'Matched providers will appear on the map. Select at least one and up to three providers to request inspections from.',
    content: (
      <View className="flex-1 bg-white">
        <View className="h-32 bg-gray-200 rounded-t-xl mb-2" />
        <View className="px-4 pb-2">
          <Text className="text-xs text-black mb-3" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Select providers
          </Text>
          {[1, 2].map((i) => (
            <View key={i} className="bg-white rounded-xl p-3 mb-2 border border-gray-200 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-black mb-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  Mike's Plumbing
                </Text>
                <Text className="text-[10px] text-gray-500 mb-1" style={{ fontFamily: 'Poppins-Regular' }}>
                  Plumbing Specialist • 0.8 miles away
                </Text>
                <Text className="text-[10px] text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  ⭐ 4.9 (127 reviews)
                </Text>
              </View>
              <View className="w-4 h-4 rounded-full border-2 border-gray-300" />
            </View>
          ))}
          <View className="bg-black rounded-xl py-3 px-4 items-center mt-2">
            <Text className="text-xs text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
              Continue to inspection
            </Text>
          </View>
        </View>
      </View>
    ),
    highlights: [
      { text: 'View on map', position: { x: 50, y: 20 }, arrowDirection: 'down' },
      { text: 'Select providers', position: { x: 50, y: 50 }, arrowDirection: 'right' },
    ],
  },
  {
    id: 7,
    title: 'Quotation Review',
    description:
      "Once providers review your request, they'll send in their quotations. You can compare prices, service details, and timelines before making your choice. Tap 'Accept' on the quotation that suits you best to proceed.",
    content: (
      <View className="flex-1 bg-white px-4 pt-2">
        <View className="bg-[#E0F2FE] rounded-xl p-3 mb-3">
          <Text className="text-[10px] text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
            All quotations received
          </Text>
          <Text className="text-[10px] text-blue-700" style={{ fontFamily: 'Poppins-Regular' }}>
            Review and select your preferred service provider
          </Text>
        </View>
        <View className="bg-[#E3F4DF] rounded-xl p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 rounded-full bg-gray-200 mr-2" />
            <View className="flex-1">
              <Text className="text-xs text-black mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
                AquaFix Solutions
              </Text>
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                Plumbing Specialists
              </Text>
            </View>
            <Text className="text-lg text-black" style={{ fontFamily: 'Poppins-Bold' }}>
              $65
            </Text>
          </View>
        </View>
        <View className="bg-white rounded-xl p-3 mb-3 border border-gray-200">
          <Text className="text-xs text-black mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
            Service Breakdown
          </Text>
          <View className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                Complete faucet assessment
              </Text>
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                Free
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                High-quality cartridge & seals
              </Text>
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                $40
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                Professional installation
              </Text>
              <Text className="text-[10px] text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
                $25
              </Text>
            </View>
          </View>
          <View className="border-t border-gray-200 pt-2 flex-row justify-between">
            <Text className="text-xs text-black" style={{ fontFamily: 'Poppins-Bold' }}>
              Total
            </Text>
            <Text className="text-xs text-[#6A9B00]" style={{ fontFamily: 'Poppins-Bold' }}>
              $65
            </Text>
          </View>
        </View>
        <View className="bg-black rounded-xl py-3 px-4 items-center">
          <Text className="text-xs text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Accept
          </Text>
        </View>
        <View className="flex-row items-center justify-center mt-3">
          <Text className="text-[10px] text-gray-500" style={{ fontFamily: 'Poppins-Medium' }}>
            1/3
          </Text>
        </View>
      </View>
    ),
    highlights: [
      { text: 'Review quotes', position: { x: 50, y: 25 }, arrowDirection: 'down' },
      { text: 'Accept quotation', position: { x: 50, y: 70 }, arrowDirection: 'right' },
    ],
  },
  {
    id: 8,
    title: 'Booking Successful',
    description:
      "You'll see a confirmation message showing your booking was successful, along with a job progress tracker. You can go straight to your Jobs section from here to follow up and manage your request.",
    content: (
      <View className="flex-1 bg-white px-4 pt-2">
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-[#6A9B00] items-center justify-center mb-2">
            <Ionicons name="checkmark" size={32} color="white" />
          </View>
          <Text className="text-base text-[#6A9B00] mb-1" style={{ fontFamily: 'Poppins-Bold' }}>
            Booking Successful!
          </Text>
          <Text className="text-[10px] text-gray-600 text-center px-4" style={{ fontFamily: 'Poppins-Regular' }}>
            Hi Larry, your plumbing service has been booked for Dec 12. Our service provider will contact you soon.
          </Text>
        </View>
        <View className="space-y-3 mb-4">
          {[
            { title: 'Job Request Submitted', status: 'Completed - 2 hours ago', color: '#6A9B00' },
            { title: 'Inspection & Quotation', status: 'In Progress - 2 of 3 completed', color: '#F59E0B' },
            { title: 'Job in Progress', status: 'In Progress', color: '#9CA3AF' },
            { title: 'Complete', status: 'Pending', color: '#9CA3AF' },
          ].map((step, idx) => (
            <View key={idx} className="flex-row items-start">
              <View className="w-3 h-3 rounded-full mr-3 mt-1" style={{ backgroundColor: step.color }} />
              <View className="flex-1">
                <Text className="text-xs text-black mb-1" style={{ fontFamily: 'Poppins-SemiBold' }}>
                  {step.title}
                </Text>
                <Text className="text-[10px] text-gray-500" style={{ fontFamily: 'Poppins-Regular' }}>
                  {step.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View className="bg-gray-200 rounded-xl py-3 px-4 items-center mb-2">
          <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Mark as complete
          </Text>
        </View>
        <View className="bg-black rounded-xl py-3 px-4 items-center">
          <Text className="text-xs text-white mr-2" style={{ fontFamily: 'Poppins-SemiBold' }}>
            Continue
          </Text>
        </View>
      </View>
    ),
    highlights: [
      { text: 'Confirmation', position: { x: 50, y: 15 }, arrowDirection: 'down' },
      { text: 'Progress tracker', position: { x: 50, y: 40 }, arrowDirection: 'down' },
    ],
  },
  {
    id: 9,
    title: 'Job Completion & Payment',
    description:
      'If you already have funds, the system will deduct the amount automatically; otherwise, you can easily top up your wallet. The payment is held safely in escrow until the job is completed. Once the provider finishes the work, you can mark the job as complete in your Jobs section. The app will then release the payment to the provider and allow you to rate and review your experience.',
    content: (
      <View className="flex-1 bg-white px-4 pt-2 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-[#6A9B00] items-center justify-center mb-4">
          <BookOpen size={40} color="white" />
        </View>
        <Text className="text-base text-black text-center mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
          Payment & Completion
        </Text>
        <Text className="text-xs text-gray-600 text-center px-4" style={{ fontFamily: 'Poppins-Regular' }}>
          Payment is held in escrow until job completion
        </Text>
      </View>
    ),
    highlights: [],
  },
];

export default function UserGuideScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const arrowAnims = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize arrow animations
  GUIDE_STEPS.forEach((step) => {
    step.highlights.forEach((highlight, index) => {
      const key = `${step.id}-${index}`;
      if (!arrowAnims.current[key]) {
        arrowAnims.current[key] = new Animated.Value(0);
      }
    });
  });

  useEffect(() => {
    // Animate arrows when step changes
    GUIDE_STEPS[currentStep].highlights.forEach((_, index) => {
      const key = `${GUIDE_STEPS[currentStep].id}-${index}`;
      const anim = arrowAnims.current[key];
      if (anim) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });
  }, [currentStep]);

  useEffect(() => {
    // Fade and slide animation when step changes
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToTop = () => {
    // No longer needed since we removed ScrollView
  };

  const renderAnimatedArrow = (direction: 'left' | 'right' | 'up' | 'down', animValue: Animated.Value) => {
    const translateX = direction === 'left' ? -5 : direction === 'right' ? 5 : 0;
    const translateY = direction === 'up' ? -5 : direction === 'down' ? 5 : 0;

    const rotation = direction === 'left' ? '180deg' : direction === 'right' ? '0deg' : direction === 'up' ? '270deg' : '90deg';

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateX],
              }),
            },
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateY],
              }),
            },
          ],
        }}
      >
        <View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="arrow-forward" size={16} color="#6A9B00" />
        </View>
      </Animated.View>
    );
  };

  const currentStepData = GUIDE_STEPS[currentStep];

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 20 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center" style={{ fontFamily: 'Poppins-Bold' }}>
          User Guide
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="flex-1">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="px-4 pt-3 flex-1"
        >
          {/* Step Number and Title */}
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-black items-center justify-center mr-2">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins-Bold' }}>
                {currentStepData.id}
              </Text>
            </View>
            <Text className="text-lg text-black flex-1" style={{ fontFamily: 'Poppins-Bold' }}>
              {currentStepData.title}
            </Text>
          </View>

          {/* Phone Mockup Container */}
          <View className="items-center mb-2" style={{ height: SCREEN_WIDTH * 0.5 }}>
            <View className="bg-gray-900 rounded-[30px] p-1.5 shadow-lg" style={{ width: SCREEN_WIDTH * 0.5 }}>
              <View className="bg-white rounded-[24px] overflow-hidden" style={{ width: '100%', height: '100%' }}>
                {/* Phone Status Bar */}
                <View className="flex-row items-center justify-between px-3 pt-1.5 pb-1">
                  <Text className="text-[8px] text-black" style={{ fontFamily: 'Poppins-Medium' }}>
                    9:41
                  </Text>
                  <View className="flex-row items-center gap-0.5">
                    <View className="w-0.5 h-0.5 rounded-full bg-black" />
                    <View className="w-0.5 h-0.5 rounded-full bg-black" />
                    <View className="w-0.5 h-0.5 rounded-full bg-black" />
                    <View className="w-2 h-1 border border-black rounded-sm">
                      <View className="w-1.5 h-0.75 bg-black rounded-sm m-0.5" />
                    </View>
                  </View>
                </View>

                {/* Phone Content Area */}
                <View className="flex-1 relative overflow-hidden">
                  {currentStepData.content}

                  {/* Animated Arrows for Highlights */}
                  {currentStepData.highlights.map((highlight, index) => {
                    const key = `${currentStepData.id}-${index}`;
                    const anim = arrowAnims.current[key];
                    if (!anim) return null;

                    const labelOffset = highlight.arrowDirection === 'down' ? -20 : highlight.arrowDirection === 'up' ? 20 : 0;
                    const labelPosition = highlight.arrowDirection === 'left' ? { right: 20 } : { left: 20 };

                    return (
                      <View
                        key={key}
                        style={{
                          position: 'absolute',
                          left: `${highlight.position.x}%`,
                          top: `${highlight.position.y}%`,
                          zIndex: 1000,
                        }}
                      >
                        <View style={{ position: 'relative' }}>
                          {renderAnimatedArrow(highlight.arrowDirection || 'right', anim)}
                          <View
                            style={[
                              {
                                position: 'absolute',
                                top: labelOffset,
                                backgroundColor: '#6A9B00',
                                borderRadius: 4,
                                paddingHorizontal: 4,
                                paddingVertical: 2,
                                ...labelPosition,
                              },
                            ]}
                          >
                            <Text className="text-[8px] text-white" style={{ fontFamily: 'Poppins-SemiBold' }}>
                              {highlight.text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Phone Bottom Navigation */}
                <View className="flex-row items-center justify-between px-2 py-1 bg-white border-t border-gray-200">
                  <Ionicons name="home-outline" size={12} color="#9CA3AF" />
                  <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
                  <View className="w-6 h-6 rounded-full bg-[#6A9B00] items-center justify-center">
                    <Ionicons name="add" size={14} color="white" />
                  </View>
                  <Ionicons name="compass-outline" size={12} color="#9CA3AF" />
                  <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-2 flex-1">
            <Text className="text-xs text-gray-700 leading-4" style={{ fontFamily: 'Poppins-Regular' }}>
              {currentStepData.description}
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentStep === 0}
              activeOpacity={0.85}
              className={`flex-row items-center ${currentStep === 0 ? 'opacity-40' : ''}`}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  color: currentStep === 0 ? '#9CA3AF' : '#000000',
                  textDecorationLine: 'underline',
                }}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <View className="w-8 h-8 items-center justify-center">
              <BookOpen size={18} color="#000000" />
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={currentStep === GUIDE_STEPS.length - 1}
              activeOpacity={0.85}
              className={`flex-row items-center ${currentStep === GUIDE_STEPS.length - 1 ? 'opacity-40' : ''}`}
            >
              <Text
                className="text-sm mr-1"
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  color: currentStep === GUIDE_STEPS.length - 1 ? '#9CA3AF' : '#000000',
                }}
              >
                Next
              </Text>
              <ChevronRight
                size={16}
                color={currentStep === GUIDE_STEPS.length - 1 ? '#9CA3AF' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Step Indicators */}
          <View className="flex-row items-center justify-center">
            {GUIDE_STEPS.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                onPress={() => {
                  setCurrentStep(index);
                }}
                activeOpacity={0.85}
                className="mx-0.5"
              >
                <View
                  className={`w-1.5 h-1.5 rounded-full ${
                    index === currentStep ? 'bg-[#6A9B00]' : 'bg-gray-300'
                  }`}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}

