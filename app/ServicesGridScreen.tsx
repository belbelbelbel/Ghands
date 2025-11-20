import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Rect,
    Stop
} from 'react-native-svg';

interface ServiceItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const CalendarIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="calendarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor="#f5f5f5" />
      </LinearGradient>
    </Defs>
    <Rect x="8" y="12" width="24" height="20" rx="2" fill="url(#calendarGrad)" stroke="#ddd" strokeWidth="1"/>
    <Rect x="6" y="8" width="4" height="8" rx="1" fill="#ff4444"/>
    <Rect x="30" y="8" width="4" height="8" rx="1" fill="#ff4444"/>
    <Circle cx="20" cy="22" r="1.5" fill="#333"/>
    <Path d="M18 25h4v2h-4z" fill="#333"/>
  </Svg>
);

const ClockIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="clockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor="#f5f5f5" />
      </LinearGradient>
    </Defs>
    <Circle cx="20" cy="20" r="18" fill="url(#clockGrad)" stroke="#ddd" strokeWidth="1"/>
    <Circle cx="20" cy="20" r="2" fill="#333"/>
    <Path d="M20 12v8l6 4" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const KeyIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="keyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#333333" />
        <Stop offset="100%" stopColor="#222222" />
      </LinearGradient>
    </Defs>
    <Rect x="8" y="18" width="20" height="8" rx="4" fill="url(#keyGrad)"/>
    <Circle cx="28" cy="22" r="6" fill="url(#keyGrad)"/>
    <Circle cx="28" cy="22" r="3" fill="#666"/>
    <Rect x="6" y="20" width="4" height="4" rx="1" fill="#666"/>
  </Svg>
);

const BikeIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="bikeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#90EE90" />
        <Stop offset="100%" stopColor="#7CCD7C" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="28" r="8" fill="url(#bikeGrad)" stroke="#333" strokeWidth="1"/>
    <Circle cx="28" cy="28" r="8" fill="url(#bikeGrad)" stroke="#333" strokeWidth="1"/>
    <Path d="M12 28 L20 12 L28 28" stroke="#333" strokeWidth="2" fill="none"/>
    <Rect x="18" y="10" width="4" height="8" rx="2" fill="#333"/>
  </Svg>
);

const TrainIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="trainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA500" />
      </LinearGradient>
    </Defs>
    <Rect x="4" y="16" width="32" height="16" rx="2" fill="url(#trainGrad)" stroke="#333" strokeWidth="1"/>
    <Rect x="8" y="12" width="4" height="8" rx="1" fill="#333"/>
    <Rect x="28" y="12" width="4" height="8" rx="1" fill="#333"/>
    <Circle cx="10" cy="32" r="3" fill="#333"/>
    <Circle cx="30" cy="32" r="3" fill="#333"/>
    <Rect x="10" y="20" width="20" height="4" rx="1" fill="#333"/>
  </Svg>
);

const BusIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="busGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#333333" />
        <Stop offset="100%" stopColor="#222222" />
      </LinearGradient>
    </Defs>
    <Rect x="6" y="14" width="28" height="18" rx="2" fill="url(#busGrad)" stroke="#ddd" strokeWidth="1"/>
    <Rect x="8" y="16" width="24" height="6" rx="1" fill="#666"/>
    <Circle cx="12" cy="34" r="3" fill="#333"/>
    <Circle cx="28" cy="34" r="3" fill="#333"/>
    <Rect x="12" y="24" width="16" height="4" rx="1" fill="#666"/>
  </Svg>
);

const RocketIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor="#f5f5f5" />
      </LinearGradient>
      <LinearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B35" />
        <Stop offset="100%" stopColor="#FF8C42" />
      </LinearGradient>
    </Defs>
    <Path d="M20 8 L16 28 L20 32 L24 28 Z" fill="url(#rocketGrad)" stroke="#ddd" strokeWidth="1"/>
    <Path d="M18 28 L16 32 L20 34 L24 32 L22 28 Z" fill="url(#flameGrad)"/>
    <Circle cx="20" cy="12" r="2" fill="#333"/>
    <Rect x="18" y="16" width="4" height="8" rx="1" fill="#333"/>
  </Svg>
);

const LuggageIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="luggageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" />
        <Stop offset="100%" stopColor="#f5f5f5" />
      </LinearGradient>
    </Defs>
    <Rect x="12" y="20" width="16" height="12" rx="2" fill="url(#luggageGrad)" stroke="#ddd" strokeWidth="1"/>
    <Rect x="14" y="22" width="12" height="8" rx="1" fill="#333"/>
    <Rect x="10" y="16" width="20" height="4" rx="1" fill="#333"/>
    <Circle cx="14" cy="18" r="1" fill="#666"/>
    <Circle cx="26" cy="18" r="1" fill="#666"/>
    <Circle cx="16" cy="30" r="1" fill="#666"/>
    <Circle cx="24" cy="30" r="1" fill="#666"/>
  </Svg>
);

const services: ServiceItem[] = [
  {
    id: 'reserve',
    title: 'Reserve',
    icon: <CalendarIcon />,
    description: 'Book appointments and reservations'
  },
  {
    id: 'hourly',
    title: 'Hourly',
    icon: <ClockIcon />,
    description: 'Hourly service bookings'
  },
  {
    id: 'rent',
    title: 'Rent',
    icon: <KeyIcon />,
    description: 'Rent equipment and vehicles'
  },
  {
    id: '2-wheels',
    title: '2-Wheels',
    icon: <BikeIcon />,
    description: 'Bicycle and motorcycle services'
  },
  {
    id: 'transit',
    title: 'Transit',
    icon: <TrainIcon />,
    description: 'Public transportation services'
  },
  {
    id: 'charter',
    title: 'Charter',
    icon: <BusIcon />,
    description: 'Charter bus and group transport'
  },
  {
    id: 'explore',
    title: 'Explore',
    icon: <RocketIcon />,
    description: 'Explore new places and experiences'
  },
  {
    id: 'travel',
    title: 'Travel',
    icon: <LuggageIcon />,
    description: 'Travel and vacation services'
  }
];

export default function ServicesGridScreen() {
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

  const handleServicePress = (service: ServiceItem) => {
    // Navigate to service details or booking screen
    // router.push(`/service/${service.id}`);
  };

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
          <Text 
            className="text-2xl font-bold text-black mb-2"
            style={{ fontFamily: 'Poppins-ExtraBold' }}
          >
            Choose Your Service
          </Text>
          <Text 
            className="text-base text-gray-600"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            Select the type of service you need
          </Text>
        </View>

        {/* Services Grid */}
        <ScrollView className="flex-1 px-4">
          <View className="flex-row flex-wrap justify-between">
            {services.map((service, index) => (
              <Animated.View
                key={service.id}
                style={{
                  width: '48%',
                  marginBottom: 16,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }}
              >
                <TouchableOpacity
                  onPress={() => handleServicePress(service)}
                  className="bg-gray-100 rounded-2xl p-6 items-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Icon Container */}
                  <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-3 shadow-sm">
                    {service.icon}
                  </View>
                  
                  {/* Service Title */}
                  <Text 
                    className="text-base font-semibold text-black text-center"
                    style={{ fontFamily: 'Poppins-SemiBold' }}
                  >
                    {service.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#6A9B00] rounded-xl py-4 px-6 items-center"
            activeOpacity={0.8}
          >
            <Text 
              className="text-black text-lg font-semibold"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
