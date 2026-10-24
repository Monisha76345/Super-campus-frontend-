import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

interface SubmissionsBannerProps {
  count?: number;
  onPressView: () => void;
}

export function SubmissionsBanner({
  count = 0,
  onPressView,
}: SubmissionsBannerProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My submissions</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Posts sent for approval appear here.</Text>

      <Pressable
        onPress={onPressView}
        hitSlop={6}
        style={({ pressed }) => [styles.linkWrapper, pressed && styles.pressed]}>
        <Text style={styles.linkText}>View submissions</Text>
      </Pressable>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    countBadge: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.08)',
    },
    countText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    subtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 10,
    },
    linkWrapper: {
      alignSelf: 'flex-start',
    },
    linkText: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#818CF8' : Colors.primary.main,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}

