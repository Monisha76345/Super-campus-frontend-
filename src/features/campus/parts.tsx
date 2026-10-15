import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

function usePartTheme() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return { Colors, styles };
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { styles } = usePartTheme();
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            onPress={() => onChange(option)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  const { Colors, styles } = usePartTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.text.tertiary}
        cursorColor={Colors.text.primary}
        selectionColor={Colors.primary.light}
        autoComplete="off"
        importantForAutofill="no"
        style={styles.field}
        {...props}
      />
    </View>
  );
}

export function Banner({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  const { styles } = usePartTheme();
  return (
    <View style={styles.banner}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerBody}>{body}</Text>
    </View>
  );
}

export function Note({ children }: { children: string }) {
  const { styles } = usePartTheme();
  return <Text style={styles.note}>{children}</Text>;
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.background.pillInactive,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  chipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.light,
  },
  chipText: {
    fontFamily: Typography.semiBold,
    color: Colors.text.secondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: Colors.text.primary,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    fontFamily: Typography.semiBold,
    color: Colors.text.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  field: {
    backgroundColor: Colors.background.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    color: Colors.text.primary,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Typography.regular,
    fontSize: 15,
  },
  banner: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border.glow,
    padding: 18,
    marginBottom: 16,
  },
  kicker: {
    fontFamily: Typography.semiBold,
    color: Colors.primary.lavender,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bannerTitle: {
    fontFamily: Typography.bold,
    color: Colors.text.primary,
    fontSize: 20,
    marginBottom: 6,
  },
  bannerBody: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
});
}
