export type VisitDeclineActor = 'client' | 'provider' | 'unknown';

const VISIT_DECLINED_STATUSES = new Set([
  'cancelled',
  'declined',
  'rejected',
  'provider_cancelled',
  'provider_declined',
  'provider_rejected',
  'client_cancelled',
  'client_declined',
  'client_rejected',
  'visit_cancelled',
  'visit_declined',
]);

export function getVisitLogisticsStatus(visitRequest?: Record<string, unknown> | null): string {
  if (!visitRequest) return '';
  const status =
    visitRequest.logisticsStatus ??
    visitRequest.logistics_status ??
    visitRequest.visitStatus ??
    visitRequest.visit_status;
  return typeof status === 'string' ? status.toLowerCase().trim() : '';
}

export function isVisitDeclined(visitRequest?: Record<string, unknown> | null): boolean {
  if (!visitRequest) return false;
  const status = getVisitLogisticsStatus(visitRequest);
  if (VISIT_DECLINED_STATUSES.has(status)) return true;
  if (status.includes('cancel') || status.includes('declin') || status.includes('reject')) return true;
  if (visitRequest.declined === true || visitRequest.cancelled === true) return true;
  return false;
}

export function getVisitDeclineActor(visitRequest?: Record<string, unknown> | null): VisitDeclineActor {
  if (!isVisitDeclined(visitRequest)) return 'unknown';

  const actorRaw = [
    visitRequest?.declinedBy,
    visitRequest?.declined_by,
    visitRequest?.cancelledBy,
    visitRequest?.cancelled_by,
    visitRequest?.declinedByRole,
    visitRequest?.declined_by_role,
  ]
    .find((value) => typeof value === 'string' && value.trim().length > 0);

  const actor = typeof actorRaw === 'string' ? actorRaw.toLowerCase() : '';
  if (actor.includes('provider')) return 'provider';
  if (actor.includes('client') || actor.includes('user') || actor.includes('customer')) return 'client';

  const status = getVisitLogisticsStatus(visitRequest);
  if (status.includes('provider')) return 'provider';
  if (status.includes('client') || status.includes('user')) return 'client';

  return 'unknown';
}

export function getVisitDeclinedDescription(
  visitRequest?: Record<string, unknown> | null,
  audience: 'client' | 'provider' = 'provider'
): string {
  const actor = getVisitDeclineActor(visitRequest);
  if (audience === 'provider') {
    if (actor === 'provider') return 'You declined the visit.';
    if (actor === 'client') return 'Client declined the visit.';
    return 'Visit was declined.';
  }
  if (actor === 'client') return 'You declined the visit.';
  if (actor === 'provider') return 'Provider declined the visit.';
  return 'Visit was declined.';
}

export function isTerminalVisitStatus(status?: string | null): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase().trim();
  return normalized === 'paid' || isVisitDeclined({ logisticsStatus: normalized });
}
