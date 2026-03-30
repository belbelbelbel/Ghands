import { BorderRadius, BORDER_WIDTH, Colors, SHADOWS } from '@/lib/designSystem';
import {
  computePhoneLaneHeight,
  isTabletSize,
  PHONE_LANE_MAX_WIDTH,
} from '@/lib/tabletLayout';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
};

/**
 * Single root “phone column” on large tablets. Phones render children full-bleed unchanged.
 */
export default function TabletRootFrame({ children }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = isTabletSize(width, height);

  if (!isTablet) {
    return <>{children}</>;
  }

  const laneHeight = computePhoneLaneHeight(height, insets.top, insets.bottom);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.tabletBackdrop,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        // Side breathing room on large tablets + respect landscape safe areas
        paddingHorizontal: 16 + Math.max(insets.left, insets.right),
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={[
            SHADOWS.lg,
            {
              width: '100%',
              maxWidth: PHONE_LANE_MAX_WIDTH,
              height: laneHeight,
              borderRadius: BorderRadius.xl,
              borderWidth: BORDER_WIDTH.thin,
              borderColor: Colors.border,
              backgroundColor: Colors.backgroundLight,
              overflow: 'hidden',
            },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
