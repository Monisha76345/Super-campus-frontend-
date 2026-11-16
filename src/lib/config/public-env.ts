import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

function requiredPublicEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/**
 * Resolves localhost / 127.0.0.1 or stale LAN IPs dynamically:
 * - On physical devices (Expo Go / Dev Client), automatically binds to the host IP from the active Expo bundler hostUri.
 * - On Android Emulators, rewrites to 10.0.2.2.
 * - On iOS Simulators / Web, localhost works as-is.
 */
function resolveHost(url: string): string {
  // 1. Try to extract host machine IP from Expo bundler hostUri (e.g. "10.218.255.242:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      // Replaces localhost, 127.0.0.1, or ANY existing IP with the live Expo host machine IP
      return url.replace(/:\/\/[^/:]+/, `://${hostIp}`);
    }
  }

  // 2. Fallback for Android Emulator when hostUri is unavailable
  if (Platform.OS === 'android' && !Device.isDevice) {
    return url.replace(/:\/\/[^/:]+/, '://10.0.2.2');
  }

  return url;
}

export const publicEnv = {
  get apiUrl(): string {
    return resolveHost(requiredPublicEnv('EXPO_PUBLIC_API_URL').replace(/\/$/, ''));
  },
  get tenantId(): string {
    return requiredPublicEnv('EXPO_PUBLIC_TENANT_ID');
  },
  get emailDomain(): string {
    return process.env.EXPO_PUBLIC_EMAIL_DOMAIN?.trim() || 'nmit.ac.in';
  },
};
