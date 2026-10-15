import { Platform } from 'react-native';

function requiredPublicEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/** Android emulator localhost is the phone, not the Mac. 10.0.2.2 is the host machine. */
function emulatorHost(url: string): string {
  if (Platform.OS !== 'android') {
    return url;
  }
  return url.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
}

export const publicEnv = {
  get apiUrl(): string {
    return emulatorHost(requiredPublicEnv('EXPO_PUBLIC_API_URL').replace(/\/$/, ''));
  },
  get tenantId(): string {
    return requiredPublicEnv('EXPO_PUBLIC_TENANT_ID');
  },
};
