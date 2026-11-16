import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { fetchFoodBusinessesApi, fetchFoodStatusApi } from '@/features/campus/food-api';
import { FoodBusiness } from '@/features/campus/food-types';
import { useAppTheme } from '@/theme/app-theme';

export function FoodDiningSection() {
  const { colors: Colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const router = useRouter();
  const { user } = useAuthSession();
  const [stores, setStores] = useState<FoodBusiness[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.token) {
        if (!cancelled) {
          setStores([]);
          setReady(false);
        }
        return;
      }
      try {
        const status = await fetchFoodStatusApi(user.token, user.tenantId || 'nmit');
        if (!status.enabled) {
          if (!cancelled) {
            setStores([]);
            setReady(false);
          }
          return;
        }
        const list = await fetchFoodBusinessesApi(user.token, user.tenantId || 'nmit');
        if (!cancelled) {
          setStores(list.slice(0, 6));
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setStores([]);
          setReady(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.token, user?.tenantId]);

  const cards =
    ready && stores.length > 0
      ? stores
      : [
          {
            business_id: 'placeholder',
            business_name: 'Campus dining',
            is_open: true,
            has_self_pick_up: true,
          } as FoodBusiness,
        ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.headingIndicator} />
          <Text style={styles.sectionTitle}>Food for you</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          {ready && stores.length > 0
            ? 'Order from ChangePay campus cafes'
            : 'Campus dining · open Food to order'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        {cards.map((store) => (
          <Pressable
            key={store.business_id}
            onPress={() => router.push('/food')}
            style={({ pressed }) => [styles.foodCard, pressed && styles.cardPressed]}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
                },
              ]}>
              <Ionicons name="restaurant" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>

            <Text style={styles.menuComingText} numberOfLines={2}>
              {store.business_name}
            </Text>
            <Text style={styles.soonText}>
              {ready
                ? store.is_open === false
                  ? 'Closed now'
                  : 'Open now'
                : 'Tap to browse'}
            </Text>

            <Text style={styles.campusDiningText}>
              {store.has_self_pick_up ? 'Self pickup' : 'Campus dining'}
            </Text>
            <Text style={styles.notAvailableText}>
              {ready ? 'Order in app' : 'ChangePay ready'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    header: {
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    headingIndicator: {
      width: 4,
      height: 14,
      borderRadius: 2,
      backgroundColor: isDark ? '#FBBF24' : '#D97706',
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    sectionSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    scrollView: {
      marginHorizontal: -18,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 16,
      gap: 12,
    },
    foodCard: {
      width: 114,
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      padding: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    menuComingText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.primary,
      lineHeight: 15,
      minHeight: 30,
    },
    soonText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
      marginBottom: 14,
    },
    campusDiningText: {
      fontFamily: Typography.semiBold,
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#FBBF24' : '#D97706',
      marginBottom: 2,
    },
    notAvailableText: {
      fontFamily: Typography.regular,
      fontSize: 9,
      color: Colors.text.tertiary,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
