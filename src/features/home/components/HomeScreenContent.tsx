import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { openTab } from '@/features/campus/navigation';
import { useAuthSession } from '@/features/auth';
import { profileApi } from '@/features/profile/api/profile-api';
import { CampusProfile } from '@/features/profile/types';

import { CommunityHeroCard } from './CommunityHeroCard';
import { FoodDiningSection } from './FoodDiningSection';
import { GreetingBanner } from './GreetingBanner';
import { HomeBottomTabs, TabKey } from './HomeBottomTabs';
import { HomeHeader } from './HomeHeader';
import { QuickActionCategories } from './QuickActionCategories';
import { StatusCardsGrid } from './StatusCardsGrid';
import { CsvDirectoryImportModal } from '@/features/campus/components/admin/CsvDirectoryImportModal';

export function HomeScreenContent() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const { user } = useAuthSession();
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab] = useState<TabKey>('home');
  const [showCsvModal, setShowCsvModal] = useState(false);

  const roleNormalized = (user?.role || '').toLowerCase();
  const isSuperAdmin =
    roleNormalized === 'superadmin' ||
    roleNormalized === 'admin' ||
    roleNormalized === 'campus_admin';

  const fetchProfile = useCallback(async () => {
    if (!user?.token || !user?.tenantId) return;
    try {
      const data = await profileApi.getMine({ token: user.token, tenantId: user.tenantId });
      setProfile(data);
    } catch {
      // Fallback silently to session details on network delay
    }
  }, [user?.token, user?.tenantId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleCenterScan = () => {
    router.push('/scan');
  };

  const displayName =
    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null) ||
    user?.fullName ||
    'Student';

  const campusDisplayName = user?.campusName || 'NMIT Bengaluru';
  const studentId = profile?.usn || (user?.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT');
  const department =
    profile?.department ||
    (user?.role === 'admin'
      ? 'Administration'
      : user?.role === 'faculty'
        ? 'Faculty'
        : 'Engineering');
  const academicYear = profile?.batch || '2024';

  return (
    <View style={styles.root}>
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
          campusName={campusDisplayName}
          userName={displayName}
          onProfilePress={() => router.push('/profile')}
          onNotificationPress={() => router.push('/notifications')}
        />

        {/* Super Admin Privileges: CSV Directory Import Hub */}
        {isSuperAdmin && (
          <View style={styles.superAdminCard}>
            <View style={styles.superAdminHeaderRow}>
              <View style={styles.superAdminPill}>
                <Ionicons name="shield-checkmark" size={13} color="#38BDF8" />
                <Text style={styles.superAdminPillText}>
                  {roleNormalized === 'superadmin' ? 'SUPER ADMIN PRIVILEGES' : 'CAMPUS ADMIN PRIVILEGES'}
                </Text>
              </View>
              <View style={styles.multiTenantTag}>
                <Ionicons name="globe-outline" size={12} color="#A78BFA" />
                <Text style={styles.multiTenantTagText}>
                  {roleNormalized === 'superadmin' ? 'Multi-Tenant Root' : 'Campus Console'}
                </Text>
              </View>
            </View>

            <Text style={styles.superAdminTitle}>Campus Directory & CSV Onboarding</Text>
            <Text style={styles.superAdminSubtitle}>
              Batch onboard students, faculties, and administrators directly into campus databases with automated schema validation.
            </Text>

            <Pressable
              onPress={() => setShowCsvModal(true)}
              style={({ pressed }) => [styles.csvUploadButton, pressed && styles.pressed]}>
              <View style={styles.csvIconCircle}>
                <Ionicons name="cloud-upload-outline" size={18} color="#080B11" />
              </View>
              <View style={styles.csvButtonTextWrapper}>
                <Text style={styles.csvButtonTitle}>Import Directory CSV</Text>
                <Text style={styles.csvButtonSub}>Upload batch CSV spreadsheet to tenant database</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
            </Pressable>
          </View>
        )}

        {/* 1. Greeting Banner with Learn Build Belong motto */}
        <GreetingBanner
          userName={displayName}
          subtitle="Your people. Your campus. Your next step."
        />

        {/* 2. Community Spotlight Banner */}
        <CommunityHeroCard
          category="FROM YOUR COMMUNITY"
          title={`Around campus with ${displayName}`}
          campusName={campusDisplayName}
          description="Find your community, projects, and campus updates in one place."
        />

        {/* 3. Core Campus Services (Food, Marketplace, Sports, Outpass, Projects) */}
        <QuickActionCategories />

        {/* 4. Live Status Cards (Upcoming Booking & Outpass Status) */}
        <StatusCardsGrid />

        {/* 5. Campus Bites & Cafeterias */}
        <FoodDiningSection />

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

      {/* Super Admin Bulk Directory Import Modal */}
      <CsvDirectoryImportModal
        visible={showCsvModal}
        onClose={() => setShowCsvModal(false)}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
  superAdminCard: {
    backgroundColor: '#0A0F1D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  superAdminHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  superAdminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  superAdminPillText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  multiTenantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  multiTenantTagText: {
    fontFamily: Typography.medium,
    fontSize: 10,
    color: '#C4B5FD',
    fontWeight: '500',
  },
  superAdminTitle: {
    fontFamily: Typography.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  superAdminSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
    marginBottom: 16,
  },
  csvUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 12,
  },
  csvIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvButtonTextWrapper: {
    flex: 1,
  },
  csvButtonTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  csvButtonSub: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: '#94A3B8',
  },
});
}
