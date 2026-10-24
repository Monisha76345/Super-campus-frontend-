import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { useAppTheme } from '@/theme/app-theme';

import {
  CAMPUS_SPORTS_LIST,
  ChooseSportModal,
} from './components/sports/ChooseSportModal';
import { BookingSuccessAnimationModal } from './components/sports/BookingSuccessAnimationModal';
import { CourtPassModal } from './components/sports/CourtPassModal';
import { FindPlayersModal } from './components/sports/FindPlayersModal';
import { MyBookingsModal } from './components/sports/MyBookingsModal';
import { openTab } from './navigation';
import {
  cancelSportsBookingApi,
  fetchMySportsBookingsApi,
  fetchSportsFacilitiesApi,
} from './sports-api';
import { SportsBooking, SportsFacility, SportType } from './sports-types';

const CAMPUS_VENUES = [
  {
    id: 'venue-indoor-stadium',
    name: 'Indoor Stadium',
    subtitle: 'Indoor · Badminton',
    sportType: 'BADMINTON' as const,
  },
  {
    id: 'venue-main-complex',
    name: 'Main Sports Complex',
    subtitle: 'Outdoor · Basketball',
    sportType: 'BASKETBALL' as const,
  },
  {
    id: 'venue-pickleball-courts',
    name: 'NMIT Pickleball Courts',
    subtitle: 'Outdoor · Pickleball',
    sportType: 'PICKLEBALL' as const,
  },
];

export function SportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const token = user?.token;
  const tenantId = user?.tenantId || 'nmit';

  // State
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [myBookings, setMyBookings] = useState<SportsBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & sport preselection
  const [chooseSportVisible, setChooseSportVisible] = useState(false);
  const [selectedSportForBooking, setSelectedSportForBooking] = useState<SportType | null>(null);
  const [findPlayersVisible, setFindPlayersVisible] = useState(false);
  const [myBookingsVisible, setMyBookingsVisible] = useState(false);
  const [activePassBooking, setActivePassBooking] = useState<SportsBooking | null>(null);
  const [celebrationBooking, setCelebrationBooking] = useState<SportsBooking | null>(null);

  const handleOpenSportBooking = (sport: SportType) => {
    setSelectedSportForBooking(sport);
    setChooseSportVisible(true);
  };

  const handleOpenAllSports = () => {
    setSelectedSportForBooking(null);
    setChooseSportVisible(true);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [facList, bkList] = await Promise.all([
        fetchSportsFacilitiesApi(token, tenantId),
        fetchMySportsBookingsApi(token, tenantId),
      ]);
      setFacilities(facList);
      setMyBookings(bkList);
    } catch (err) {
      console.warn('SportsScreen load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    await cancelSportsBookingApi(token, tenantId, bookingId);
    await loadData();
  };

  // Find latest active booking if any
  const latestBooking = myBookings.find((b) => b.status === 'CONFIRMED');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topNav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topNavTitle}>Sports</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#38BDF8' : Colors.primary.main}
          />
        }
      >
        {/* Section Title matching Screenshot 1 */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Sports</Text>
          <Text style={styles.mainSubtitle}>Play. Compete. Connect.</Text>
        </View>

        {/* Hero Banner: "Same Campus. More Games." */}
        <View style={styles.heroCard}>
          {/* Subtle line-art pitch decoration */}
          <View style={styles.fieldArtPitch}>
            <View style={styles.fieldCenterCircle} />
            <View style={styles.fieldPenaltyBox} />
          </View>

          <View style={styles.heroCardContent}>
            <Text style={styles.heroCardTitle}>Same Campus.{"\n"}More Games.</Text>
            <Text style={styles.heroCardSubtitle}>Book. Play. Meet. Repeat.</Text>

            <Pressable
              onPress={handleOpenAllSports}
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>Book a Court</Text>
              <Ionicons name="arrow-forward" size={16} color="#4C1D95" />
            </Pressable>
          </View>
        </View>

        {/* Quick Sports Row matching Screenshot 1 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickSportsRow}
        >
          {CAMPUS_SPORTS_LIST.map((sport) => (
            <Pressable
              key={sport.sportType}
              onPress={() => handleOpenSportBooking(sport.sportType)}
              style={styles.quickSportCard}
            >
              <View style={styles.quickSportIconCircle}>
                <Ionicons name={sport.icon} size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickSportLabel}>{sport.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section: Upcoming Bookings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming bookings</Text>
          <Pressable onPress={() => setMyBookingsVisible(true)} hitSlop={8}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>

        {/* Card 1: Active Booking OR "Your next game starts here" */}
        {latestBooking ? (
          <Pressable
            onPress={() => setActivePassBooking(latestBooking)}
            style={styles.activeBookingCard}
          >
            <View style={styles.activeBookingHeader}>
              <View style={styles.activeBadgeRow}>
                <View style={styles.activeBadgePill}>
                  <Text style={styles.activeBadgeText}>ACTIVE PASS</Text>
                </View>
                <Text style={styles.activeSportType}>
                  {latestBooking.sportType || 'BADMINTON'}
                </Text>
              </View>
              <View style={styles.qrPassPill}>
                <Ionicons
                  name="qr-code-outline"
                  size={14}
                  color={isDark ? '#38BDF8' : Colors.primary.main}
                />
                <Text style={styles.qrPassPillText}>View QR</Text>
              </View>
            </View>

            <Text style={styles.activeCourtTitle}>
              {latestBooking.facilityName || 'Campus Court'}
            </Text>
            <Text style={styles.activeTimeText}>
              {latestBooking.bookingDate} · {latestBooking.startTime?.slice(0, 5)} -{' '}
              {latestBooking.endTime?.slice(0, 5)}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Your next game starts here</Text>
            <Text style={styles.infoCardSubtitle}>
              Book a court or join a game with others on campus.
            </Text>
          </View>
        )}

        {/* Card 2: "Find your next teammate" matching Screenshot 1 & 2 */}
        <Pressable
          onPress={() => setFindPlayersVisible(true)}
          style={styles.teammateCard}
        >
          <View style={styles.teammateCardIconCircle}>
            <Ionicons name="people" size={20} color="#DDD6FE" />
          </View>
          <View style={styles.teammateCardContent}>
            <Text style={styles.teammateCardTitle}>Find your next teammate</Text>
            <Text style={styles.teammateCardSubtitle}>
              Join an open game or invite friends to yours.
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#A78BFA"
          />
        </Pressable>

        {/* Section: Campus venues matching Screenshot 2 & 4 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Campus venues</Text>
          <Pressable onPress={handleOpenAllSports} hitSlop={8}>
            <Text style={styles.sectionLink}>Browse</Text>
          </Pressable>
        </View>

        <View style={styles.venuesGrid}>
          {CAMPUS_VENUES.map((venue) => (
            <View key={venue.id} style={styles.venuePitchCard}>
              {/* Pitch line-art decoration in background */}
              <View style={styles.fieldArtPitch}>
                <View style={styles.fieldCenterCircle} />
                <View style={styles.fieldPenaltyBox} />
              </View>

              <View style={styles.venueCardContent}>
                <Text style={styles.venuePitchTitle}>{venue.name}</Text>
                <Text style={styles.venuePitchSubtitle}>{venue.subtitle}</Text>

                <Pressable
                  onPress={() => handleOpenSportBooking(venue.sportType)}
                  style={styles.viewCourtsBtn}
                >
                  <Text style={styles.viewCourtsBtnText}>View courts</Text>
                  <Ionicons name="arrow-forward" size={14} color="#4C1D95" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Refresh Button */}
        <Pressable onPress={handleRefresh} style={styles.refreshSportsBtn}>
          <Ionicons name="refresh" size={16} color={isDark ? '#A78BFA' : Colors.primary.main} />
          <Text style={styles.refreshSportsText}>Refresh Sports</Text>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      <ChooseSportModal
        visible={chooseSportVisible}
        onClose={() => {
          setChooseSportVisible(false);
          setSelectedSportForBooking(null);
        }}
        initialSport={selectedSportForBooking}
        token={token}
        tenantId={tenantId}
        onBookingSuccess={(newBooking) => {
          setChooseSportVisible(false);
          setCelebrationBooking(newBooking);
          loadData();
        }}
      />

      <FindPlayersModal
        visible={findPlayersVisible}
        onClose={() => setFindPlayersVisible(false)}
        token={token}
        tenantId={tenantId}
        onJoinSuccess={(joined) => {
          setFindPlayersVisible(false);
          setCelebrationBooking(joined);
          loadData();
        }}
      />

      <BookingSuccessAnimationModal
        visible={Boolean(celebrationBooking)}
        booking={celebrationBooking}
        onProceedToPass={() => {
          const bk = celebrationBooking;
          setCelebrationBooking(null);
          setActivePassBooking(bk);
        }}
      />

      <MyBookingsModal
        visible={myBookingsVisible}
        onClose={() => setMyBookingsVisible(false)}
        bookings={myBookings}
        onSelectBooking={(bk) => {
          setMyBookingsVisible(false);
          setActivePassBooking(bk);
        }}
      />

      <CourtPassModal
        visible={Boolean(activePassBooking)}
        booking={activePassBooking}
        onClose={() => setActivePassBooking(null)}
        onCancelBooking={handleCancelBooking}
      />

      {/* Frosted Bottom Navigation Bar */}
      <HomeBottomTabs activeTab="services" onTabChange={(tab) => openTab(router, tab)} />
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    topNav: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    backBtn: {
      padding: 6,
      marginRight: 12,
    },
    topNavTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    scrollBody: {
      paddingHorizontal: 16,
      paddingBottom: 90,
    },
    campusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      marginBottom: 16,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandText: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#C4B5FD' : Colors.primary.main,
    },
    campusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1E1B4B' : 'rgba(79, 70, 229, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#3730A3' : 'rgba(79, 70, 229, 0.18)',
    },
    campusPillText: {
      color: isDark ? '#E0E7FF' : Colors.primary.main,
      fontSize: 12,
      fontWeight: '700',
    },
    bellBtn: {
      padding: 6,
    },
    titleSection: {
      marginBottom: 16,
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: '900',
      color: Colors.text.primary,
    },
    mainSubtitle: {
      fontSize: 14,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    heroCard: {
      backgroundColor: isDark ? '#2E1065' : '#312E81',
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? '#4C1D95' : '#4338CA',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    fieldArtPitch: {
      position: 'absolute',
      right: -10,
      top: 10,
      bottom: 10,
      width: 170,
      borderWidth: 1.5,
      borderColor: 'rgba(196, 181, 253, 0.2)',
      borderRadius: 12,
    },
    fieldCenterCircle: {
      position: 'absolute',
      left: '25%',
      top: '30%',
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 1.5,
      borderColor: 'rgba(196, 181, 253, 0.2)',
    },
    fieldPenaltyBox: {
      position: 'absolute',
      bottom: 0,
      left: '20%',
      width: 75,
      height: 35,
      borderTopWidth: 1.5,
      borderLeftWidth: 1.5,
      borderRightWidth: 1.5,
      borderColor: 'rgba(196, 181, 253, 0.2)',
    },
    heroCardContent: {
      padding: 22,
      zIndex: 2,
    },
    heroCardTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
      lineHeight: 28,
    },
    heroCardSubtitle: {
      fontSize: 13,
      color: '#DDD6FE',
      marginTop: 8,
      marginBottom: 18,
    },
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#C4B5FD',
      alignSelf: 'flex-start',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
    },
    heroButtonText: {
      color: '#4C1D95',
      fontSize: 14,
      fontWeight: '800',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    sectionLink: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#A78BFA' : Colors.primary.main,
    },
    infoCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    infoCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    infoCardSubtitle: {
      fontSize: 13,
      color: Colors.text.secondary,
      lineHeight: 18,
    },
    activeBookingCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1.5,
      borderColor: isDark ? '#38BDF8' : Colors.primary.main,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    activeBookingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    activeBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    activeBadgePill: {
      backgroundColor: isDark ? '#065F46' : 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    activeBadgeText: {
      color: isDark ? '#34D399' : '#059669',
      fontSize: 10,
      fontWeight: '700',
    },
    activeSportType: {
      color: Colors.text.secondary,
      fontSize: 11,
      fontWeight: '700',
    },
    qrPassPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1E293B' : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    qrPassPillText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 11,
      fontWeight: '700',
    },
    activeCourtTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    activeTimeText: {
      fontSize: 13,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginTop: 4,
    },
    teammateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1B4B' : 'rgba(79, 70, 229, 0.06)',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#312E81' : 'rgba(79, 70, 229, 0.15)',
      marginBottom: 24,
    },
    teammateCardIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#3730A3' : 'rgba(79, 70, 229, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    teammateCardContent: {
      flex: 1,
      marginRight: 8,
    },
    teammateCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    teammateCardSubtitle: {
      fontSize: 12,
      color: isDark ? '#C7D2FE' : Colors.text.secondary,
      marginTop: 2,
    },
    quickSportsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
      paddingVertical: 4,
    },
    quickSportCard: {
      width: 90,
      height: 104,
      borderRadius: 20,
      backgroundColor: isDark ? '#1F2636' : Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#2B364A' : Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    quickSportIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#0D9488',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    quickSportLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.text.primary,
      textAlign: 'center',
    },
    venuesGrid: {
      gap: 14,
      marginBottom: 20,
    },
    venuePitchCard: {
      backgroundColor: isDark ? '#231B4A' : '#1E1B4B',
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: isDark ? '#3D3172' : '#312E81',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    venueCardContent: {
      padding: 22,
      zIndex: 2,
    },
    venuePitchTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    venuePitchSubtitle: {
      fontSize: 13,
      color: '#C4B5FD',
      marginBottom: 18,
    },
    viewCourtsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#C4B5FD',
      alignSelf: 'flex-start',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
    },
    viewCourtsBtnText: {
      color: '#4C1D95',
      fontSize: 13,
      fontWeight: '800',
    },
    venueItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.background.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    venueItemLeft: {
      flex: 1,
    },
    venueBadge: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginBottom: 4,
    },
    venueBadgeText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 10,
      fontWeight: '700',
    },
    venueName: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    venueLocation: {
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    refreshSportsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      marginTop: 6,
      marginBottom: 20,
    },
    refreshSportsText: {
      color: isDark ? '#A78BFA' : Colors.primary.main,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
