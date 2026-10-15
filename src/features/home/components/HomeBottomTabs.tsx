import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

export type TabKey = 'home' | 'services' | 'community' | 'profile';

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

const LEFT_TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'services', label: 'Services', icon: 'grid-outline', activeIcon: 'grid' },
];

const RIGHT_TABS: TabItem[] = [
  { key: 'community', label: 'Buzz', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', badge: true },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export function HomeBottomTabs({
  activeTab,
  onTabChange,
  onCenterActionPress,
}: HomeBottomTabsProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const handleCenterAction = () => {
    if (onCenterActionPress) {
      onCenterActionPress();
    } else {
      Alert.alert(
        'Campus Quick Pass & Scanner',
        'Ready to scan Library Kiosk, Turnstile Gate, or Cafeteria QR code.\nInstant verification active.'
      );
    }
  };

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.key;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onTabChange(tab.key)}
        style={({ pressed }) => [styles.tabButton, pressed && styles.tabPressed]}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={22}
            color={isActive ? Colors.primary.cyan : Colors.text.secondary}
          />
          {tab.badge && !isActive && <View style={styles.tabBadgeDot} />}
        </View>
        <Text style={[styles.tabLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
          {tab.label}
        </Text>
        {isActive && <View style={styles.activeUnderlineDot} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.capsuleWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* Ambient Neon Backlight Glow behind the Capsule */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Floating Frosted Glass Capsule Bar */}
      <View style={styles.capsuleBar}>
        {/* Left Side Tabs */}
        <View style={styles.tabGroup}>{LEFT_TABS.map(renderTab)}</View>

        {/* Center Elevated Floating Quick-Action / Scanner Button */}
        <View style={styles.centerButtonAnchor}>
          <Pressable
            onPress={handleCenterAction}
            style={({ pressed }) => [styles.centerButton, pressed && styles.centerButtonPressed]}>
            <View style={styles.centerButtonGlow} />
            <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            <Text style={styles.centerButtonSub}>SCAN</Text>
          </Pressable>
        </View>

        {/* Right Side Tabs */}
        <View style={styles.tabGroup}>{RIGHT_TABS.map(renderTab)}</View>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  capsuleWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 99,
  },
  ambientGlow: {
    position: 'absolute',
    bottom: -6,
    width: '88%',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.28)',
    filter: Platform.OS === 'web' ? 'blur(18px)' : undefined,
  },
  capsuleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 68,
    paddingHorizontal: 8,
    borderRadius: 38,
    backgroundColor: Colors.background.bar,
    borderWidth: 1.2,
    borderColor: Colors.border.card,
    // Floating elevation & drop shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 16,
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    marginBottom: 2,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8', // Cyan glowing dot
    borderWidth: 1,
    borderColor: Colors.background.canvas,
  },
  tabLabel: {
    fontFamily: Typography.medium,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: Colors.text.accent,
    fontFamily: Typography.bold,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: Colors.text.secondary,
  },
  activeUnderlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.cyan,
    marginTop: 2,
  },
  centerButtonAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    marginTop: -28, // Floats cleanly out of the capsule bar
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#313491', // Vivid Indigo
    borderWidth: 2,
    borderColor: 'rgba(199, 210, 254, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 12,
  },
  centerButtonGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(129, 140, 248, 0.25)',
  },
  centerButtonSub: {
    fontFamily: Typography.black,
    fontSize: 8,
    fontWeight: '900',
    color: Colors.text.onBrandMuted,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  centerButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
});
}
