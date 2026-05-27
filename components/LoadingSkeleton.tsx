import { SHIMMER_PALETTE, useShimmerAnimation } from '@/hooks/useShimmerAnimation';
import { BorderRadius, Colors } from '@/lib/designSystem';
import { providerHomeSurface, providerHomeSurfacePadding, providerListCard } from '@/lib/providerSurfaceStyles';
import { PROVIDER_TAB_GUTTER } from '@/lib/tabletLayout';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import SafeAreaWrapper from './SafeAreaWrapper';
import { SageHeroPanel } from './provider/SageHeroPanel';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Frost shimmer for sage hero panels */
  variant?: 'default' | 'sage';
}

function ShimmerOverlay({
  variant,
}: {
  variant: 'default' | 'sage';
  borderRadius?: number;
}) {
  const { translateX, translateY, shimmerWidth, shimmerRotate } = useShimmerAnimation();
  const palette = SHIMMER_PALETTE[variant];

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '-140%',
        bottom: '-140%',
        width: shimmerWidth,
        transform: [{ translateX }, { translateY }, { rotate: shimmerRotate }],
      }}
    >
      <LinearGradient
        colors={[
          'transparent',
          palette.edge,
          palette.highlight,
          palette.highlight,
          palette.edge,
          'transparent',
        ]}
        locations={[0, 0.28, 0.44, 0.56, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'default',
}: SkeletonProps) => {
  const palette = SHIMMER_PALETTE[variant];
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const backgroundColor =
    typeof flatStyle.backgroundColor === 'string' ? flatStyle.backgroundColor : palette.base;

  return (
    <View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          backgroundColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <ShimmerOverlay variant={variant} />
    </View>
  );
};

function SkeletonCardShell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          ...providerHomeSurface,
          padding: providerHomeSurfacePadding,
          marginBottom: 12,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const CategoryChipSkeleton = () => (
  <View style={{ width: 98, marginRight: 12 }}>
    <View
      style={{
        borderRadius: 16,
        backgroundColor: Colors.white,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <Skeleton width={48} height={48} borderRadius={14} style={{ marginBottom: 8 }} />
      <Skeleton width={56} height={11} borderRadius={5} />
    </View>
  </View>
);

export const CategorySkeleton = () => (
  <View
    style={{
      width: '100%',
      backgroundColor: Colors.white,
      borderRadius: 16,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    }}
  >
    <Skeleton width={72} height={72} borderRadius={12} style={{ marginRight: 16 }} />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Skeleton width="60%" height={16} borderRadius={8} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
      <Skeleton width="40%" height={11} borderRadius={6} />
    </View>
    <Skeleton
      width={24}
      height={24}
      borderRadius={12}
      style={{ position: 'absolute', right: 8, top: '50%', marginTop: -12 }}
    />
  </View>
);

export const ProfileSkeleton = () => (
  <View className="items-center mb-8">
    <Skeleton width={128} height={128} borderRadius={64} />
    <Skeleton width={120} height={16} borderRadius={8} style={{ marginTop: 12 }} />
  </View>
);

export const QuotationCardSkeleton = () => (
  <SkeletonCardShell>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Skeleton width="82%" height={15} borderRadius={7} style={{ marginBottom: 6 }} />
        <Skeleton width="55%" height={12} borderRadius={6} />
      </View>
      <Skeleton width={88} height={28} borderRadius={12} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
      <View>
        <Skeleton width={72} height={11} borderRadius={5} style={{ marginBottom: 4 }} />
        <Skeleton width={120} height={18} borderRadius={8} />
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Skeleton width={36} height={11} borderRadius={5} style={{ marginBottom: 4 }} />
        <Skeleton width={64} height={12} borderRadius={6} />
      </View>
    </View>
    <Skeleton width="100%" height={38} borderRadius={12} style={{ marginTop: 4 }} />
  </SkeletonCardShell>
);

export const QuotationListSkeleton = ({ count = 4 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <QuotationCardSkeleton key={i} />
    ))}
  </>
);

export const WalletHeroSkeleton = ({ variant = 'client' }: { variant?: 'client' | 'provider' }) => (
  <SageHeroPanel style={{ marginTop: 12, marginBottom: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Skeleton width={128} height={10} borderRadius={4} variant="sage" style={{ marginBottom: 6 }} />
        <Skeleton width={108} height={14} borderRadius={6} variant="sage" />
      </View>
      <Skeleton width={30} height={30} borderRadius={15} variant="sage" />
    </View>
    <Skeleton width="72%" height={30} borderRadius={8} variant="sage" style={{ marginBottom: 12 }} />
    {variant === 'provider' ? (
      <Skeleton width={196} height={34} borderRadius={999} variant="sage" />
    ) : (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <View style={{ flex: 1 }}>
          <Skeleton width={88} height={10} borderRadius={4} variant="sage" style={{ marginBottom: 6 }} />
          <Skeleton width={36} height={15} borderRadius={6} variant="sage" />
        </View>
        <View
          style={{
            width: 1,
            height: 28,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            marginHorizontal: 14,
          }}
        />
        <View style={{ flex: 1 }}>
          <Skeleton width={72} height={10} borderRadius={4} variant="sage" style={{ marginBottom: 6 }} />
          <Skeleton width={52} height={15} borderRadius={6} variant="sage" />
        </View>
      </View>
    )}
  </SageHeroPanel>
);

export const WalletActionButtonsSkeleton = () => (
  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
    <Skeleton height={40} borderRadius={BorderRadius.default} style={{ flex: 1 }} />
    <Skeleton height={40} borderRadius={BorderRadius.default} style={{ flex: 1 }} />
  </View>
);

export const WalletActivitySkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <Skeleton width={120} height={16} borderRadius={8} />
      <Skeleton width={72} height={13} borderRadius={6} />
    </View>
    {Array.from({ length: count }).map((_, i) => (
      <TransactionCardSkeleton key={i} />
    ))}
  </>
);

/** Provider home — location row + welcome line */
export const ProviderDashboardHeaderSkeleton = () => (
  <View style={{ marginBottom: 4 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width="58%" height={14} borderRadius={7} />
      </View>
      <Skeleton width={38} height={38} borderRadius={19} />
    </View>
    <Skeleton width="64%" height={22} borderRadius={8} style={{ marginTop: 12 }} />
  </View>
);

/** Provider home — earnings sage card */
export const ProviderEarningsSkeleton = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <SageHeroPanel style={[{ marginHorizontal: PROVIDER_TAB_GUTTER }, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Skeleton width={168} height={14} borderRadius={6} variant="sage" />
      <Skeleton width={88} height={28} borderRadius={999} variant="sage" />
    </View>
    <Skeleton width="68%" height={30} borderRadius={8} variant="sage" style={{ marginBottom: 12 }} />
    <Skeleton width={148} height={34} borderRadius={999} variant="sage" />
  </SageHeroPanel>
);

/** Provider home — quick action row (matches Add Service / Invite Friends) */
export const ProviderQuickActionsSkeleton = () => (
  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
    <Skeleton height={40} borderRadius={BorderRadius.default} style={{ flex: 1 }} />
    <Skeleton height={40} borderRadius={BorderRadius.default} style={{ flex: 1 }} />
  </View>
);

/** Provider home — job cards only (section titles stay real) */
export const ProviderJobListSkeleton = ({ count = 2 }: { count?: number }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <JobCardSkeleton key={i} />
    ))}
  </View>
);

export const TransactionCardSkeleton = () => (
  <SkeletonCardShell>
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
    <Skeleton width="100%" height={38} borderRadius={12} style={{ marginTop: 10 }} />
  </SkeletonCardShell>
);

/** Inline amount + trend placeholders inside an existing sage panel */
export const SageAmountSkeleton = () => (
  <View>
    <Skeleton width="72%" height={28} borderRadius={8} variant="sage" style={{ marginBottom: 10 }} />
    <Skeleton width={148} height={32} borderRadius={999} variant="sage" />
  </View>
);

/** Compact job card — fewer blocks, cleaner silhouette */
export const JobCardSkeleton = () => (
  <SkeletonCardShell style={{ marginBottom: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="62%" height={14} borderRadius={7} style={{ marginBottom: 5 }} />
        <Skeleton width="42%" height={12} borderRadius={6} />
      </View>
    </View>
    <Skeleton width="78%" height={12} borderRadius={6} style={{ marginBottom: 4 }} />
    <Skeleton width="54%" height={12} borderRadius={6} style={{ marginBottom: 12 }} />
    <Skeleton width="100%" height={36} borderRadius={12} />
  </SkeletonCardShell>
);

export const JobHistoryCardSkeleton = () => (
  <SkeletonCardShell style={{ position: 'relative' }}>
    <Skeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
    <Skeleton width={90} height={24} borderRadius={12} style={{ marginBottom: 12, alignSelf: 'flex-start' }} />
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 50 }}>
      <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={14} borderRadius={7} />
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
      <Skeleton width="50%" height={14} borderRadius={7} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
      <Skeleton width="70%" height={14} borderRadius={7} />
    </View>
    <Skeleton width="100%" height={38} borderRadius={12} />
    <View style={{ position: 'absolute', right: 14, top: 52, flexDirection: 'row', gap: 4 }}>
      <Skeleton width={40} height={40} borderRadius={8} />
      <Skeleton width={40} height={40} borderRadius={8} />
      <Skeleton width={40} height={40} borderRadius={8} />
    </View>
  </SkeletonCardShell>
);

export const NotificationCardSkeleton = () => (
  <View
    style={{
      flexDirection: 'row',
      marginBottom: 10,
      ...providerListCard,
      paddingVertical: 10,
      paddingHorizontal: 12,
      minHeight: 72,
      overflow: 'hidden',
    }}
  >
    <Skeleton width={36} height={36} borderRadius={14} style={{ marginRight: 10 }} />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Skeleton width="40%" height={10} borderRadius={6} style={{ marginBottom: 7 }} />
      <Skeleton width="90%" height={9} borderRadius={6} style={{ marginBottom: 5 }} />
      <Skeleton width="60%" height={9} borderRadius={6} />
    </View>
  </View>
);

/** Vertical timeline rail + cards — matches provider/client job details */
export const JobDetailsTimelineSkeleton = ({ steps = 3 }: { steps?: number }) => (
  <View>
    {Array.from({ length: steps }).map((_, i) => (
      <View key={i} style={{ flexDirection: 'row', marginBottom: i < steps - 1 ? 14 : 0 }}>
        <View style={{ alignItems: 'center', marginRight: 12 }}>
          <Skeleton width={30} height={30} borderRadius={15} />
          {i < steps - 1 ? (
            <Skeleton width={2} height={52} borderRadius={1} style={{ marginTop: 6, flex: 1, minHeight: 30 }} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: 'rgba(17, 24, 39, 0.06)',
              padding: 14,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Skeleton width="52%" height={14} borderRadius={7} />
              <Skeleton width={44} height={22} borderRadius={12} />
            </View>
            <Skeleton width="78%" height={12} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width="36%" height={10} borderRadius={5} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

/** Provider Updates tab — client row, status pill, timeline (matches ProviderJobDetailsScreen). */
export const ProviderJobUpdatesTabSkeleton = () => (
  <View>
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(17, 24, 39, 0.045)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={42} height={42} borderRadius={21} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="46%" height={15} borderRadius={7} style={{ marginBottom: 6 }} />
          <Skeleton width="28%" height={11} borderRadius={5} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginLeft: 8 }} />
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginLeft: 8 }} />
      </View>
    </View>

    <View
      style={{
        marginBottom: 16,
        borderRadius: 18,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
      }}
    >
      <View
        style={{
          backgroundColor: '#EEF0F3',
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Skeleton width="56%" height={16} borderRadius={8} style={{ flex: 1, marginRight: 12 }} />
        <Skeleton width={72} height={24} borderRadius={12} />
      </View>
    </View>

    <View style={{ ...providerListCard, padding: 16, marginBottom: 16 }}>
      <Skeleton width={108} height={17} borderRadius={8} style={{ marginBottom: 14 }} />
      <JobDetailsTimelineSkeleton steps={3} />
    </View>
  </View>
);

/** Scroll body — status card + timeline (client job details Updates tab) */
export const JobDetailsContentSkeleton = () => (
  <View style={{ flex: 1 }}>
    <View
      style={{
        marginBottom: 16,
        borderRadius: 18,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
      }}
    >
      <View
        style={{
          backgroundColor: '#EEF0F3',
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Skeleton width="56%" height={16} borderRadius={8} style={{ flex: 1, marginRight: 12 }} />
        <Skeleton width={72} height={24} borderRadius={12} />
      </View>
    </View>

    <View style={{ ...providerListCard, padding: 16, marginBottom: 16 }}>
      <Skeleton width={108} height={17} borderRadius={8} style={{ marginBottom: 14 }} />
      <JobDetailsTimelineSkeleton steps={3} />
    </View>
  </View>
);

export const JobDetailsTabsSkeleton = () => (
  <View
    style={{
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      marginBottom: 16,
    }}
  >
    {[72, 88].map((w, i) => (
      <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
        <Skeleton width={w} height={14} borderRadius={7} />
      </View>
    ))}
  </View>
);

/** Full job details loading shell — header, tabs, scroll content */
export const JobDetailsScreenSkeleton = () => (
  <SafeAreaWrapper backgroundColor={Colors.white}>
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: PROVIDER_TAB_GUTTER,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <Skeleton width="44%" height={22} borderRadius={8} />
      </View>

      <View style={{ paddingHorizontal: PROVIDER_TAB_GUTTER }}>
        <JobDetailsTabsSkeleton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: PROVIDER_TAB_GUTTER,
          paddingBottom: 120,
        }}
      >
        <ProviderJobUpdatesTabSkeleton />
      </ScrollView>
    </View>
  </SafeAreaWrapper>
);

export default Skeleton;
