import React from 'react';
import { Animated, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CategorySkeleton = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.9, 0.4],
  });

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Icon Container Skeleton */}
      <Animated.View
        style={{
          backgroundColor: '#E5E7EB',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          padding: 16,
          marginRight: 16,
          width: 72, // 40px icon + 32px padding (16*2)
          height: 72,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: shimmerOpacity,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#D1D5DB',
          }}
        />
      </Animated.View>

      {/* Content Container */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {/* Title Skeleton */}
        <Animated.View
          style={{
            width: '60%',
            height: 16,
            borderRadius: 8,
            backgroundColor: '#E5E7EB',
            marginBottom: 6,
            opacity: shimmerOpacity,
          }}
        />

        {/* Description Skeleton */}
        <Animated.View
          style={{
            width: '80%',
            height: 12,
            borderRadius: 6,
            backgroundColor: '#E5E7EB',
            marginBottom: 4,
            opacity: shimmerOpacity,
          }}
        />

        {/* Provider Count Skeleton */}
        <Animated.View
          style={{
            width: '40%',
            height: 11,
            borderRadius: 6,
            backgroundColor: '#E5E7EB',
            alignSelf: 'flex-start',
            opacity: shimmerOpacity,
          }}
        />

        {/* Radio Button Skeleton (absolute positioned) */}
        <Animated.View
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            marginTop: -12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#E5E7EB',
            opacity: shimmerOpacity,
          }}
        />
      </View>
    </View>
  );
};

export const JobCardSkeleton = () => (
  <View className="mb-4 p-5 bg-white rounded-2xl border border-gray-200">
    <View className="flex-row justify-between mb-3">
      <View className="flex-1">
        <Skeleton width="70%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} borderRadius={8} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
    <Skeleton width="100%" height={12} borderRadius={8} style={{ marginBottom: 8 }} />
    <Skeleton width="100%" height={12} borderRadius={8} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={12} borderRadius={8} />
  </View>
);

export const ProfileSkeleton = () => (
  <View className="items-center mb-8">
    <Skeleton width={128} height={128} borderRadius={64} />
    <Skeleton width={120} height={16} borderRadius={8} style={{ marginTop: 12 }} />
  </View>
);

export default Skeleton;

