import { JOB_TIMELINE } from '@/lib/jobTimelineTheme';
import { getVisitDeclinedDescription } from '@/utils/visitStatus';

export type NegotiationStepVisual = {
  description: string;
  status: string;
  isActive: boolean;
  isCompleted: boolean;
  isDeclined: boolean;
  isSkipped: boolean;
  accent: string;
  dotColor: string;
  lineColor: string;
  showRequestVisit?: boolean;
  canEdit?: boolean;
};

type Audience = 'client' | 'provider';

function pendingStep(description: string): NegotiationStepVisual {
  return {
    description,
    status: 'Pending',
    isActive: false,
    isCompleted: false,
    isDeclined: false,
    isSkipped: false,
    accent: '#F3F4F6',
    dotColor: JOB_TIMELINE.pendingDot,
    lineColor: JOB_TIMELINE.railMuted,
    showRequestVisit: false,
    canEdit: false,
  };
}

function activeStep(description: string, extras?: Partial<NegotiationStepVisual>): NegotiationStepVisual {
  return {
    description,
    status: 'Active',
    isActive: true,
    isCompleted: false,
    isDeclined: false,
    isSkipped: false,
    accent: '#FEF9C3',
    dotColor: JOB_TIMELINE.activeDot,
    lineColor: JOB_TIMELINE.activeDot,
    showRequestVisit: false,
    canEdit: false,
    ...extras,
  };
}

function skippedStep(description: string): NegotiationStepVisual {
  return {
    description,
    status: 'Skipped',
    isActive: false,
    isCompleted: false,
    isDeclined: false,
    isSkipped: true,
    accent: JOB_TIMELINE.pendingSoft,
    dotColor: JOB_TIMELINE.pendingDot,
    lineColor: JOB_TIMELINE.railMuted,
    showRequestVisit: false,
    canEdit: false,
  };
}

function completedStep(description: string, status = 'Done'): NegotiationStepVisual {
  return {
    description,
    status,
    isActive: false,
    isCompleted: true,
    isDeclined: false,
    isSkipped: false,
    accent: JOB_TIMELINE.completeSoft,
    dotColor: JOB_TIMELINE.sage,
    lineColor: JOB_TIMELINE.sage,
    showRequestVisit: false,
    canEdit: false,
  };
}

/** Inspection (visit) and quotation are parallel options — only one should be "active" at a time. */
export function getInspectionNegotiationStep(input: {
  audience: Audience;
  providerHasAccepted: boolean;
  quotationSent: boolean;
  hasVisitRequested: boolean;
  visitDeclined: boolean;
  visitPaid: boolean;
  visitScheduleText: string;
  visitRequest?: Record<string, unknown> | null;
}): NegotiationStepVisual {
  const {
    audience,
    providerHasAccepted,
    quotationSent,
    hasVisitRequested,
    visitDeclined,
    visitPaid,
    visitScheduleText,
    visitRequest,
  } = input;

  if (!providerHasAccepted) {
    return pendingStep(audience === 'provider' ? 'Accept before taking action.' : 'Waiting for a provider.');
  }

  if (quotationSent && !hasVisitRequested) {
    return skippedStep(
      audience === 'client' ? 'Chose quotation instead of visit.' : 'Direct quotation chosen.'
    );
  }

  if (quotationSent && hasVisitRequested) {
    return completedStep('Visit handled.');
  }

  if (visitDeclined && !quotationSent) {
    const declineNote = getVisitDeclinedDescription(visitRequest, audience);
    return activeStep(
      audience === 'provider'
        ? `${declineNote} Request a new visit or send a quote.`
        : `${declineNote} Provider can request again or send a quote.`,
      { showRequestVisit: audience === 'provider' }
    );
  }

  if (visitDeclined && quotationSent) {
    return skippedStep(
      audience === 'client' ? 'Visit skipped. Quotation in progress.' : 'Visit declined. Quotation sent.'
    );
  }

  if (hasVisitRequested) {
    if (visitPaid) {
      return completedStep(`Visit confirmed for ${visitScheduleText}.`);
    }
    return activeStep(
      `Visit requested for ${visitScheduleText}.`,
      { status: audience === 'client' ? 'Active' : 'Waiting' }
    );
  }

  return activeStep(
    audience === 'provider' ? 'Request a visit or quote directly.' : 'Waiting for inspection or quotation.',
    { showRequestVisit: audience === 'provider' }
  );
}

export function getQuotationNegotiationStep(input: {
  audience: Audience;
  providerHasAccepted: boolean;
  quotationSent: boolean;
  hasVisitRequested: boolean;
  visitDeclined: boolean;
  visitPaid: boolean;
  visitBlocksQuote: boolean;
}): NegotiationStepVisual {
  const {
    audience,
    providerHasAccepted,
    quotationSent,
    hasVisitRequested,
    visitDeclined,
    visitPaid,
    visitBlocksQuote,
  } = input;

  if (!providerHasAccepted) {
    return pendingStep(audience === 'provider' ? 'Send quote after accepting.' : 'No quote yet.');
  }

  if (quotationSent) {
    return completedStep(
      audience === 'client' ? 'Review the quote when ready.' : 'Waiting for client review.',
      audience === 'client' ? 'Received' : 'Sent'
    );
  }

  if (visitBlocksQuote) {
    return pendingStep('Visit payment comes first.');
  }

  if (visitDeclined && !quotationSent) {
    return pendingStep(
      audience === 'provider' ? 'Send a quote when ready.' : 'Waiting for quotation.'
    );
  }

  if (hasVisitRequested && visitPaid) {
    return activeStep(
      audience === 'provider' ? 'Prepare the quote after visit.' : 'Provider is preparing the quote.'
    );
  }

  if (!hasVisitRequested && !visitDeclined) {
    return pendingStep(
      audience === 'provider' ? 'Available if you send a quote directly.' : 'Waiting for quotation.'
    );
  }

  return pendingStep(audience === 'provider' ? 'Prepare the quote.' : 'Waiting for quotation.');
}

export function timelineStepBadgeLabel(step: {
  isCompleted?: boolean;
  isActive?: boolean;
  isDeclined?: boolean;
  isSkipped?: boolean;
  status?: string;
}): string {
  if (step.isCompleted) return 'Done';
  if (step.isDeclined) return 'Declined';
  if (step.isSkipped) return 'Skipped';
  if (step.isActive) return 'Active';
  return step.status || 'Pending';
}

export function timelineStepBadgeTextColor(step: {
  isCompleted?: boolean;
  isActive?: boolean;
  isDeclined?: boolean;
  isSkipped?: boolean;
}): string {
  if (step.isCompleted) return JOB_TIMELINE.sageChipText;
  if (step.isDeclined) return JOB_TIMELINE.declinedChipText;
  if (step.isSkipped) return JOB_TIMELINE.pendingChipText;
  if (step.isActive) return JOB_TIMELINE.activeChipText;
  return JOB_TIMELINE.pendingChipText;
}
