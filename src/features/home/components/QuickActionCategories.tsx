import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { openService } from '@/features/campus/navigation';

export function QuickActionCategories() {
  const { colors: Colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      {/* Section Title with subtle glow dot */}
      <View style={styles.titleRow}>
        <View style={styles.headingIndicator} />
        <Text style={styles.sectionHeading}>CAMPUS SHORTCUTS</Text>
      </View>

      {/* Row 1: 3 Column Cards (Food, Marketplace, Sports) */}
      <View style={styles.rowThree}>
        {/* Food */}
        <Pressable
          style={({ pressed }) => [styles.cardCol, pressed && styles.cardPressed]}
          onPress={() => openService(router, 'food')}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name="restaurant"
              size={22}
              color={isDark ? '#F59E0B' : '#4338CA'}
            />
          </View>
          <Text style={styles.cardTitle}>Food</Text>
          <Text style={styles.cardSub}>Coming soon</Text>
        </Pressable>

        {/* Marketplace */}
        <Pressable
          style={({ pressed }) => [
            styles.cardCol,
            isDark && styles.marketplaceCardActive,
            pressed && styles.cardPressed,
          ]}
          onPress={() => openService(router, 'marketplace')}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name="storefront"
              size={22}
              color={isDark ? '#34D399' : '#4338CA'}
            />
          </View>
          <Text style={styles.cardTitle}>Marketplace</Text>
          <Text style={styles.cardSub}>Buy & sell</Text>
        </Pressable>

        {/* Sports */}
        <Pressable
          style={({ pressed }) => [styles.cardCol, pressed && styles.cardPressed]}
          onPress={() => openService(router, 'sports')}
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
              name="basketball"
              size={22}
              color={isDark ? '#A78BFA' : '#4338CA'}
            />
          </View>
          <Text style={styles.cardTitle}>Sports</Text>
          <Text style={styles.cardSub}>Book. Play.</Text>
        </Pressable>
      </View>

      {/* Row 2: 2 Column Horizontal Cards (Outpass, Projects) */}
      <View style={styles.rowTwo}>
        {/* Outpass */}
        <Pressable
          style={({ pressed }) => [styles.cardRow, pressed && styles.cardPressed]}
          onPress={() => openService(router, 'outpass')}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconBoxRow,
              {
                backgroundColor: isDark ? 'rgba(14, 165, 233, 0.14)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name="briefcase"
              size={20}
              color={isDark ? '#38BDF8' : '#4338CA'}
            />
          </View>
          <View style={styles.cardRowText}>
            <Text style={styles.cardRowTitle}>Outpass</Text>
            <Text style={styles.cardRowSub}>Request leave</Text>
          </View>
        </Pressable>

        {/* Projects */}
        <Pressable
          style={({ pressed }) => [styles.cardRow, pressed && styles.cardPressed]}
          onPress={() => openService(router, 'projects')}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconBoxRow,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.14)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name="apps"
              size={20}
              color={isDark ? '#818CF8' : '#4338CA'}
            />
          </View>
          <View style={styles.cardRowText}>
            <Text style={styles.cardRowTitle}>Projects</Text>
            <Text style={styles.cardRowSub}>Find collaborators</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    headingIndicator: {
      width: 4,
      height: 12,
      borderRadius: 2,
      backgroundColor: isDark ? '#818CF8' : '#2563EB',
    },
    sectionHeading: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#818CF8' : '#2563EB',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    rowThree: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    cardCol: {
      flex: 1,
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingVertical: 14,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    marketplaceCardActive: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    cardTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
      textAlign: 'center',
      marginBottom: 1,
    },
    cardSub: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
    rowTwo: {
      flexDirection: 'row',
      gap: 8,
    },
    cardRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingVertical: 11,
      paddingHorizontal: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    iconBoxRow: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    cardRowText: {
      flex: 1,
    },
    cardRowTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 1,
    },
    cardRowSub: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
