type SessionExpiredListener = () => void | Promise<void>;

const listeners = new Set<SessionExpiredListener>();

export function subscribeToSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => {
    Promise.resolve(listener()).catch(() => {
      /* best effort: auth guards will retry on route/app-state changes */
    });
  });
}
