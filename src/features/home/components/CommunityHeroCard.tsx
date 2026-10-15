import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface CommunityHeroCardProps {
  title: string;
  campusName: string;
  category?: string;
  description: string;
  attendeesCount?: number;
}

export function CommunityHeroCard({
  title,
  campusName,
  category = 'CAMPUS SPOTLIGHT',
  description,
  attendeesCount = 142,
}: CommunityHeroCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();

  return (
    <Card style={styles.card}>
      {/* Dynamic Background Glow Elements */}
      <View style={styles.ambientOrbCyan} pointerEvents="none" />
      <View style={styles.ambientOrbViolet} pointerEvents="none" />

      {/* Top Header Tag & Live Pulse Indicator */}
      <View style={styles.topRow}>
        <View style={styles.badgePill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.badgeText}>{category}</Text>
        </View>

        <Text style={styles.campusTag}>{campusName}</Text>
      </View>

      {/* Main Title & Description */}
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.descriptionText}>{description}</Text>

      {/* Footer: Social Attendees Avatars + Explore CTA Button */}
      <View style={styles.footerRow}>
        <View style={styles.attendeesCluster}>
          <View style={[styles.miniAvatar, { backgroundColor: '#4F46E5', zIndex: 3 }]}>
            <Text style={styles.miniAvatarText}>AK</Text>
          </View>
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: '#059669', marginLeft: -8, zIndex: 2 },
            ]}>
            <Text style={styles.miniAvatarText}>RV</Text>
          </View>
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: '#D97706', marginLeft: -8, zIndex: 1 },
            ]}>
            <Text style={styles.miniAvatarText}>SK</Text>
          </View>
          <Text style={styles.attendeesLabel}>+{attendeesCount} active</Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={() => router.push('/connect')}
          style={({ pressed }) => [styles.exploreBtn, pressed && styles.pressed]}>
          <Text style={styles.exploreText}>Explore</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </Pressable>
      </View>
    </Card>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: Colors.background.surface,
    borderWidth: 1.2,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ambientOrbCyan: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
  },
  ambientOrbViolet: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  badgeText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: Colors.text.accent,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  campusTag: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  titleText: {
    fontFamily: Typography.black,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  descriptionText: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  attendeesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  attendeesLabel: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreText: {
    fontFamily: Typography.bold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
}
