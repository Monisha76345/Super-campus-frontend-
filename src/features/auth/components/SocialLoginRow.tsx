import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface SocialLoginRowProps {
  onGooglePress?: () => void;
  onApplePress?: () => void;
}

export function SocialLoginRow({ onGooglePress, onApplePress }: SocialLoginRowProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onGooglePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google">
        <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.icon} />
        <Text style={styles.buttonText}>Google</Text>
      </Pressable>

      <Pressable
        onPress={onApplePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Sign in with Apple">
        <Ionicons name="logo-apple" size={20} color={Colors.social.apple} style={styles.icon} />
        <Text style={styles.buttonText}>Apple</Text>
      </Pressable>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.background.input,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    borderColor: Colors.primary.main,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontFamily: Typography.semiBold,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
}
