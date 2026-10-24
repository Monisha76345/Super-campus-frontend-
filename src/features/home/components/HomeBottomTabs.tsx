import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';

export type TabKey =
  | 'home'
  | 'discover'
  | 'connect'
  | 'inbox'
  | 'profile'
  | 'services'
  | 'community';

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: boolean;
}

interface HomeBottomTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCenterActionPress?: () => void;
}

export function HomeBottomTabs({
  activeTab,
  onTabChange,
}: HomeBottomTabsProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const TABS: TabItem[] = useMemo(
    () => [
      { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'discover', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
      { key: 'connect', label: 'Connect', icon: 'people-outline', activeIcon: 'people' },
      { key: 'inbox', label: 'Inbox', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ],
    [],
  );

  const isTabActive = (tabKey: TabKey) => {
    if (activeTab === tabKey) return true;
    if (tabKey === 'inbox' && activeTab === 'community') return true;
    if (tabKey === 'discover' && activeTab === 'services') return true;
    return false;
  };

  const renderTab = (tab: TabItem) => {
    const isActive = isTabActive(tab.key);

    return (
      <Pressable
        key={tab.key}
        onPress={() => onTabChange(tab.key)}
        style={({ pressed }) => [
          styles.tabButton,
          pressed && styles.tabPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={22}
            color={
              isActive
                ? isDark
                  ? '#38BDF8'
                  : Colors.primary.main
                : isDark
                  ? '#94A3B8'
                  : '#64748B'
            }
          />
          {tab.badge && !isActive && <View style={styles.tabBadgeDot} />}
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            isActive ? styles.activeLabel : styles.inactiveLabel,
          ]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.capsuleWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* Ambient Neon Backlight Glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Floating 5-Tab Capsule Bar matching reference screenshots */}
      <View style={styles.capsuleBar}>
        {TABS.map(renderTab)}
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    capsuleWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      alignItems: 'center',
      zIndex: 99,
    },
    ambientGlow: {
      position: 'absolute',
      bottom: -6,
      width: '88%',
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(49, 52, 145, 0.08)',
      filter: Platform.OS === 'web' ? 'blur(18px)' : undefined,
    },
    capsuleBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      height: 64,
      paddingHorizontal: 6,
      borderRadius: 36,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      shadowColor: isDark ? '#000000' : 'rgba(15, 23, 42, 0.18)',
      shadowOffset: { width: 0, height: isDark ? 12 : 6 },
      shadowOpacity: isDark ? 0.6 : 0.12,
      shadowRadius: isDark ? 22 : 14,
      elevation: isDark ? 16 : 8,
    },
    tabButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      flex: 1,
    },
    tabPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.94 }],
    },
    iconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      height: 28,
      marginBottom: 2,
    },
    tabBadgeDot: {
      position: 'absolute',
      top: 0,
      right: -4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? '#38BDF8' : Colors.primary.main,
      borderWidth: 1,
      borderColor: isDark ? '#080B11' : '#FFFFFF',
    },
    tabLabel: {
      fontFamily: Typography.medium,
      fontSize: 10.5,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    activeLabel: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontFamily: Typography.bold,
      fontWeight: '700',
    },
    inactiveLabel: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
  });
}
