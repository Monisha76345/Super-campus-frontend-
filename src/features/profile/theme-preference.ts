import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AppTheme } from './enums';

const THEME_KEY = 'supercampus.theme';

function isTheme(value: string | null): value is AppTheme {
  return value === AppTheme.Light || value === AppTheme.Dark || value === AppTheme.System;
}

export const themePreference = {
  async read(): Promise<AppTheme> {
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(THEME_KEY) ?? null : await SecureStore.getItemAsync(THEME_KEY);
    return isTheme(raw) ? raw : AppTheme.Dark;
  },

  async write(theme: AppTheme): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(THEME_KEY, theme);
      return;
    }
    await SecureStore.setItemAsync(THEME_KEY, theme);
  },
};
