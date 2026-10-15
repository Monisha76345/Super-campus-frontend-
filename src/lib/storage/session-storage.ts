import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'supercampus.session';

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  }
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function removeRaw(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export const sessionStorage = {
  async read<T>(): Promise<T | null> {
    const raw = await readRaw();
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      await removeRaw();
      return null;
    }
  },
  async write<T>(value: T): Promise<void> {
    await writeRaw(JSON.stringify(value));
  },
  async clear(): Promise<void> {
    await removeRaw();
  },
};
