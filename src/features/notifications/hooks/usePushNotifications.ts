import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { useAuthSession } from '@/features/auth';
import { notificationApi } from '../api/notification-api';
import { routeFromNotificationData } from '../utils/notification-routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function resolvePlatform(): 'IOS' | 'ANDROID' | 'WEB' | 'UNKNOWN' {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  if (Platform.OS === 'web') return 'WEB';
  return 'UNKNOWN';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('campus-alerts', {
    name: 'Campus alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#38BDF8',
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

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

  try {
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data || null;
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
  const responseSub = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isReady || !user?.token) return;

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

    responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      routeFromNotificationData(router, data);
    });

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
