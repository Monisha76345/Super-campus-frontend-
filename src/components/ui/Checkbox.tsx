import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onToggle }: CheckboxProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <Pressable
      onPress={() => onToggle(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.container}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  boxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.light,
  },
  label: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
}
