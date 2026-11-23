type AuthListener = () => void;
const sessionExpiryListeners = new Set<AuthListener>();

export const authEvents = {
  onSessionExpired(listener: AuthListener): () => void {
    sessionExpiryListeners.add(listener);
    return () => {
      sessionExpiryListeners.delete(listener);
    };
  },
  notifySessionExpired(): void {
    sessionExpiryListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn('Error in auth session expiry listener', err);
      }
    });
  },
};
