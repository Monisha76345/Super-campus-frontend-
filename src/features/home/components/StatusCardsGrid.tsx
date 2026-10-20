import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

export function StatusCardsGrid() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();

  return (
    <View style={styles.gridContainer}>
      {/* Smart Widget 1: Upcoming Sports Booking */}
      <Pressable
        onPress={() => router.push('/sports')}
        style={({ pressed }) => [styles.widgetCard, styles.sportsCard, pressed && styles.pressed]}>
        <View style={styles.topStatusRow}>
          <View style={styles.sportsIconBox}>
            <Ionicons name="tennisball-outline" size={18} color="#38BDF8" />
          </View>
          <View style={styles.slotPill}>
            <Text style={styles.slotPillText}>SPORTS</Text>
          </View>
        </View>

        <View style={styles.middleContent}>
          <Text style={styles.widgetTitle}>Upcoming booking</Text>
          <Text style={styles.widgetSub}>View your Sports bookings.</Text>
        </View>

        <View style={styles.bottomActionRow}>
          <Text style={styles.sportsActionText}>Open Sports</Text>
          <Ionicons name="arrow-forward" size={13} color="#38BDF8" />
        </View>
      </Pressable>

      {/* Smart Widget 2: Outpass Status */}
      <Pressable
        onPress={() => router.push('/outpass')}
        style={({ pressed }) => [styles.widgetCard, styles.passCard, pressed && styles.pressed]}>
        <View style={styles.topStatusRow}>
          <View style={styles.passIconBox}>
            <Ionicons name="qr-code-outline" size={18} color="#C084FC" />
          </View>
          <View style={styles.activePill}>
            <View style={styles.activePillDot} />
            <Text style={styles.activePillText}>GATE PASS</Text>
          </View>
        </View>

        <View style={styles.middleContent}>
          <Text style={styles.widgetTitle}>Outpass status</Text>
          <Text style={styles.widgetSub}>Open your outpass requests.</Text>
        </View>

        <View style={styles.bottomActionRow}>
          <Text style={styles.passActionText}>View Status</Text>
          <Ionicons name="arrow-forward" size={13} color="#C084FC" />
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    widgetCard: {
      flex: 1,
      borderRadius: 22,
      borderWidth: 1.2,
      padding: 16,
      justifyContent: 'space-between',
      minHeight: 142,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    sportsCard: {
      backgroundColor: Colors.background.surface,
      borderColor: 'rgba(56, 189, 248, 0.35)',
      shadowColor: '#0284C7',
    },
    passCard: {
      backgroundColor: Colors.background.surface,
      borderColor: 'rgba(192, 132, 252, 0.35)',
      shadowColor: '#7C3AED',
    },
    topStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sportsIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(14, 165, 233, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    passIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    slotPill: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.35)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 10,
    },
    slotPillText: {
      fontFamily: Typography.bold,
      fontSize: 9,
      color: '#38BDF8',
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(192, 132, 252, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(192, 132, 252, 0.35)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 10,
    },
    activePillDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#C084FC',
    },
    activePillText: {
      fontFamily: Typography.bold,
      fontSize: 9,
      color: '#C084FC',
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    middleContent: {
      marginBottom: 10,
    },
    widgetTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    widgetSub: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    bottomActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
    },
    sportsActionText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#38BDF8',
      fontWeight: '700',
    },
    passActionText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#C084FC',
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
  });
}
