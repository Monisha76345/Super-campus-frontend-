import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { sessionStorage } from '@/lib/storage/session-storage';

import { UserSession } from '../types';

interface AuthSessionContextValue {
  user: UserSession | null;
  isReady: boolean;
  signIn: (session: UserSession, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    sessionStorage
      .read<UserSession>()
      .then((saved) => {
        if (active) {
          setUser(saved);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      user,
      isReady,
      signIn: async (session, remember) => {
        setUser(session);
        if (remember) {
          await sessionStorage.write(session);
          return;
        }
        await sessionStorage.clear();
      },
      signOut: async () => {
        setUser(null);
        await sessionStorage.clear();
      },
    }),
    [user, isReady],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
}
