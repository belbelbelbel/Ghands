import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type IconName = keyof typeof MaterialIcons.glyphMap;

const AnimatedIcon = ({ iconName, color, focused }: { iconName: IconName, color: string, focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -2 : 0,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ],
        opacity: opacityAnim,
      }}
    >
      <MaterialIcons name={iconName} size={24} color={color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
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
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6A9B00',
        tabBarInactiveTintColor: '#000000',
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
            <AnimatedIcon iconName="home" color={color} focused={focused} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="apps" color={color} focused={focused} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="explore" color={color} focused={focused} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="chat" color={color} focused={focused} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="person" color={color} focused={focused} />
          ),
        }}
      />
      </Tabs>
  );
}
