import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { sessionStorage } from '@/lib/storage/session-storage';

import { UserSession } from '../types';
import { authEvents } from './auth-events';

// 7 days in milliseconds: 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthSessionContextValue {
  user: UserSession | null;
  isReady: boolean;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  signIn: (session: UserSession, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const validateAndSyncSession = useCallback(async (saved: UserSession | null): Promise<UserSession | null> => {
    if (!saved) {
      return null;
    }

    const now = Date.now();
    const lastActivity = saved.lastActiveAt || saved.lastLoginAt;

    // If more than 7 days have elapsed since last login/activity, session is expired
    if (!lastActivity || now - lastActivity >= SEVEN_DAYS_MS) {
      await sessionStorage.clear();
      setSessionExpired(true);
      return null;
    }

    // Refresh last active timestamp so active usage extends within the 7-day window
    const refreshed: UserSession = {
      ...saved,
      lastActiveAt: now,
    };
    await sessionStorage.write(refreshed);
    return refreshed;
  }, []);

  // Initial load on app launch
  useEffect(() => {
    let active = true;
    sessionStorage
      .read<UserSession>()
      .then(async (saved) => {
        const validSession = await validateAndSyncSession(saved);
        if (active) {
          setUser(validSession);
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
  }, [validateAndSyncSession]);

  // Check 7-day expiration when app resumes from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const saved = await sessionStorage.read<UserSession>();
        const validSession = await validateAndSyncSession(saved);
        setUser(validSession);
      }
    });
    return () => subscription.remove();
  }, [validateAndSyncSession]);

  // Listen for 401 token expiration events from api-client
  useEffect(() => {
    return authEvents.onSessionExpired(async () => {
      await sessionStorage.clear();
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      user,
      isReady,
      sessionExpired,
      clearSessionExpired,
      signIn: async (session, remember) => {
        const now = Date.now();
        const enrichedSession: UserSession = {
          ...session,
          lastLoginAt: now,
          lastActiveAt: now,
        };
        setSessionExpired(false);
        setUser(enrichedSession);
        // Persist session with timestamps so tokens are available for authenticated API calls
        await sessionStorage.write(enrichedSession);
      },
      signOut: async () => {
        setSessionExpired(false);
        setUser(null);
        await sessionStorage.clear();
      },
    }),
    [user, isReady, sessionExpired, clearSessionExpired],
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

