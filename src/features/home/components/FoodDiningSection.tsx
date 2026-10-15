import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface FoodOutlet {
  id: string;
  name: string;
  category: string;
  rating: string;
  status: string;
  waitTime: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}

const FOOD_OUTLETS: FoodOutlet[] = [
  {
    id: '1',
    name: 'Student Bistro',
    category: 'Fast Food & Snacks',
    rating: '4.8',
    status: 'Open now',
    waitTime: '10m wait',
    icon: 'pizza',
    accentColor: '#F59E0B',
  },
  {
    id: '2',
    name: 'Tech Cafe Express',
    category: 'Coffee & Bakery',
    rating: '4.7',
    status: 'Open now',
    waitTime: '5m wait',
    icon: 'cafe',
    accentColor: '#38BDF8',
  },
  {
    id: '3',
    name: 'Food Court',
    category: 'Meals & Combos',
    rating: '4.9',
    status: 'Open now',
    waitTime: '12m wait',
    icon: 'restaurant',
    accentColor: '#10B981',
  },
  {
    id: '4',
    name: 'Juice & Greens',
    category: 'Shakes & Healthy',
    rating: '4.6',
    status: 'Open now',
    waitTime: '3m wait',
    icon: 'nutrition',
    accentColor: '#A855F7',
  },
];

export function FoodDiningSection({ campusName = 'NMIT' }: { campusName?: string }) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const outlets = FOOD_OUTLETS.map((item) =>
    item.id === '3' ? { ...item, name: `${campusName} Food Court` } : item,
  );
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Campus Bites & Cafes</Text>
          <Text style={styles.sectionSubtitle}>Skip the queue • Order ahead</Text>
        </View>
        <Pressable
          onPress={() => router.push('/food')}
          style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={13} color={Colors.text.accent} />
        </Pressable>
      </View>

      {/* Horizontal Scroll of Menu Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        {outlets.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              Alert.alert(
                item.name,
                `${item.name}\nRating: ⭐ ${item.rating} • ${item.waitTime}\nMenu browsing is coming in the next build.`
              )
            }
            style={({ pressed }) => [styles.outletCard, pressed && styles.cardPressed]}>
            {/* Top Icon and Rating Badge */}
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${item.accentColor}22` },
                ]}>
                <Ionicons name={item.icon} size={22} color={item.accentColor} />
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#FBBF24" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>

            {/* Outlet Name & Category */}
            <Text style={styles.outletName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.outletCategory} numberOfLines={1}>
              {item.category}
            </Text>

            {/* Wait time pill */}
            <View style={styles.waitBadge}>
              <Ionicons name="time-outline" size={11} color={Colors.text.accent} />
              <Text style={styles.waitText}>{item.waitTime}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Typography.black,
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  viewAllText: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
    color: Colors.text.accent,
    fontWeight: '600',
  },
  scrollView: {
    marginHorizontal: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  outletCard: {
    width: 144,
    backgroundColor: Colors.background.surface,
    borderWidth: 1.2,
    borderColor: Colors.border.subtle,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#FBBF24',
    fontWeight: '700',
  },
  outletName: {
    fontFamily: Typography.bold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  outletCategory: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  waitText: {
    fontFamily: Typography.medium,
    fontSize: 10,
    color: Colors.text.accent,
    fontWeight: '600',
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
