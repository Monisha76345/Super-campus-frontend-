import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAuthSession } from '@/features/auth';
import { notificationApi } from '../api/notification-api';

export function useUnreadNotificationCount(pollMs = 45000) {
  const { user, isReady } = useAuthSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.token) {
      setCount(0);
      return;
    }
    try {
      const res = await notificationApi.unreadCount({
        token: user.token,
        tenantId: user.tenantId || 'nmit',
      });
      setCount(res?.count ?? 0);
    } catch {
      // keep last known count
    }
  }, [user?.token, user?.tenantId]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
    const interval = setInterval(() => void refresh(), pollMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isReady, refresh, pollMs]);

  return { count, refresh };
}
