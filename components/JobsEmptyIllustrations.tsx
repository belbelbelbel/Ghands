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

/** Finished work — badge with checkmark */
export function CompletedJobsIllustration({ size = 148 }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx="80" cy="82" r="58" fill="#ECFDF3" />
      <Ellipse cx="80" cy="118" rx="34" ry="8" fill="#BBF7D0" opacity={0.45} />
      <Path
        d="M80 38 L104 52 V78 C104 96 94 110 80 118 C66 110 56 96 56 78 V52 L80 38Z"
        fill="#047857"
      />
      <Path
        d="M68 78 L76 86 L94 66"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="118" cy="48" r="6" fill="#34D399" opacity={0.8} />
      <Circle cx="42" cy="56" r="4" fill="#6EE7B7" opacity={0.7} />
      <Circle cx="126" cy="72" r="3" fill="#A7F3D0" />
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
