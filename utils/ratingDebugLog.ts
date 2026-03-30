const PREFIX = '[GHands Rating]';

export function logRatingDebug(event: string, data?: Record<string, unknown>) {
  if (data !== undefined) {
    console.log(PREFIX, event, data);
  } else {
    console.log(PREFIX, event);
  }
}

export function logRatingError(event: string, data?: Record<string, unknown>) {
  console.error(PREFIX, event, data ?? '');
}
