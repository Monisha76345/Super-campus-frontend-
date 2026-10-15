import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.text.inverse : Colors.primary.light}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text` as keyof typeof styles],
              styles[`${size}Text` as keyof typeof styles],
              disabled && styles.disabledText,
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  base: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  // Variants
  primary: {
    backgroundColor: '#313491', // Royal Indigo / Violet CTA from screenshot
    borderWidth: 1.2,
    borderColor: 'rgba(129, 140, 248, 0.35)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  secondary: {
    backgroundColor: Colors.background.pillInactive,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border.glow,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: 16,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
    borderRadius: 18,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 26,
    minHeight: 56,
    borderRadius: 22,
  },
  // Text styles
  textBase: {
    fontFamily: Typography.semiBold,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  primaryText: {
    color: Colors.text.inverse,
  },
  secondaryText: {
    color: Colors.text.primary,
  },
  outlineText: {
    color: Colors.primary.cyan,
  },
  ghostText: {
    color: Colors.text.accent,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // States
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  disabledText: {
    color: Colors.text.secondary,
  },
});
}
