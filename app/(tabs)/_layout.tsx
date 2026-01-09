import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '@/hooks/useAuth';

type IconName = keyof typeof MaterialIcons.glyphMap;

const AnimatedIcon = ({ iconName, color, focused }: { iconName: IconName; color: string; focused: boolean }) => {
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

const CentralTabButton = ({ children, onPress }: BottomTabBarButtonProps) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          top: -14,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 58,
            height: 58,
            paddingTop: 13,
            borderRadius: 31,
            display: 'flex',
            backgroundColor: '#6A9B00',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 3,
            borderColor: '#FFFFFF',
          }}
        >
          {children}
        </View>
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Poppins-Medium',
          color: '#6A9B00',
          marginTop: -8,
          position: 'absolute',
          bottom: 0,
        }}
      >
   
      </Text>
    </View>
  );
};


export default function TabLayout() {
  const { role, isLoading } = useAuthRole();

  // While loading role from storage, avoid flicker
  if (isLoading) {
    return null;
  }

  // If user is a provider, they should not see client tabs
  if (role === 'provider') {
    return <Redirect href="/provider/home" />;
  }

  // If no role yet, send to account type selection
  if (!role) {
    return <Redirect href="/SelectAccountTypeScreen" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 75 : 65,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          marginHorizontal: 0,
          marginBottom: 0,
          position: 'absolute',
          bottom: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 6,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6A9B00',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins-Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="explore" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Request',
          tabBarLabel: '',
          tabBarIcon: () => <MaterialIcons name="add" size={30} color="white" />,
          tabBarButton: (props) => <CentralTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="assignment" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
