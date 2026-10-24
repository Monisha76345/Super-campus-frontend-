import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';

interface FeedHeaderProps {
  campusName: string;
  onRefresh: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onConnectPress?: () => void;
  isRefreshing?: boolean;
}

export function FeedHeader({
  campusName,
  onRefresh,
  onProfilePress,
  onNotificationPress,
  onConnectPress,
  isRefreshing,
}: FeedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Navbar Row */}
      <View style={styles.topRow}>
        {/* Brand Logo & Name */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={17} color={isDark ? '#A78BFA' : Colors.primary.main} />
          </View>
          <Text style={styles.brandTitle}>SuperCampus</Text>
        </View>

        {/* Campus Location Pill */}
        <View style={styles.campusPill}>
          <Ionicons name="location-sharp" size={12} color={isDark ? '#818CF8' : Colors.primary.accent} />
          <Text style={styles.campusPillText} numberOfLines={1}>
            {campusName.replace(/\s*campus\s*/i, '').trim()} campus
          </Text>
        </View>

        {/* Notifications Bell */}
        <Pressable
          onPress={onNotificationPress}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={21} color={Colors.text.primary} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      {/* Title & Actions Bar */}
      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.feedTitle}>Feed</Text>
          <Text style={styles.feedSubtitle}>What's happening around you</Text>
        </View>

        <View style={styles.actionsGroup}>
          {/* Community / Connect button */}
          <Pressable
            onPress={onConnectPress}
            hitSlop={6}
            style={({ pressed }) => [styles.actionCircle, pressed && styles.pressed]}>
            <Ionicons name="people-outline" size={19} color={Colors.text.secondary} />
          </Pressable>

          {/* Profile Quick Action */}
          <Pressable
            onPress={onProfilePress}
            hitSlop={6}
            style={({ pressed }) => [styles.actionCircle, pressed && styles.pressed]}>
            <Ionicons name="person-circle-outline" size={21} color={Colors.text.secondary} />
          </Pressable>

          {/* Refresh Action */}
          <Pressable
            onPress={onRefresh}
            hitSlop={6}
            style={({ pressed }) => [styles.actionCircle, pressed && styles.pressed]}>
            <Ionicons
              name="refresh"
              size={18}
              color={isRefreshing ? (isDark ? '#38BDF8' : Colors.primary.main) : Colors.text.secondary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: Colors.background.canvas,
    },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Typography.bold,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(129, 140, 248, 0.12)' : 'rgba(49, 52, 145, 0.08)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(129, 140, 248, 0.25)' : 'rgba(49, 52, 145, 0.18)',
    maxWidth: 160,
  },
  campusPillText: {
    fontFamily: Typography.medium,
    fontSize: 11.5,
    fontWeight: '600',
    color: isDark ? '#C7D2FE' : Colors.primary.main,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: isDark ? '#38BDF8' : Colors.primary.main,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  titleColumn: {
    flex: 1,
  },
  feedTitle: {
    fontFamily: Typography.bold,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  feedSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 12.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
    pressed: {
      opacity: 0.6,
    },
  });
}
