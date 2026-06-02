/**
 * Vertical job progress timeline — sage olive for “done”, warm gold for “active”, calm neutrals for pending.
 */
export const JOB_TIMELINE = {
  sage: '#4F6739',
  completeSoft: 'rgba(79, 103, 57, 0.14)',
  sageChipText: '#2A3B1F',

  activeDot: '#C9A227',
  activeSoft: 'rgba(201, 162, 39, 0.18)',
  activeChipText: '#6B530E',

  infoSoft: 'rgba(37, 99, 235, 0.12)',
  infoChipText: '#1E3A8A',

  pendingDot: '#B8C4CE',
  pendingSoft: 'rgba(148, 163, 184, 0.18)',
  pendingChipText: '#5C6674',

  declinedDot: '#DC2626',
  declinedSoft: '#FEE2E2',
  declinedChipText: '#991B1B',

  railIdle: 'rgba(79, 103, 57, 0.12)',
  railMuted: 'rgba(148, 163, 184, 0.32)',

  rowBg: '#FAFBF9',
  rowBorder: 'rgba(45, 65, 24, 0.09)',

  dotShadow: '#1a2414',
  dotInactiveFill: '#E6EBE7',
} as const;

export function timelineChipText(step: { isCompleted?: boolean; isActive?: boolean; isDeclined?: boolean; isSkipped?: boolean }): string {
  if (step.isCompleted) return JOB_TIMELINE.sageChipText;
  if (step.isDeclined) return JOB_TIMELINE.declinedChipText;
  if (step.isSkipped) return JOB_TIMELINE.pendingChipText;
  if (step.isActive) return JOB_TIMELINE.activeChipText;
  return JOB_TIMELINE.pendingChipText;
}

export function timelineDotColor(step: { isCompleted?: boolean; isActive?: boolean; isPending?: boolean; isDeclined?: boolean }) {
  if (step.isCompleted) return JOB_TIMELINE.sage;
  if (step.isDeclined) return JOB_TIMELINE.declinedDot;
  if (step.isActive) return JOB_TIMELINE.activeDot;
  return JOB_TIMELINE.pendingDot;
}

export function timelineLineColor(step: { isCompleted?: boolean; isActive?: boolean; isPending?: boolean; isDeclined?: boolean }) {
  if (step.isCompleted) return JOB_TIMELINE.sage;
  if (step.isDeclined) return JOB_TIMELINE.declinedDot;
  if (step.isActive) return JOB_TIMELINE.activeDot;
  return JOB_TIMELINE.railMuted;
}

export function timelineAccentBg(step: { isCompleted?: boolean; isActive?: boolean; isPending?: boolean; isDeclined?: boolean }) {
  if (step.isCompleted) return JOB_TIMELINE.completeSoft;
  if (step.isDeclined) return JOB_TIMELINE.declinedSoft;
  if (step.isActive) return JOB_TIMELINE.activeSoft;
  return JOB_TIMELINE.pendingSoft;
}
