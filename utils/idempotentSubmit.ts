function collectErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return typeof error === 'string' ? error : '';
  }
  const e = error as Record<string, unknown>;
  const parts = [
    e.message,
    (e.details as Record<string, unknown> | undefined)?.message,
    (e.details as Record<string, unknown> | undefined)?.error,
    ((e.details as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.message,
    ((e.details as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.error,
  ];
  return parts.filter((p) => typeof p === 'string' && p.trim().length > 0).join(' ');
}

/** True when the server indicates the action already succeeded (safe to treat as success). */
export function isDuplicateActionError(error: unknown, extraPhrases: string[] = []): boolean {
  const text = collectErrorText(error).toLowerCase();
  if (!text) return false;
  const phrases = [
    'already sent',
    'already submitted',
    'already complete',
    'already completed',
    'already marked',
    'already accepted',
    'quotation already',
    'already exists',
    'duplicate',
    'already been sent',
    'already been submitted',
    'already been completed',
    'already been marked',
    'already requested',
    'visit already',
    'already in progress',
    'already started',
    ...extraPhrases,
  ];
  return phrases.some((phrase) => text.includes(phrase));
}
