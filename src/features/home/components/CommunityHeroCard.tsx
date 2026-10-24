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
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    color: '#4338CA',
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  descriptionText: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  attendeesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontFamily: Typography.bold,
    fontSize: 8,
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
    backgroundColor: Colors.primary.main,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
}
