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

export const CategorySkeleton = () => (
  <View className="mb-4 p-4 bg-white rounded-2xl border border-gray-200">
    <View className="flex-row items-center">
      <Skeleton width={64} height={64} borderRadius={12} />
      <View className="flex-1 ml-4">
        <Skeleton width="60%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={12} borderRadius={8} style={{ marginBottom: 4 }} />
        <Skeleton width="40%" height={12} borderRadius={8} />
      </View>
    </View>
  </View>
);

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

