import { Tabs } from 'expo-router';
import { BarChart3, Home, Rocket, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar } from 'react-native';

const AnimatedIcon = ({ Icon, color, focused }: { Icon: any, color: string, focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: focused ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { rotate: rotate }
        ],
      }}
    >
      <Icon size={24} color={color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="black" 
        translucent={false}
        hidden={false}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 5,
          paddingTop: 10,
          borderRadius: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          position: 'absolute',
          bottom: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        tabBarHideOnKeyboard: true,
        tabBarAnimationEnabled: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ADF802',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon Icon={Rocket} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon Icon={BarChart3} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
      </Tabs>
    </>
  );
}
