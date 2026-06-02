import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';

type IllustrationProps = {
  size?: number;
};

/** Active / ongoing work — briefcase with progress ring */
export function OngoingJobsIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#F2F8EA" />
      <Circle cx="80" cy="82" r="44" stroke="#C8D9B4" strokeWidth="3" strokeDasharray="8 6" opacity={0.7} />
      <Rect x="50" y="62" width="60" height="44" rx="10" fill="#4F6739" />
      <Rect x="66" y="52" width="28" height="14" rx="5" fill="#3D5230" />
      <Rect x="58" y="78" width="44" height="6" rx="3" fill="#6B8A52" opacity={0.85} />
      <Rect x="58" y="90" width="30" height="5" rx="2.5" fill="#6B8A52" opacity={0.55} />
      <Path
        d="M108 98 L118 108 L138 84"
        stroke="#16A34A"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Waiting / pending — clipboard with clock */
export function PendingJobsIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#FFF7DF" />
      <Rect x="48" y="44" width="64" height="84" rx="12" fill="#FFFFFF" stroke="#F5D98A" strokeWidth="2" />
      <Rect x="68" y="36" width="24" height="16" rx="6" fill="#F59E0B" />
      <Rect x="58" y="62" width="44" height="5" rx="2.5" fill="#FDE68A" />
      <Rect x="58" y="74" width="36" height="5" rx="2.5" fill="#FDE68A" />
      <Rect x="58" y="86" width="40" height="5" rx="2.5" fill="#FDE68A" />
      <Circle cx="108" cy="108" r="22" fill="#F59E0B" />
      <Circle cx="108" cy="108" r="16" fill="#FFFBEB" />
      <Path d="M108 100 V108 L114 112" stroke="#92400E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Finished work — checklist (matches pending/ongoing style) */
export function CompletedJobsIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#F2F8EA" />
      <Rect x="48" y="44" width="64" height="84" rx="12" fill="#FFFFFF" stroke="#C8D9B4" strokeWidth="2" />
      <Rect x="68" y="36" width="24" height="16" rx="6" fill="#4F6739" />
      <Circle cx="62" cy="68" r="9" fill="#16A34A" />
      <Path d="M57 68 L60.5 71.5 L67 64" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="76" y="64" width="28" height="5" rx="2.5" fill="#E8F0E0" />
      <Circle cx="62" cy="88" r="9" fill="#16A34A" />
      <Path d="M57 88 L60.5 91.5 L67 84" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="76" y="84" width="32" height="5" rx="2.5" fill="#E8F0E0" />
      <Circle cx="62" cy="108" r="9" fill="#16A34A" />
      <Path d="M57 108 L60.5 111.5 L67 104" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="76" y="104" width="24" height="5" rx="2.5" fill="#E8F0E0" />
      <Circle cx="108" cy="108" r="22" fill="#4F6739" />
      <Path d="M100 108 L106 114 L118 100" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** No quotations — document with price tag */
export function QuotationsEmptyIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#F2F8EA" />
      <G transform="rotate(-6, 80, 82)">
        <Rect x="46" y="48" width="68" height="88" rx="12" fill="#FFFFFF" stroke="#C8D9B4" strokeWidth="2" />
        <Rect x="58" y="66" width="44" height="5" rx="2.5" fill="#E8F0E0" />
        <Rect x="58" y="78" width="36" height="5" rx="2.5" fill="#E8F0E0" />
        <Rect x="58" y="90" width="40" height="5" rx="2.5" fill="#E8F0E0" />
        <Rect x="58" y="108" width="28" height="5" rx="2.5" fill="#E8F0E0" />
      </G>
      <Circle cx="110" cy="106" r="22" fill="#4F6739" />
      <Path d="M102 106 H118 M110 98 V114" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Cancelled — document with soft X */
export function CancelledJobsIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#FEF2F2" />
      <G transform="rotate(-8, 80, 82)">
        <Rect x="46" y="48" width="68" height="88" rx="12" fill="#FFFFFF" stroke="#FECACA" strokeWidth="2" />
        <Rect x="58" y="66" width="44" height="5" rx="2.5" fill="#FEE2E2" />
        <Rect x="58" y="78" width="36" height="5" rx="2.5" fill="#FEE2E2" />
        <Rect x="58" y="90" width="40" height="5" rx="2.5" fill="#FEE2E2" />
      </G>
      <Circle cx="108" cy="108" r="22" fill="#DC2626" />
      <Path d="M100 100 L116 116 M116 100 L100 116" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

export type JobsEmptyVariant = 'ongoing' | 'pending' | 'completed' | 'cancelled';

export function JobsEmptyIllustration({
  variant,
  size = 148,
}: {
  variant: JobsEmptyVariant;
  size?: number;
}) {
  switch (variant) {
    case 'pending':
      return <PendingJobsIllustration size={size} />;
    case 'completed':
      return <CompletedJobsIllustration size={size} />;
    case 'cancelled':
      return <CancelledJobsIllustration size={size} />;
    case 'ongoing':
    default:
      return <OngoingJobsIllustration size={size} />;
  }
}
