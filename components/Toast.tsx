import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void; // Optional - will use no-op function if not provided
  visible: boolean;
}

const TOAST_CONFIG = {
  success: {
    bgColor: '#DCFCE7',
    textColor: '#166534',
    icon: 'checkmark-circle' as const,
    iconColor: '#22C55E',
  },
  error: {
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    icon: 'close-circle' as const,
    iconColor: '#EF4444',
  },
  info: {
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    icon: 'information-circle' as const,
    iconColor: '#3B82F6',
  },
  warning: {
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    icon: 'warning' as const,
    iconColor: '#F59E0B',
  },
};

export default function Toast({ message, type = 'info', duration = 3000, onClose, visible }: ToastProps) {
  // Ensure onClose is always a function
  const safeOnClose = onClose || (() => {});
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible, duration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      safeOnClose();
    });
  };

  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  return (
    <View
      className="absolute top-12 left-4 right-4 z-50"
      style={{
        pointerEvents: 'box-none',
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }}
      >
        <View
          className="rounded-2xl px-4 py-4 flex-row items-center shadow-lg"
          style={{
            backgroundColor: config.bgColor,
            maxWidth: SCREEN_WIDTH - 32,
          }}
        >
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
          <Text
            className="flex-1 ml-3 text-sm"
            style={{
              fontFamily: 'Poppins-Medium',
              color: config.textColor,
            }}
          >
            {message}
          </Text>
          <TouchableOpacity onPress={handleClose} className="ml-2" activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={config.textColor} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

