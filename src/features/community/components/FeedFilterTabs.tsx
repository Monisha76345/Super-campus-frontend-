import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

export type FeedFilterType = 'campus' | 'following' | 'clubs';

interface FeedFilterTabsProps {
  selectedFilter: FeedFilterType;
  onSelectFilter: (filter: FeedFilterType) => void;
}

export function FeedFilterTabs({
  selectedFilter,
  onSelectFilter,
}: FeedFilterTabsProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const TABS: { id: FeedFilterType; label: string; soon?: boolean }[] = [
    { id: 'campus', label: 'Campus' },
    { id: 'following', label: 'Following · Soon', soon: true },
    { id: 'clubs', label: 'Clubs · Soon', soon: true },
  ];

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isSelected = selectedFilter === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelectFilter(tab.id)}
            style={({ pressed }) => [
              styles.pill,
              isSelected ? styles.activePill : styles.inactivePill,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.label,
                isSelected ? styles.activeLabel : styles.inactiveLabel,
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    activePill: {
      backgroundColor: isDark ? 'rgba(14, 165, 233, 0.16)' : 'rgba(49, 52, 145, 0.1)',
      borderColor: isDark ? '#0284C7' : Colors.primary.main,
    },
    inactivePill: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1,
    },
    label: {
      fontFamily: Typography.medium,
      fontSize: 12,
      fontWeight: '600',
    },
    activeLabel: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontWeight: '700',
    },
    inactiveLabel: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

