import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Treat as tablet when the shorter window edge reaches this (iPad / large Android tablet). */
export const TABLET_MIN_SHORT_EDGE = 600;

/** Max width of the centered “phone lane” on tablets (pt). Wider = more horizontal space for content. */
export const PHONE_LANE_MAX_WIDTH = 520;

export const PHONE_LANE_MIN_HEIGHT = 600;
/** Upper cap (pt) for the framed app height on tablets (large iPads can approach this) */
export const PHONE_LANE_MAX_HEIGHT = 1180;
/** Share of available height (between safe insets) used for the phone lane — higher = taller app frame */
export const PHONE_LANE_HEIGHT_FRACTION = 0.998;

/** Space from top of lane to content after skipping device top safe inset (tab shell). */
export const PHONE_LANE_OUTER_TOP = 14;

/** Horizontal padding for client home scroll sections (tighter = wider content). */
export const CLIENT_HOME_SCROLL_GUTTER = 12;

/** Shared top padding for main vertical scroll content on tab screens (tablet). */
export const TAB_SCROLL_TOP = 32;

export function isTabletSize(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_MIN_SHORT_EDGE;
}

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return useMemo(() => isTabletSize(width, height), [width, height]);
}

/**
 * Use on primary tab screens: on tablet returns {@link TAB_SCROLL_TOP}; on phone returns `phoneValue`.
 */
export function useTabScrollContentPaddingTop(phoneValue: number): number {
  const isTablet = useIsTablet();
  return isTablet ? TAB_SCROLL_TOP : phoneValue;
}

export function computePhoneLaneHeight(windowHeight: number, topInset: number, bottomInset: number): number {
  const availableH = windowHeight - topInset - bottomInset;
  return Math.min(
    PHONE_LANE_MAX_HEIGHT,
    Math.max(PHONE_LANE_MIN_HEIGHT, Math.floor(availableH * PHONE_LANE_HEIGHT_FRACTION))
  );
}

/**
 * Max width for toasts, banners, and centered overlays so they don’t stretch edge-to-edge on
 * tablets or in landscape. Updates on rotation via {@link useWindowDimensions}.
 */
export function useNarrowOverlayMaxWidth(horizontalGutter: number = 32): number {
  const { width } = useWindowDimensions();
  return useMemo(
    () => Math.min(PHONE_LANE_MAX_WIDTH, Math.max(0, width - horizontalGutter)),
    [width, horizontalGutter]
  );
}

/**
 * Whether the shortest side is phone-sized (narrow) — useful for tightening padding on small Android phones.
 */
export function useIsCompactPhone(): boolean {
  const { width, height } = useWindowDimensions();
  return useMemo(() => Math.min(width, height) < 360, [width, height]);
}

/**
 * Client app bottom tab bar — base row height (icons + labels), before system home/gesture inset.
 * Tab bar uses `position: 'absolute'`, so scroll content must pad by the full visual height + inset.
 */
export const CLIENT_TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 75 : 65;
export const CLIENT_TAB_BAR_PADDING_BOTTOM = Platform.OS === 'ios' ? 8 : 6;

/** Provider tabs use the same measurements for consistency. */
export const PROVIDER_TAB_BAR_BASE_HEIGHT = CLIENT_TAB_BAR_BASE_HEIGHT;
export const PROVIDER_TAB_BAR_PADDING_BOTTOM = CLIENT_TAB_BAR_PADDING_BOTTOM;

/**
 * Total height of the floating tab bar including bottom safe area (gesture bar / home indicator).
 */
export function useBottomTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => CLIENT_TAB_BAR_BASE_HEIGHT + insets.bottom,
    [insets.bottom]
  );
}

/**
 * ScrollView / FlatList `contentContainerStyle.paddingBottom` on tab screens (tab bar + gap).
 */
export function useTabScreenScrollBottomPadding(extraGap: number = 12): number {
  const barH = useBottomTabBarHeight();
  return useMemo(() => barH + extraGap, [barH, extraGap]);
}

/**
 * Fixed spacer `View` height at end of scroll (same idea as padding).
 */
export function useTabScreenBottomSpacerHeight(extraGap: number = 12): number {
  return useTabScreenScrollBottomPadding(extraGap);
}
