import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';

export function FoodDiningSection() {
  const { colors: Colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const router = useRouter();

  const dummyCards = [1, 2, 3, 4];

  return (
    <View style={styles.container}>
      {/* Header matching screenshot with subtle indicator */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.headingIndicator} />
          <Text style={styles.sectionTitle}>Food for you</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Campus dining · coming soon</Text>
      </View>

      {/* Horizontal Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {dummyCards.map((item) => (
          <Pressable
            key={item}
            onPress={() => router.push('/food')}
            style={({ pressed }) => [styles.foodCard, pressed && styles.cardPressed]}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.14)' : '#EEF2FF',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)',
                },
              ]}
            >
              <Ionicons
                name="restaurant"
                size={18}
                color={isDark ? '#818CF8' : '#4338CA'}
              />
            </View>

            <Text style={styles.menuComingText}>Menu coming</Text>
            <Text style={styles.soonText}>soon</Text>

            <Text style={styles.campusDiningText}>Campus dining</Text>
            <Text style={styles.notAvailableText}>Not available yet</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    header: {
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    headingIndicator: {
      width: 4,
      height: 14,
      borderRadius: 2,
      backgroundColor: isDark ? '#A78BFA' : '#4F46E5',
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    sectionSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    scrollView: {
      marginHorizontal: -18,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 16,
      gap: 12,
    },
    foodCard: {
      width: 114,
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      padding: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    menuComingText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.primary,
      lineHeight: 15,
    },
    soonText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
      marginBottom: 14,
    },
    campusDiningText: {
      fontFamily: Typography.semiBold,
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#818CF8' : '#2563EB',
      marginBottom: 2,
    },
    notAvailableText: {
      fontFamily: Typography.regular,
      fontSize: 9,
      color: Colors.text.tertiary,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
