/**
 * Supercampus brand palettes.
 * Dark keeps the midnight indigo canvas. Light keeps the same indigo brand on a light surface.
 * Text that sits on an indigo fill uses onBrand, which stays light in both palettes.
 */

export type ColorTokens = {
  background: {
    canvas: string;
    canvasAlt: string;
    surface: string;
    surfaceGlass: string;
    surfaceHover: string;
    elevated: string;
    input: string;
    pillInactive: string;
    bar: string;
  };
  border: {
    subtle: string;
    card: string;
    glow: string;
    focus: string;
    error: string;
  };
  primary: {
    main: string;
    accent: string;
    light: string;
    cyan: string;
    lavender: string;
    glow: string;
    ambientRing: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    inverse: string;
    dim: string;
    onBrand: string;
    onBrandMuted: string;
  };
  status: {
    online: string;
    error: string;
    errorBackground: string;
    success: string;
    warning: string;
  };
  social: {
    apple: string;
    google: string;
  };
};

export const darkColors: ColorTokens = {
  background: {
    canvas: '#080B11',
    canvasAlt: '#080B11',
    surface: '#0F172A',
    surfaceGlass: 'rgba(15, 23, 42, 0.75)',
    surfaceHover: '#1E293B',
    elevated: '#0F172A',
    input: '#111827',
    pillInactive: '#161B2E',
    bar: '#0F172A',
  },
  border: {
    subtle: '#1E293B',
    card: '#1E293B',
    glow: 'rgba(56, 189, 248, 0.35)',
    focus: '#3B82F6',
    error: '#EF4444',
  },
  primary: {
    main: '#2563EB',
    accent: '#38BDF8',
    light: '#60A5FA',
    cyan: '#38BDF8',
    lavender: '#A5B4FC',
    glow: 'rgba(37, 99, 235, 0.35)',
    ambientRing: 'rgba(37, 99, 235, 0.25)',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    accent: '#38BDF8',
    inverse: '#FFFFFF',
    dim: 'rgba(248, 250, 252, 0.65)',
    onBrand: '#FFFFFF',
    onBrandMuted: '#C7D2FE',
  },
  status: {
    online: '#10B981',
    error: '#EF4444',
    errorBackground: 'rgba(239, 68, 68, 0.12)',
    success: '#10B981',
    warning: '#F59E0B',
  },
  social: {
    apple: '#FFFFFF',
    google: '#EA4335',
  },
};

export const lightColors: ColorTokens = {
  background: {
    canvas: '#F4F6FB',
    canvasAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.92)',
    surfaceHover: '#EEF1F8',
    elevated: '#FFFFFF',
    input: '#F3F5FA',
    pillInactive: '#E7EAF3',
    bar: '#FFFFFF',
  },
  border: {
    subtle: 'rgba(15, 23, 42, 0.08)',
    card: 'rgba(15, 23, 42, 0.1)',
    glow: 'rgba(49, 52, 145, 0.28)',
    focus: '#313491',
    error: '#EF4444',
  },
  primary: {
    main: '#313491',
    accent: '#4F46E5',
    light: '#4F46E5',
    cyan: '#4338CA',
    lavender: '#3730A3',
    glow: 'rgba(49, 52, 145, 0.16)',
    ambientRing: 'rgba(49, 52, 145, 0.12)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    accent: '#3730A3',
    inverse: '#FFFFFF',
    dim: 'rgba(15, 23, 42, 0.62)',
    onBrand: '#FFFFFF',
    onBrandMuted: '#C7D2FE',
  },
  status: {
    online: '#059669',
    error: '#DC2626',
    errorBackground: 'rgba(220, 38, 38, 0.1)',
    success: '#059669',
    warning: '#D97706',
  },
  social: {
    apple: '#0F172A',
    google: '#EA4335',
  },
};

/** Dark palette. Screens should read colors from `useColors()` so the saved theme can switch them. */
export const Colors = darkColors;
