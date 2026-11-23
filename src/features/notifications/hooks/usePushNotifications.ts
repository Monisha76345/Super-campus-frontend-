import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { useAuthSession } from '@/features/auth';
import { notificationApi } from '../api/notification-api';
import { routeFromNotificationData } from '../utils/notification-routing';

// Safely resolve Notifications to prevent crashes in Expo Go, Web, or environments lacking ExpoApplication native module
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Native notification module not linked or not available in this environment
  Notifications = null;
}

function resolvePlatform(): 'IOS' | 'ANDROID' | 'WEB' | 'UNKNOWN' {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  if (Platform.OS === 'web') return 'WEB';
  return 'UNKNOWN';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync('campus-alerts', {
      name: 'Campus alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38BDF8',
    });
  } catch {
    // Ignore channel setup errors if native module is absent
  }
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) return null;
  if (!Device.isDevice) return null;

  try {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.easConfig?.projectId ??
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResponse?.data || null;
  } catch {
    return null;
  }
}

/**
 * Registers the Expo push token after login and routes taps on push banners.
 */
export function usePushNotifications() {
  const { user, isReady } = useAuthSession();
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);
  const responseSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!Notifications || !isReady || !user?.token) return;

    let cancelled = false;

    (async () => {
      const pushToken = await getExpoPushToken();
      if (cancelled || !pushToken) return;
      tokenRef.current = pushToken;
      try {
        await notificationApi.registerDeviceToken(
          { token: user.token, tenantId: user.tenantId || 'nmit' },
          pushToken,
          resolvePlatform(),
        );
      } catch (err) {
        console.warn('[notifications] Failed to register device token', err);
      }
    })();

    try {
      responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data as Record<string, unknown> | undefined;
        routeFromNotificationData(router, data);
      });
    } catch {
      // Ignored if listener cannot be attached
    }

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && tokenRef.current && user?.token) {
        notificationApi
          .registerDeviceToken(
            { token: user.token, tenantId: user.tenantId || 'nmit' },
            tokenRef.current,
            resolvePlatform(),
          )
          .catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
      responseSub.current?.remove();
      appStateSub.remove();
    };
  }, [isReady, user?.token, user?.tenantId, router]);
}
