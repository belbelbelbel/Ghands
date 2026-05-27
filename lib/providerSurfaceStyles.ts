import { BorderRadius, Colors } from './designSystem';

/** White list / action tiles on provider home, wallet, jobs, quotations, and related tabs. */
export const providerHomeSurface = {
  backgroundColor: Colors.white,
  borderRadius: BorderRadius.default,
  borderWidth: 1,
  borderColor: Colors.border,
} as const;

export const providerHomeSurfacePadding = 14;

/** List cards — border only, no shadow/elevation. */
export const providerListCard = {
  ...providerHomeSurface,
  padding: providerHomeSurfacePadding,
} as const;

export const providerHomeActionButton = {
  ...providerHomeSurface,
  paddingVertical: 10,
  paddingHorizontal: 12,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export const providerHomeActionLabel = {
  fontSize: 13,
  fontFamily: 'Poppins-SemiBold' as const,
  color: Colors.textPrimary,
};

export const providerDeclineButton = {
  ...providerHomeActionButton,
  borderColor: Colors.errorBorder,
  backgroundColor: Colors.errorLight,
};

export const providerProceedButton = {
  ...providerHomeActionButton,
  backgroundColor: Colors.accent,
  borderColor: Colors.accent,
};

export const providerProceedLabel = {
  ...providerHomeActionLabel,
  color: Colors.white,
};

export const providerHomeSectionTitle = {
  fontSize: 16,
  fontFamily: 'Poppins-SemiBold' as const,
  color: Colors.textPrimary,
  marginBottom: 10,
};

export const providerHomeViewAllLabel = {
  fontSize: 13,
  fontFamily: 'Poppins-SemiBold' as const,
  color: Colors.accent,
};

/** Full-width underline tabs (jobs, quotations, activity, job details). */
export const providerUnderlineTabRow = {
  flexDirection: 'row' as const,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
};

export function providerUnderlineTabItem(isActive: boolean) {
  return {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center' as const,
    borderBottomWidth: isActive ? 2 : 0,
    borderBottomColor: isActive ? Colors.accent : 'transparent',
  };
}

export function providerUnderlineTabLabel(isActive: boolean) {
  return {
    fontSize: 14,
    fontFamily: (isActive ? 'Poppins-SemiBold' : 'Poppins-Regular') as 'Poppins-SemiBold' | 'Poppins-Regular',
    color: isActive ? Colors.textPrimary : Colors.textSecondaryDark,
  };
}
