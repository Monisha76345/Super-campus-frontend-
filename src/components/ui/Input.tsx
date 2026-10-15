import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  containerStyle,
  inputStyle,
  ...textInputProps
}: InputProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        collapsable={false}
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          !!error && styles.errorContainer,
        ]}>
        {leftIcon && (
          <View style={styles.iconLeft}>
            <Ionicons
              name={leftIcon}
              size={18}
              color={isFocused ? Colors.primary.light : Colors.text.secondary}
            />
          </View>
        )}

        <TextInput
          placeholderTextColor={Colors.text.tertiary}
          cursorColor={Colors.text.primary}
          selectionColor={Colors.primary.light}
          secureTextEntry={isSecure}
          style={[styles.input, inputStyle]}
          {...textInputProps}
          onFocus={(event) => {
            setIsFocused(true);
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            textInputProps.onBlur?.(event);
          }}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconRight}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.text.secondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconRight}>
            <Ionicons name={rightIcon} size={18} color={Colors.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.input,
    borderWidth: 1.2,
    borderColor: Colors.border.subtle,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
  },
  focusedContainer: {
    borderColor: Colors.primary.light,
  },
  errorContainer: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: Typography.regular,
    color: Colors.text.primary,
    fontSize: 15,
    paddingVertical: 0,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.medium,
    color: Colors.status.error,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
});
}
