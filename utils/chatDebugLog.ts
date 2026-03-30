const PREFIX = '[GHands Chat]';

export function logChatDebug(event: string, data?: Record<string, unknown>) {
  if (data !== undefined) {
    console.log(PREFIX, event, data);
  } else {
    console.log(PREFIX, event);
  }
}

export function logChatWarn(event: string, data?: Record<string, unknown>) {
  console.warn(PREFIX, event, data ?? '');
}
