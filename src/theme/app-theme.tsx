import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { ColorTokens, darkColors, lightColors } from '@/constants/colors';
import { AuthSessionContext } from '@/features/auth/session/AuthSessionProvider';
import { profileApi } from '@/features/profile/api/profile-api';
import { AppTheme } from '@/features/profile/enums';
import { themePreference } from '@/features/profile/theme-preference';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

type AppThemeContextValue = {
  preference: AppTheme;
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  setPreference: (theme: AppTheme) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function resolveScheme(preference: AppTheme, system: ColorSchemeName): 'light' | 'dark' {
  if (preference === AppTheme.Light) {
    return 'light';
  }
  if (preference === AppTheme.System) {
    return system === 'light' ? 'light' : 'dark';
  }
  return 'dark';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthSessionContext);
  const user = auth?.user ?? null;
  const userId = user?.id || user?.email || null;

  const [preference, setPreferenceState] = useState<AppTheme>(AppTheme.Dark);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'dark');

  // When user logs in, load their saved theme from database or storage.
  // When user logs out, reset to default Dark theme.
  useEffect(() => {
    if (!userId) {
      setPreferenceState(AppTheme.Dark);
      return;
    }

    // 1. If backend login response already returned user.theme from database, use it immediately
    if (
      user?.theme &&
      (user.theme === AppTheme.Light || user.theme === AppTheme.Dark || user.theme === AppTheme.System)
    ) {
      setPreferenceState(user.theme as AppTheme);
      themePreference.write(user.theme as AppTheme, userId).catch(() => undefined);
      return;
    }

    // 2. Otherwise read from local secure cache
    let active = true;
    themePreference
      .read(userId)
      .then((saved) => {
        if (active) {
          setPreferenceState(saved);
        }
      })
      .catch(() => {
        if (active) {
          setPreferenceState(AppTheme.Dark);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, user?.theme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setPreference = useCallback(
    (theme: AppTheme) => {
      setPreferenceState(theme);
      if (userId) {
        // Save to local device storage
        themePreference.write(theme, userId).catch(() => undefined);
        // Persist to user table in MySQL backend
        if (user?.token && user?.tenantId) {
          profileApi.updateTheme({ token: user.token, tenantId: user.tenantId }, theme).catch((err) => {
            console.warn('Could not sync theme to database:', err);
          });
        }
      }
    },
    [userId, user?.token, user?.tenantId],
  );

  // CRITICAL RULE: Before login (no userId), NEVER use light theme.
  // Always enforce Dark mode on pre-login screens (Login, Landing, Forgot Password).
  // Once logged in, apply the theme selected by the user.
  const scheme: 'light' | 'dark' = useMemo(() => {
    if (!userId) {
      return 'dark';
    }
    return resolveScheme(preference, systemScheme);
  }, [userId, preference, systemScheme]);

  const colors = scheme === 'light' ? lightColors : darkColors;

  const value = useMemo(
    () => ({ preference, scheme, colors, setPreference }),
    [preference, scheme, colors, setPreference],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return value;
}

export function useColors(): ColorTokens {
  return useAppTheme().colors;
}

export function useThemedStyles<T extends NamedStyles<T>>(factory: (colors: ColorTokens) => T): T {
  const colors = useColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
