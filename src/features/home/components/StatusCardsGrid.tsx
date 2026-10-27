import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { outpassApi } from '@/features/campus/api/outpass-api';
import { CourtPassModal } from '@/features/campus/components/sports/CourtPassModal';
import {
  cancelSportsBookingApi,
  fetchMySportsBookingsApi,
} from '@/features/campus/sports-api';
import { SportsBooking } from '@/features/campus/sports-types';
import { OutpassItem } from '@/features/campus/types/outpass.types';
import { useAppTheme } from '@/theme/app-theme';

interface StatusCardsGridProps {
  refreshTrigger?: boolean;
}

export function StatusCardsGrid({ refreshTrigger }: StatusCardsGridProps) {
  const { colors: Colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const router = useRouter();
  const { user } = useAuthSession();

  const token = user?.token;
  const tenantId = user?.tenantId || 'nmit';

  const [upcomingBooking, setUpcomingBooking] = useState<SportsBooking | null>(null);
  const [activeOutpass, setActiveOutpass] = useState<OutpassItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [passModalBooking, setPassModalBooking] = useState<SportsBooking | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [bookings, outpasses] = await Promise.all([
        fetchMySportsBookingsApi(token, tenantId),
        outpassApi.getMyRequests({ token, tenantId }).catch(() => [] as OutpassItem[]),
      ]);

      // 1. Pick the earliest active upcoming booking
      const todayStr = new Date().toISOString().slice(0, 10);
      const confirmed = bookings.filter((b) => b.status === 'CONFIRMED' && b.bookingDate >= todayStr);
      confirmed.sort((a, b) => {
        if (a.bookingDate !== b.bookingDate) {
          return a.bookingDate.localeCompare(b.bookingDate);
        }
        return a.startTime.localeCompare(b.startTime);
      });
      setUpcomingBooking(confirmed[0] || null);

      // 2. Pick upcoming/active outpass (ACTIVE > APPROVED > PENDING)
      const sortedOutpasses = [...outpasses].filter((o) =>
        ['ACTIVE', 'APPROVED', 'PENDING'].includes(o.status)
      );
      sortedOutpasses.sort((a, b) => {
        const priority: Record<string, number> = { ACTIVE: 1, APPROVED: 2, PENDING: 3 };
        const pA = priority[a.status] || 99;
        const pB = priority[b.status] || 99;
        if (pA !== pB) return pA - pB;
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      });
      setActiveOutpass(sortedOutpasses[0] || null);
    } catch (e) {
      console.warn('StatusCardsGrid loadData error:', e);
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    try {
      await cancelSportsBookingApi(token, tenantId, bookingId);
      setPassModalBooking(null);
      await loadData();
    } catch (e) {
      console.warn('Cancel booking error:', e);
    }
  };

  const getSportIcon = (sportType?: string): keyof typeof Ionicons.glyphMap => {
    switch (sportType) {
      case 'BASKETBALL':
        return 'basketball-outline';
      case 'PICKLEBALL':
        return 'tennisball';
      case 'TABLE_TENNIS':
        return 'disc-outline';
      case 'BADMINTON':
      default:
        return 'tennisball-outline';
    }
  };

  const isToday = upcomingBooking?.bookingDate === new Date().toISOString().slice(0, 10);
  const dateLabel = isToday ? 'Today' : upcomingBooking?.bookingDate;

  const formatPassTime = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const isPassToday = d.toDateString() === new Date().toDateString();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      if (isPassToday) {
        return `Today, ${timeStr}`;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}, ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.gridContainer}>
      {/* 1. Upcoming Sports Booking Card */}
      <Pressable
        onPress={() => {
          if (upcomingBooking) {
            setPassModalBooking(upcomingBooking);
          } else {
            router.push('/sports');
          }
        }}
        style={({ pressed }) => [styles.widgetCard, styles.bookingCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: upcomingBooking
                  ? 'rgba(56, 189, 248, 0.16)'
                  : isDark ? 'rgba(6, 182, 212, 0.14)' : '#EEF2FF',
                borderColor: upcomingBooking
                  ? '#38BDF8'
                  : isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name={getSportIcon(upcomingBooking?.sportType)}
              size={18}
              color={upcomingBooking ? '#38BDF8' : isDark ? '#06B6D4' : '#4338CA'}
            />
          </View>

          {upcomingBooking && (
            <View style={styles.qrBadge}>
              <Ionicons name="qr-code-outline" size={11} color="#38BDF8" />
              <Text style={styles.qrBadgeText}>Pass</Text>
            </View>
          )}
        </View>

        <Text style={styles.widgetTitle}>Upcoming booking</Text>

        {loading && !upcomingBooking ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingText}>Checking court pass...</Text>
          </View>
        ) : upcomingBooking ? (
          <View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusConfirmed}>Active Pass</Text>
            </View>

            <Text style={styles.bookingFacilityName} numberOfLines={1}>
              {upcomingBooking.facilityName || 'Campus Court'}
            </Text>
            <Text style={styles.bookingTimeText}>
              {dateLabel} · {upcomingBooking.startTime.slice(0, 5)} - {upcomingBooking.endTime?.slice(0, 5)}
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isDark ? '#64748B' : '#94A3B8' }]} />
              <Text style={styles.statusMuted}>No upcoming game</Text>
            </View>
            <Text style={styles.widgetSub}>Tap to book court slot.</Text>
          </View>
        )}
      </Pressable>

      {/* 2. Campus Outpass Status Card */}
      <Pressable
        onPress={() => router.push('/outpass')}
        style={({ pressed }) => [styles.widgetCard, styles.passCard, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: activeOutpass?.status === 'ACTIVE'
                  ? 'rgba(16, 185, 129, 0.16)'
                  : activeOutpass?.status === 'APPROVED'
                    ? 'rgba(56, 189, 248, 0.16)'
                    : isDark ? 'rgba(139, 92, 246, 0.14)' : '#EEF2FF',
                borderColor: activeOutpass?.status === 'ACTIVE'
                  ? '#10B981'
                  : activeOutpass?.status === 'APPROVED'
                    ? '#38BDF8'
                    : isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Ionicons
              name={
                activeOutpass?.status === 'ACTIVE'
                  ? 'log-out-outline'
                  : activeOutpass?.status === 'APPROVED'
                    ? 'qr-code-outline'
                    : 'timer-outline'
              }
              size={18}
              color={
                activeOutpass?.status === 'ACTIVE'
                  ? '#10B981'
                  : activeOutpass?.status === 'APPROVED'
                    ? '#38BDF8'
                    : isDark ? '#A78BFA' : '#4338CA'
              }
            />
          </View>

          {activeOutpass?.status === 'ACTIVE' && (
            <View style={[styles.approvedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
              <Ionicons name="radio-button-on" size={11} color="#10B981" />
              <Text style={[styles.approvedBadgeText, { color: '#10B981' }]}>Out</Text>
            </View>
          )}

          {activeOutpass?.status === 'APPROVED' && (
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#38BDF8" />
              <Text style={styles.approvedBadgeText}>Ready</Text>
            </View>
          )}

          {activeOutpass?.status === 'PENDING' && (
            <View style={[styles.approvedBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
              <Ionicons name="hourglass-outline" size={11} color="#F59E0B" />
              <Text style={[styles.approvedBadgeText, { color: '#F59E0B' }]}>Review</Text>
            </View>
          )}
        </View>

        <Text style={styles.widgetTitle}>
          {activeOutpass?.passType === 'LEAVE' ? 'Hostel Leave' : 'Hostel Outpass'}
        </Text>

        {activeOutpass ? (
          <View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      activeOutpass.status === 'ACTIVE'
                        ? '#10B981'
                        : activeOutpass.status === 'APPROVED'
                          ? '#38BDF8'
                          : '#F59E0B',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusConfirmed,
                  activeOutpass.status === 'ACTIVE' && { color: '#10B981' },
                  activeOutpass.status === 'APPROVED' && { color: '#38BDF8' },
                  activeOutpass.status === 'PENDING' && { color: '#F59E0B' },
                ]}
              >
                {activeOutpass.status === 'ACTIVE'
                  ? 'Checked Out'
                  : activeOutpass.status === 'APPROVED'
                    ? 'Gate Pass Ready'
                    : 'Pending Warden'}
              </Text>
            </View>
            <Text style={styles.bookingFacilityName} numberOfLines={1}>
              {activeOutpass.destination || 'Campus Exit'}
            </Text>
            <Text style={styles.bookingTimeText} numberOfLines={1}>
              Return by {formatPassTime(activeOutpass.returnTime)}
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isDark ? '#64748B' : '#94A3B8' }]} />
              <Text style={styles.statusMuted}>No active request</Text>
            </View>
            <Text style={styles.widgetSub}>Apply for outpass leave.</Text>
          </View>
        )}
      </Pressable>

      {/* Court QR Pass Modal direct access from Home screen */}
      <CourtPassModal
        visible={Boolean(passModalBooking)}
        booking={passModalBooking}
        onClose={() => setPassModalBooking(null)}
        onCancelBooking={handleCancelBooking}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    widgetCard: {
      flex: 1,
      backgroundColor: isDark ? '#101626' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      padding: 13,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    bookingCard: {
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    passCard: {
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    qrBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#38BDF8',
    },
    approvedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    approvedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#10B981',
    },
    widgetTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusConfirmed: {
      fontFamily: Typography.semiBold,
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    statusMuted: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    bookingFacilityName: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 1,
    },
    bookingTimeText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginTop: 2,
    },
    widgetSub: {
      fontFamily: Typography.regular,
      fontSize: 11,
      lineHeight: 15,
      color: Colors.text.secondary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    loadingText: {
      fontSize: 11,
      color: Colors.text.secondary,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
