import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ReferralInfo } from './types';

const REFERRAL_KEY = 'supercampus.referral_info';

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(REFERRAL_KEY) ?? null;
  }
  return SecureStore.getItemAsync(REFERRAL_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(REFERRAL_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(REFERRAL_KEY, value);
}

async function removeRaw(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(REFERRAL_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFERRAL_KEY);
}

export const referralStorage = {
  async getReferral(): Promise<ReferralInfo | null> {
    try {
      const raw = await readRaw();
      if (!raw) return null;
      return JSON.parse(raw) as ReferralInfo;
    } catch {
      await removeRaw();
      return null;
    }
  },

  async saveReferral(info: ReferralInfo): Promise<void> {
    try {
      await writeRaw(JSON.stringify(info));
    } catch {
      // Best effort storage
    }
  },

  async clear(): Promise<void> {
    await removeRaw();
  },
};
