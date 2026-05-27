import { useAuthRole } from '@/hooks/useAuth';
import { ScreenBootLoader } from '@/components/ScreenBootLoader';
import { Colors } from '@/lib/designSystem';
import { PROVIDER_TAB_BAR_BASE_HEIGHT } from '@/lib/tabletLayout';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof MaterialIcons.glyphMap;

const AnimatedIcon = ({ iconName, color, focused }: { iconName: IconName; color: string; focused: boolean }) => {
  const lift = Platform.OS === 'android' ? -1 : -2;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
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
        toValue: focused ? lift : 0,
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
      <MaterialIcons name={iconName} size={Platform.OS === 'android' ? 19 : 20} color={color} />
    </Animated.View>
  );
};

export default function ProviderLayout() {
  const { role, isLoading } = useAuthRole();
  const insets = useSafeAreaInsets();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(17, 24, 39, 0.1)',
      height: PROVIDER_TAB_BAR_BASE_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom,
      paddingTop: 2,
      marginHorizontal: 0,
      marginBottom: 0,
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    }),
    [insets.bottom]
  );

  if (isLoading) {
    return <ScreenBootLoader />;
  }

  if (role === 'client') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (role !== 'provider') {
    return <Redirect href="/ProviderSignInScreen" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarItemStyle: { paddingVertical: 0, marginTop: 0 },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Poppins-Medium',
          marginTop: 0,
          marginBottom: 0,
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
        name="quotations"
        options={{
          title: 'Quotations',
          tabBarLabel: 'Quotations',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="description" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon iconName="account-balance-wallet" color={color} focused={focused} />
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
