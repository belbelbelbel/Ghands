import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Treat as tablet when the shorter window edge reaches this (iPad / large Android tablet). */
export const TABLET_MIN_SHORT_EDGE = 600;

/** Max width of the centered “phone lane” (pt). */
export const PHONE_LANE_MAX_WIDTH = 428;

export const PHONE_LANE_MIN_HEIGHT = 520;
export const PHONE_LANE_MAX_HEIGHT = 844;
export const PHONE_LANE_HEIGHT_FRACTION = 0.92;

/** Space from top of lane to content after skipping device top safe inset (tab shell). */
export const PHONE_LANE_OUTER_TOP = 14;

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
