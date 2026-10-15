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
    canvas: '#0A0D17',
    canvasAlt: '#07090F',
    surface: '#13182C',
    surfaceGlass: 'rgba(19, 24, 44, 0.75)',
    surfaceHover: '#1A213D',
    elevated: '#1D2442',
    input: '#0E1222',
    pillInactive: '#161B2E',
    bar: 'rgba(15, 20, 36, 0.94)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    card: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(99, 102, 241, 0.35)',
    focus: '#6366F1',
    error: '#EF4444',
  },
  primary: {
    main: '#313491',
    accent: '#4F46E5',
    light: '#6366F1',
    cyan: '#818CF8',
    lavender: '#A5B4FC',
    glow: 'rgba(79, 85, 201, 0.35)',
    ambientRing: 'rgba(49, 52, 145, 0.25)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8E95AA',
    tertiary: '#5A6278',
    accent: '#818CF8',
    inverse: '#FFFFFF',
    dim: 'rgba(255, 255, 255, 0.65)',
    onBrand: '#FFFFFF',
    onBrandMuted: '#C7D2FE',
  },
  status: {
    online: '#10B981',
    error: '#F87171',
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
