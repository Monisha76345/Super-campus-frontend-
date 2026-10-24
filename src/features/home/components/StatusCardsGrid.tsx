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
      gap: 8,
      marginBottom: 10,
    },
    widgetCard: {
      flex: 1,
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      padding: 13,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    bookingCard: {
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    passCard: {
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    widgetTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
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
      lineHeight: 15,
      color: Colors.text.secondary,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
