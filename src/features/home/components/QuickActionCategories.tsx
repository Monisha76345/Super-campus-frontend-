import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { openService } from '@/features/campus/navigation';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientBg: string;
  iconColor: string;
  glowColor: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'food',
    title: 'Food & Bites',
    subtitle: 'Campus Cafes',
    badge: 'Open',
    icon: 'fast-food',
    gradientBg: 'rgba(245, 158, 11, 0.18)',
    iconColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'outpass',
    title: 'Gate Pass',
    subtitle: 'Instant QR',
    badge: 'Fast',
    icon: 'qr-code',
    gradientBg: 'rgba(14, 165, 233, 0.18)',
    iconColor: '#38BDF8',
    glowColor: 'rgba(14, 165, 233, 0.35)',
  },
  {
    id: 'sports',
    title: 'Arena & Turf',
    subtitle: 'Court Slots',
    icon: 'basketball',
    gradientBg: 'rgba(139, 92, 246, 0.18)',
    iconColor: '#A78BFA',
    glowColor: 'rgba(139, 92, 246, 0.35)',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    subtitle: 'Buy & Sell',
    badge: 'Popular',
    icon: 'bag-handle',
    gradientBg: 'rgba(16, 185, 129, 0.18)',
    iconColor: '#34D399',
    glowColor: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'projects',
    title: 'Collab Lab',
    subtitle: 'Find Teams',
    icon: 'terminal',
    gradientBg: 'rgba(99, 102, 241, 0.18)',
    iconColor: '#818CF8',
    glowColor: 'rgba(99, 102, 241, 0.35)',
  },
  {
    id: 'connect',
    title: 'Connect',
    subtitle: 'Community',
    icon: 'people',
    gradientBg: 'rgba(192, 132, 252, 0.18)',
    iconColor: '#C084FC',
    glowColor: 'rgba(192, 132, 252, 0.35)',
  },
  {
    id: 'messages',
    title: 'Messages',
    subtitle: 'Campus chat',
    icon: 'chatbubbles',
    gradientBg: 'rgba(96, 165, 250, 0.18)',
    iconColor: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.35)',
  },
];

export function QuickActionCategories() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const onCategoryPress = (category: CategoryItem) => {
    openService(router, category.id);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Campus Services</Text>
        <Text style={styles.sectionSub}>Quick access</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onCategoryPress(item)}
            style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]}>
            {/* Top Micro-Badge if present */}
            {item.badge && (
              <View style={styles.cardMicroBadge}>
                <Text style={styles.cardMicroBadgeText}>{item.badge}</Text>
              </View>
            )}

            {/* Glowing Icon Squircle */}
            <View
              style={[
                styles.iconSquircle,
                {
                  backgroundColor: item.gradientBg,
                  borderColor: item.glowColor,
                },
              ]}>
              <Ionicons name={item.icon} size={22} color={item.iconColor} />
            </View>

            {/* Title & Micro-subtitle */}
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.categorySubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  wrapper: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: Typography.black,
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: Colors.text.accent,
    fontWeight: '600',
  },
  scrollContainer: {
    marginHorizontal: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: 104,
    backgroundColor: Colors.background.surface,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: Colors.border.subtle,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardMicroBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  cardMicroBadgeText: {
    fontFamily: Typography.bold,
    fontSize: 8,
    color: Colors.text.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  iconSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryTitle: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
});
}
