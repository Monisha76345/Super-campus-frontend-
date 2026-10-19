import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

interface CalendarPickerModalProps {
  visible: boolean;
  value?: string | null; // Format: "YYYY-MM-DD"
  title?: string;
  onSelect: (dateStr: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarPickerModal({
  visible,
  value,
  title = 'Select Date',
  onSelect,
  onClear,
  onClose,
}: CalendarPickerModalProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  // Parse initial date or default to today
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    value ? initialDate.getDate() : null,
  );

  // When value changes, sync year/month
  React.useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
      setSelectedDay(d);
    } else {
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
      setSelectedDay(null);
    }
  }, [value, visible]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const prevYear = () => setCurrentYear((y) => y - 1);
  const nextYear = () => setCurrentYear((y) => y + 1);

  // Calculate days in month and starting day
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${currentYear}-${mStr}-${dStr}`;
    onSelect(formatted);
    onClose();
  };

  const handleSelectToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    handleDayPress(now.getDate());
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.topHeader}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Year & Month Control */}
          <View style={styles.navRow}>
            {/* Year Fast Switcher */}
            <View style={styles.yearRow}>
              <Pressable onPress={prevYear} style={styles.arrowBtn}>
                <Ionicons name="play-back" size={14} color={Colors.text.primary} />
              </Pressable>
              <Text style={styles.yearText}>{currentYear}</Text>
              <Pressable onPress={nextYear} style={styles.arrowBtn}>
                <Ionicons name="play-forward" size={14} color={Colors.text.primary} />
              </Pressable>
            </View>

            {/* Month Switcher */}
            <View style={styles.monthRow}>
              <Pressable onPress={prevMonth} style={styles.arrowBtn}>
                <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
              </Pressable>
              <Text style={styles.monthText}>{MONTHS[currentMonth]}</Text>
              <Pressable onPress={nextMonth} style={styles.arrowBtn}>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.primary} />
              </Pressable>
            </View>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.weekDayText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {/* Leading empty spaces */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDay === day &&
                initialDate.getMonth() === currentMonth &&
                initialDate.getFullYear() === currentYear;

              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              return (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={handleSelectToday} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>Today</Text>
            </Pressable>

            {onClear && (
              <Pressable
                onPress={() => {
                  onClear();
                  onClose();
                }}
                style={styles.footerBtn}
              >
                <Text style={[styles.footerBtnText, { color: Colors.status.error }]}>Clear</Text>
              </Pressable>
            )}

            <Pressable onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: Colors.background.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.background.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    yearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 4,
    },
    yearText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      minWidth: 42,
      textAlign: 'center',
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 4,
      flex: 1,
      justifyContent: 'space-between',
    },
    monthText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      textAlign: 'center',
    },
    arrowBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      paddingBottom: 6,
    },
    weekDayText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      fontWeight: '600',
      color: Colors.text.secondary,
      width: 38,
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      marginVertical: 2,
    },
    dayCellSelected: {
      backgroundColor: Colors.primary.main,
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: Colors.primary.light,
    },
    dayText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.primary,
    },
    dayTextSelected: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontWeight: '700',
    },
    dayTextToday: {
      color: Colors.primary.light,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
      paddingTop: 12,
    },
    footerBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    footerBtnText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.primary.light,
    },
    doneBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: Colors.background.input,
    },
    doneBtnText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.secondary,
    },
  });
}
