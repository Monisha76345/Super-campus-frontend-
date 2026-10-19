import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { CalendarPickerModal } from './CalendarPickerModal';

interface DatePickerFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onChangeDate: (dateStr: string) => void;
  disabled?: boolean;
}

export function DatePickerField({
  label,
  value,
  placeholder = 'YYYY-MM-DD',
  onChangeDate,
  disabled = false,
}: DatePickerFieldProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const displayValue = value ? value : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setCalendarOpen(true)}
        style={({ pressed }) => [
          styles.fieldInput,
          pressed && styles.fieldPressed,
          disabled && styles.fieldDisabled,
        ]}
      >
        <Text style={[styles.valueText, !displayValue && styles.placeholderText]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={displayValue ? Colors.primary.light : Colors.text.tertiary}
        />
      </Pressable>

      <CalendarPickerModal
        visible={calendarOpen}
        value={value}
        title={`Select ${label}`}
        onSelect={(newDate) => {
          onChangeDate(newDate);
          setCalendarOpen(false);
        }}
        onClear={() => {
          onChangeDate('');
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

function createStyles(Colors: any) {
  return StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    label: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.secondary,
      marginBottom: 6,
    },
    fieldInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    fieldPressed: {
      opacity: 0.8,
    },
    fieldDisabled: {
      opacity: 0.5,
    },
    valueText: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    placeholderText: {
      color: Colors.text.tertiary,
    },
  });
}
