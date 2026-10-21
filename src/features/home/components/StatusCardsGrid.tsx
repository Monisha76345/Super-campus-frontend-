import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';

export function StatusCardsGrid() {
  const { colors: Colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const router = useRouter();

  return (
    <View style={styles.gridContainer}>
      {/* Upcoming booking */}
      <Pressable
        onPress={() => router.push('/sports')}
        style={({ pressed }) => [styles.widgetCard, styles.bookingCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark ? 'rgba(6, 182, 212, 0.14)' : '#EEF2FF',
              borderColor: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(99, 102, 241, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? '#06B6D4' : '#4338CA'}
          />
        </View>

        <Text style={styles.widgetTitle}>Upcoming booking</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isDark ? '#38BDF8' : '#2563EB' }]} />
          <Text style={styles.statusAccent}>Coming soon</Text>
        </View>
        <Text style={styles.widgetSub}>View your Sports bookings.</Text>
      </Pressable>

      {/* Outpass status */}
      <Pressable
        onPress={() => router.push('/outpass')}
        style={({ pressed }) => [styles.widgetCard, styles.passCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.14)' : '#EEF2FF',
              borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(99, 102, 241, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="person"
            size={18}
            color={isDark ? '#A78BFA' : '#4338CA'}
          />
        </View>

        <Text style={styles.widgetTitle}>Outpass status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isDark ? '#38BDF8' : '#2563EB' }]} />
          <Text style={styles.statusAccent}>Coming soon</Text>
        </View>
        <Text style={styles.widgetSub}>Open your outpass requests.</Text>
      </Pressable>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    widgetCard: {
      flex: 1,
      backgroundColor: isDark ? '#101626' : Colors.background.surface,
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#E0E7FF',
      padding: 15,
      shadowColor: isDark ? '#000' : '#4338CA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    bookingCard: {
      borderColor: isDark ? 'rgba(6, 182, 212, 0.22)' : '#E0E7FF',
    },
    passCard: {
      borderColor: isDark ? 'rgba(139, 92, 246, 0.22)' : '#E0E7FF',
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    widgetTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 5,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusAccent: {
      fontFamily: Typography.semiBold,
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#38BDF8' : '#2563EB',
    },
    widgetSub: {
      fontFamily: Typography.regular,
      fontSize: 11,
      lineHeight: 16,
      color: Colors.text.secondary,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
