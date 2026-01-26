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

export const ProfileSkeleton = () => (
  <View className="items-center mb-8">
    <Skeleton width={128} height={128} borderRadius={64} />
    <Skeleton width={120} height={16} borderRadius={8} style={{ marginTop: 12 }} />
  </View>
);

export const QuotationCardSkeleton = () => {
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
    <Animated.View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        opacity: shimmerOpacity,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={12} borderRadius={6} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <View style={{ marginBottom: 12 }}>
        <Skeleton width="60%" height={12} borderRadius={6} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={12} borderRadius={6} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="50%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width="70%" height={16} borderRadius={8} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Skeleton width="60%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={12} borderRadius={6} />
        </View>
      </View>
    </Animated.View>
  );
};

export const TransactionCardSkeleton = () => {
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
    <Animated.View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        opacity: shimmerOpacity,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={14} borderRadius={7} style={{ marginBottom: 6 }} />
          <Skeleton width="90%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
          <Skeleton width="50%" height={11} borderRadius={6} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Skeleton width={60} height={16} borderRadius={8} style={{ marginBottom: 4 }} />
          <Skeleton width={40} height={12} borderRadius={6} />
        </View>
      </View>
    </Animated.View>
  );
};

export const JobCardSkeleton = () => {
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
    <Animated.View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        opacity: shimmerOpacity,
      }}
    >
      {/* Header with user info and images */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          {/* User avatar and name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width="60%" height={14} borderRadius={7} style={{ marginBottom: 4 }} />
              <Skeleton width="40%" height={12} borderRadius={6} />
            </View>
          </View>
          
          {/* Date/Time */}
          <Skeleton width="50%" height={12} borderRadius={6} style={{ marginBottom: 3 }} />
          
          {/* Location */}
          <Skeleton width="70%" height={12} borderRadius={6} style={{ marginBottom: 10 }} />
        </View>
        
        {/* Images placeholder */}
        <View style={{ flexDirection: 'row', gap: -6, marginLeft: 10 }}>
          <Skeleton width={40} height={40} borderRadius={8} />
          <Skeleton width={40} height={40} borderRadius={8} />
          <Skeleton width={40} height={40} borderRadius={8} />
        </View>
      </View>
      
      {/* Button skeleton */}
      <Skeleton width="100%" height={44} borderRadius={8} />
    </Animated.View>
  );
};

export const JobHistoryCardSkeleton = () => {
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
    <Animated.View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
        opacity: shimmerOpacity,
      }}
    >
      {/* Time badge (top left) */}
      <Skeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 8 }} />

      {/* Status badge */}
      <Skeleton width={90} height={24} borderRadius={12} style={{ marginBottom: 12, alignSelf: 'flex-start' }} />

      {/* Client/Provider Info with Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 50 }}>
        <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="60%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={14} borderRadius={7} />
        </View>
      </View>

      {/* Date/Time with icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
        <Skeleton width="50%" height={14} borderRadius={7} />
      </View>

      {/* Location with icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
        <Skeleton width="70%" height={14} borderRadius={7} />
      </View>

      {/* Action Button */}
      <Skeleton width="100%" height={44} borderRadius={8} />

      {/* Images placeholder (absolute positioned, top right) */}
      <View style={{ position: 'absolute', right: 16, top: 60, flexDirection: 'row', gap: -6 }}>
        <Skeleton width={40} height={40} borderRadius={8} />
        <Skeleton width={40} height={40} borderRadius={8} />
        <Skeleton width={40} height={40} borderRadius={8} />
      </View>
    </Animated.View>
  );
};

export default Skeleton;

