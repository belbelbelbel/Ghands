const PREFIX = '[GHands Call]';

/** Console logs for tracing call flow (Metro / native log). */
export function logCallDebug(event: string, data?: Record<string, unknown>) {
  if (data !== undefined) {
    console.log(PREFIX, event, data);
  } else {
    console.log(PREFIX, event);
  }
}

export function logCallWarn(event: string, data?: Record<string, unknown>) {
  console.warn(PREFIX, event, data ?? '');
}

export function logCallError(event: string, data?: Record<string, unknown>) {
  console.error(PREFIX, event, data ?? '');
}

export function serializeCallApiError(error: unknown): Record<string, unknown> {
  const e = error as {
    message?: string;
    status?: number;
    statusText?: string;
    isNetworkError?: boolean;
    details?: unknown;
  };
  return {
    message: e?.message ?? String(error),
    status: e?.status,
    statusText: e?.statusText,
    isNetworkError: e?.isNetworkError,
    details: e?.details,
  };
}
