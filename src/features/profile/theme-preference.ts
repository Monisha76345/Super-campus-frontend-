import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AppTheme } from './enums';

const BASE_THEME_KEY = 'supercampus.theme';

function isTheme(value: string | null): value is AppTheme {
  return value === AppTheme.Light || value === AppTheme.Dark || value === AppTheme.System;
}

export function getUserThemeKey(userId?: string | null): string {
  if (!userId) return BASE_THEME_KEY;
  const safeId = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${BASE_THEME_KEY}.${safeId}`;
}

export const themePreference = {
  async read(userId?: string | null): Promise<AppTheme> {
    const key = getUserThemeKey(userId);
    let raw: string | null = null;
    try {
      raw =
        Platform.OS === 'web'
          ? globalThis.localStorage?.getItem(key) ?? null
          : await SecureStore.getItemAsync(key);
    } catch {
      raw = null;
    }

    if (isTheme(raw)) {
      return raw;
    }

    // Default to Dark theme for any user that hasn't customized their theme yet
    return AppTheme.Dark;
  },

  async write(theme: AppTheme, userId?: string | null): Promise<void> {
    const key = getUserThemeKey(userId);
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(key, theme);
        return;
      }
      await SecureStore.setItemAsync(key, theme);
    } catch {
      // ignore
    }
  },
};
