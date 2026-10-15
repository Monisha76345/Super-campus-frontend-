/**
 * Supercampus Global Typography System (Google Fonts - Outfit)
 * Used across all screens, buttons, inputs, and headings.
 */

export const Typography = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extraBold: 'Outfit_800ExtraBold',
  black: 'Outfit_900Black',
} as const;

export type TypographyToken = typeof Typography;
