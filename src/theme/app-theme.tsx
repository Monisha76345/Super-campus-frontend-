import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { ColorTokens, darkColors, lightColors } from '@/constants/colors';
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
  if (preference === AppTheme.Dark) {
    return 'dark';
  }
  return system === 'light' ? 'light' : 'dark';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppTheme>(AppTheme.Dark);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    themePreference
      .read()
      .then((saved) => {
        setPreferenceState(saved);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setPreference = useCallback((theme: AppTheme) => {
    setPreferenceState(theme);
    themePreference.write(theme).catch(() => undefined);
  }, []);

  const scheme = resolveScheme(preference, systemScheme);
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
