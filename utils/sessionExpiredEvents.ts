import { isInAuthTransition } from '@/utils/authNavigationGuard';

type SessionExpiredListener = () => void | Promise<void>;

const listeners = new Set<SessionExpiredListener>();
let notifyQueued = false;

export function subscribeToSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Coalesce burst 401 / missing-token events into one redirect wave. */
export function notifySessionExpired(): void {
  if (isInAuthTransition() || notifyQueued) return;

  notifyQueued = true;
  listeners.forEach((listener) => {
    Promise.resolve(listener()).catch(() => {
      /* best effort: auth guards will retry on route/app-state changes */
    });
  });

  setTimeout(() => {
    notifyQueued = false;
  }, 2500);
}
