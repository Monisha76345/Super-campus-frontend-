import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

export function TrendingAndInternships() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const campusName = 'NMIT';
  const [likesCount, setLikesCount] = useState(38);
  const [hasLiked, setHasLiked] = useState(false);

  const toggleLike = () => {
    setLikesCount((prev) => (hasLiked ? prev - 1 : prev + 1));
    setHasLiked(!hasLiked);
  };

  return (
    <View style={styles.gridContainer}>
      {/* Left Column: Campus Buzz / Community */}
      <View style={styles.column}>
        <View style={styles.headerColumn}>
          <Text style={styles.sectionHeaderTitle}>Campus Buzz</Text>
          <Text style={styles.sectionHeaderSub}>Trending posts</Text>
        </View>

        {/* Community Post Card */}
        <Card style={styles.postCard}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AM</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                Aarav Mehta
              </Text>
              <Text style={styles.userSub} numberOfLines={1}>
                AI Club • 2h ago
              </Text>
            </View>
          </View>

          <Text style={styles.postContent} numberOfLines={3}>
            SuperHack 2026 is announced! Need 1 React Native dev for our team. DM to join! 🚀
          </Text>

          {/* Hashtags */}
          <View style={styles.hashtagRow}>
            <Text style={styles.hashtag}>#Hackathon</Text>
            <Text style={styles.hashtag}>#Collab</Text>
          </View>

          {/* Social Stats Row */}
          <View style={styles.statsRow}>
            <Pressable onPress={toggleLike} style={styles.statButton}>
              <Ionicons
                name={hasLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={hasLiked ? '#6366F1' : '#94A3B8'}
              />
              <Text style={[styles.statText, hasLiked && styles.likedText]}>
                {likesCount}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Comments', '14 campus comments loaded.')}
              style={styles.statButton}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.statText}>14</Text>
            </Pressable>
          </View>
        </Card>

        {/* View All Community Link */}
        <Pressable
          onPress={() => router.push('/buzz')}
          style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}>
          <Text style={styles.seeAllText}>Explore community</Text>
          <Ionicons name="arrow-forward" size={13} color="#C084FC" />
        </Pressable>
      </View>

      {/* Right Column: Career Radar / Internships */}
      <View style={styles.column}>
        <View style={styles.headerColumn}>
          <Text style={styles.sectionHeaderTitle}>Career Radar</Text>
          <Text style={styles.sectionHeaderSub}>Internships & roles</Text>
        </View>

        {/* Internship Card 1 */}
        <Pressable
          onPress={() =>
            Alert.alert(
              'Application Info',
              'Frontend Developer Intern @ Razorpay Labs\nStipend: ₹35,000/mo\nRole: React Native & Web\nApplications open till Oct 10.'
            )
          }
          style={({ pressed }) => [styles.internshipCard, pressed && styles.cardPressed]}>
          <View style={styles.cardHeaderSmall}>
            <View style={styles.briefcaseIconBox}>
              <Ionicons name="briefcase" size={16} color="#A78BFA" />
            </View>
            <View style={styles.stipendPill}>
              <Text style={styles.stipendText}>₹35k/mo</Text>
            </View>
          </View>

          <Text style={styles.internshipRole} numberOfLines={1}>
            Frontend Intern
          </Text>
          <Text style={styles.internshipCompany} numberOfLines={1}>
            Razorpay Labs
          </Text>
          <Text style={styles.internshipMeta}>Remote • 3 months</Text>
        </Pressable>

        {/* Internship Card 2 */}
        <Pressable
          onPress={() =>
            Alert.alert(
              'Application Info',
              `UI/UX Design Fellow @ ${campusName} Incubation Center\nStipend: ₹20,000/mo\nRole: Figma & Mobile Design\nApplications open till Oct 15.`
            )
          }
          style={({ pressed }) => [styles.internshipCard, pressed && styles.cardPressed]}>
          <View style={styles.cardHeaderSmall}>
            <View style={[styles.briefcaseIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
              <Ionicons name="color-palette" size={16} color="#38BDF8" />
            </View>
            <View style={[styles.stipendPill, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
              <Text style={[styles.stipendText, { color: '#38BDF8' }]}>₹20k/mo</Text>
            </View>
          </View>

          <Text style={styles.internshipRole} numberOfLines={1}>
            UI Design Fellow
          </Text>
          <Text style={styles.internshipCompany} numberOfLines={1}>
            Campus Incubator
          </Text>
          <Text style={styles.internshipMeta}>On-campus • Flexible</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  column: {
    flex: 1,
  },
  headerColumn: {
    marginBottom: 10,
    minHeight: 38,
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontFamily: Typography.black,
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionHeaderSub: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  postCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: Colors.background.surface,
    borderWidth: 1.2,
    borderColor: Colors.border.subtle,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Typography.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  userSub: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  postContent: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 16,
  },
  hashtagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  hashtag: {
    fontFamily: Typography.semiBold,
    fontSize: 10,
    color: Colors.text.accent,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  likedText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '600',
  },
  internshipCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: Colors.background.surface,
    borderWidth: 1.2,
    borderColor: Colors.border.subtle,
    marginBottom: 10,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  briefcaseIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stipendPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stipendText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#34D399',
    fontWeight: '700',
  },
  internshipRole: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  internshipCompany: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  internshipMeta: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.accent,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  pressed: {
    opacity: 0.7,
  },
});
}
