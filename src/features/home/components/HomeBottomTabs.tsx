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
import { useAuthSession } from '@/features/auth';

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
  const { user } = useAuthSession();

  const campusPrefix = user?.campusName?.replace(/\s*campus\s*/i, '').trim() || 'NMIT';

  const TABS: TabItem[] = useMemo(
    () => [
      { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'discover', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
      { key: 'connect', label: `${campusPrefix}\nConnect`, icon: 'people-outline', activeIcon: 'people' },
      { key: 'inbox', label: 'Inbox', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ],
    [campusPrefix],
  );

  const isTabActive = (tabKey: TabKey) => {
    if (activeTab === tabKey) return true;
    if (tabKey === 'inbox' && activeTab === 'community') return true;
    if (tabKey === 'discover' && activeTab === 'services') return true;
    return false;
  };

  const renderTab = (tab: TabItem) => {
    const isActive = isTabActive(tab.key);
    const isConnect = tab.key === 'connect';

    return (
      <Pressable
        key={tab.key}
        onPress={() => onTabChange(tab.key)}
        style={({ pressed }) => [
          styles.tabButton,
          isConnect && styles.connectTabButton,
          pressed && styles.tabPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
        <View style={[styles.iconContainer, isConnect && isActive && styles.activeConnectPill]}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={isConnect ? 22 : 21}
            color={
              isActive
                ? isConnect
                  ? '#FFFFFF'
                  : isDark
                    ? '#F8FAFC'
                    : Colors.primary.main
                : isDark
                  ? '#94A3B8'
                  : Colors.text.secondary
            }
          />
          {tab.badge && !isActive && <View style={styles.tabBadgeDot} />}
        </View>

        <Text
          numberOfLines={2}
          style={[
            styles.tabLabel,
            isConnect && styles.connectTabLabel,
            isActive
              ? isConnect
                ? styles.activeConnectLabel
                : styles.activeLabel
              : styles.inactiveLabel,
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
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.12)',
      filter: Platform.OS === 'web' ? 'blur(18px)' : undefined,
    },
    capsuleBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      height: 70,
      paddingHorizontal: 6,
      borderRadius: 36,
      backgroundColor: Colors.background.bar,
      borderWidth: 1.2,
      borderColor: Colors.border.card,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.14,
      shadowRadius: 22,
      elevation: 16,
    },
    tabButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      flex: 1,
    },
    connectTabButton: {
      minWidth: 70,
    },
    tabPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.94 }],
    },
    iconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      height: 30,
      marginBottom: 2,
    },
    activeConnectPill: {
      backgroundColor: Colors.primary.main,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.25)',
      paddingHorizontal: 20,
      paddingVertical: 3,
      borderRadius: 18,
      height: 30,
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.45 : 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    tabBadgeDot: {
      position: 'absolute',
      top: 0,
      right: -4,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.primary.cyan,
      borderWidth: 1,
      borderColor: Colors.background.canvas,
    },
    tabLabel: {
      fontFamily: Typography.medium,
      fontSize: 10,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    connectTabLabel: {
      fontSize: 9.5,
      lineHeight: 12,
      fontWeight: '700',
    },
    activeLabel: {
      color: Colors.text.accent,
      fontFamily: Typography.bold,
      fontWeight: '700',
    },
    activeConnectLabel: {
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
      fontFamily: Typography.bold,
      fontWeight: '800',
    },
    inactiveLabel: {
      color: Colors.text.secondary,
    },
  });
}
