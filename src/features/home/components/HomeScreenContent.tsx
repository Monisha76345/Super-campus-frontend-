import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { openTab } from '@/features/campus/navigation';

import { CommunityHeroCard } from './CommunityHeroCard';
import { DigitalStudentIDCard } from './DigitalStudentIDCard';
import { FoodDiningSection } from './FoodDiningSection';
import { HomeBottomTabs, TabKey } from './HomeBottomTabs';
import { HomeHeader } from './HomeHeader';
import { LiveBentoWidgets } from './LiveBentoWidgets';
import { QuickActionCategories } from './QuickActionCategories';
import { TrendingAndInternships } from './TrendingAndInternships';

export function HomeScreenContent() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab] = useState<TabKey>('home');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 900);
  };

  const handleCenterScan = () => {
    router.push('/scan');
  };

  return (
    <View style={styles.root}>
      {/* Ambient background lighting */}
      <View style={styles.bgAmbientTop} pointerEvents="none" />
      <View style={styles.bgAmbientMid} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#818CF8"
            colors={['#818CF8']}
          />
        }>
        {/* Top Header Bar */}
        <HomeHeader
          campusName="NMIT Bengaluru"
          userName="Dr"
          onProfilePress={() => router.push('/profile')}
          onNotificationPress={() => router.push('/notifications')}
        />

        {/* 1. Futuristic Digital Student ID Card */}
        <DigitalStudentIDCard
          studentName="Druva"
          studentId="1NT22AD015"
          department="AI & Data Science"
          academicYear="2022"
          campusName="NMIT Bengaluru"
        />

        {/* 2. Asymmetric Live Bento Widgets (Schedule, Attendance, Outpass) */}
        <LiveBentoWidgets />

        {/* 3. Quick Action Hub / Services */}
        <QuickActionCategories />

        {/* 4. Campus Spotlight Hero */}
        <CommunityHeroCard
          title="Around campus"
          campusName="NMIT Bengaluru"
          description="Find your community, projects, and campus updates in one place."
        />

        {/* 5. Campus Bites & Cafeterias */}
        <FoodDiningSection />

        {/* 6. Trending Buzz & Career Opportunities */}
        <TrendingAndInternships />

        {/* Refresh Campus Updates Button */}
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
          <Ionicons name="refresh" size={15} color={Colors.text.accent} />
          <Text style={styles.refreshButtonText}>Refresh campus live feed</Text>
        </Pressable>
      </ScrollView>

      {/* Floating Frosted Glass Capsule Navigation Bar with Center Scan Action */}
      <HomeBottomTabs
        activeTab={activeTab}
        onTabChange={(tab) => openTab(router, tab)}
        onCenterActionPress={handleCenterScan}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
    position: 'relative',
  },
  bgAmbientTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  bgAmbientMid: {
    position: 'absolute',
    top: 360,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 118, // Generous padding to float smoothly above the capsule bar
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  refreshButtonText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: Colors.text.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
}
