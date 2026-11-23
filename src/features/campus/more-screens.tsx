import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import {
  AppNotificationItem,
  notificationApi,
} from '@/features/notifications/api/notification-api';
import {
  categoryAccent,
  categoryIcon,
  formatRelativeTime,
  routeFromNotificationData,
} from '@/features/notifications/utils/notification-routing';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Note } from './parts';
import { openService } from './navigation';

const SERVICES = [
  { id: 'food', title: 'Campus dining', detail: 'Same campus. Healthier you.', icon: 'fast-food' as const, accent: '#F59E0B' },
  { id: 'outpass', title: 'Hostel outpass', detail: 'Request a gate pass', icon: 'qr-code' as const, accent: '#38BDF8' },
  { id: 'sports', title: 'Sports', detail: 'Book. Play. Connect.', icon: 'basketball' as const, accent: '#A78BFA' },
  { id: 'marketplace', title: 'Marketplace', detail: 'Buy and sell on campus', icon: 'bag-handle' as const, accent: '#34D399' },
  { id: 'projects', title: 'Projects', detail: 'Collaborate with a team', icon: 'rocket' as const, accent: '#818CF8' },
  { id: 'connect', title: 'Connect', detail: 'Your campus community', icon: 'people' as const, accent: '#C084FC' },
  { id: 'messages', title: 'Messages', detail: 'Write a message', icon: 'chatbubbles' as const, accent: '#60A5FA' },
  { id: 'notifications', title: 'Notifications', detail: 'Campus alerts', icon: 'notifications' as const, accent: '#F59E0B' },
];

import { AlumniApprovalModal } from './components/admin/AlumniApprovalModal';
import { CsvDirectoryImportModal } from './components/admin/CsvDirectoryImportModal';

export function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'campus_admin' || role === 'superadmin';

  return (
    <CampusScreen title="Campus Services" subtitle="Your campus, in one place." activeTab="services">
      {isAdmin && (
        <>
          <CampusCard
            icon="school"
            title="Alumni Approvals"
            detail="Review and approve pending alumni USN and mobile registrations"
            accent="#10B981"
            meta="Admin"
            onPress={() => setShowAlumniModal(true)}
          />
          <CampusCard
            icon="shield-checkmark"
            title="Student Directory CSV Importer"
            detail="Batch onboard students, faculty & hostelites to campus DB"
            accent="#38BDF8"
            meta="Admin"
            onPress={() => setShowCsvModal(true)}
          />
        </>
      )}
      {SERVICES.map((item) => (
        <CampusCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          detail={item.detail}
          accent={item.accent}
          meta="Open"
          onPress={() => openService(router, item.id)}
        />
      ))}
      <CsvDirectoryImportModal
        visible={showCsvModal}
        onClose={() => setShowCsvModal(false)}
      />
      <AlumniApprovalModal
        visible={showAlumniModal}
        onClose={() => setShowAlumniModal(false)}
      />
    </CampusScreen>
  );
}

export function BuzzScreen() {
  return (
    <CampusScreen title="Campus updates" subtitle="Trending on SuperCampus." activeTab="community">
      <Banner
        kicker="FEED"
        title="Around campus"
        body="Open studio tonight at the innovation lab. Bring a sketchbook."
      />
      <CampusCard icon="school" title="Cloud Architecture & DevOps" detail="Lecture Hall 302 · Academic Block B · 10:30 AM" meta="Today" accent="#38BDF8" />
      <CampusCard icon="people" title="From your community" detail="14 campus comments on the latest project showcase." meta="14" accent="#C084FC" />
      <CampusCard icon="megaphone" title="Campus events" detail="Explore and join campus clubs." meta="New" />
    </CampusScreen>
  );
}

export { FoodScreen } from './food-screen';

export function NotificationsScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const { user } = useAuthSession();
  const token = user?.token || '';
  const tenantId = user?.tenantId || 'nmit';

  const [items, setItems] = useState<AppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setItems([]);
      return;
    }
    try {
      const data = await notificationApi.list({ token, tenantId }, 50, 0);
      setItems(data || []);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleOpen = async (item: AppNotificationItem) => {
    if (!item.isRead && token) {
      try {
        await notificationApi.markRead({ token, tenantId }, item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      } catch {
        // still navigate
      }
    }
    routeFromNotificationData(router, item.data);
  };

  const handleMarkAll = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead({ token, tenantId });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <CampusScreen title="Notifications" subtitle="Campus alerts across every module." activeTab="profile">
      <Note>Messages, outpass, sports, projects, marketplace, and connection updates land here.</Note>

      {!loading && items.length > 0 && (
        <View style={styles.notifHeaderRow}>
          <Text style={styles.notifCountBadge}>{unread} unread</Text>
          <Pressable
            onPress={handleMarkAll}
            disabled={markingAll || unread === 0}
            style={({ pressed }) => [
              styles.notifDeclineBtn,
              (markingAll || unread === 0) && { opacity: 0.5 },
              pressed && styles.btnPressed,
            ]}>
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.text.secondary} />
            ) : (
              <Text style={styles.notifDeclineText}>Mark all read</Text>
            )}
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#38BDF8" />
        </View>
      )}

      {!loading && items.length === 0 && (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="notifications-outline" size={26} color="#38BDF8" />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            New campus alerts will show up here as soon as something needs your attention.
          </Text>
        </View>
      )}

      {!loading &&
        items.map((item) => {
          const accent = categoryAccent(item.category);
          return (
            <Pressable
              key={item.id}
              onPress={() => void handleOpen(item)}
              style={({ pressed }) => [
                styles.notifReqCard,
                !item.isRead && { borderColor: accent + '66' },
                pressed && styles.btnPressed,
              ]}>
              <View style={styles.notifReqTop}>
                <View style={[styles.notifAvatar, { backgroundColor: accent + '22' }]}>
                  <Ionicons name={categoryIcon(item.category) as any} size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifReqName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.notifReqDetail} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.notifReqHandle}>
                    {item.category} · {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
    </CampusScreen>
  );
}

export function ScanScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <CampusScreen title="Scan" subtitle="Scan a Sports entry pass or the campus gate." activeTab="home">
      <View style={styles.finder}>
        <Text style={styles.finderMark}>QR</Text>
        <Text style={styles.finderText}>Point the camera at a campus QR code</Text>
      </View>
    </CampusScreen>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  finder: {
    height: 280,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.surface,
    gap: 16,
    padding: 24,
  },
  finderMark: {
    fontFamily: Typography.bold,
    color: Colors.primary.cyan,
    fontSize: 42,
    letterSpacing: 4,
  },
  finderText: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
  // Notifications Requests
  notifRequestsBox: {
    marginBottom: 16,
    gap: 10,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  notifHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifHeaderTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  notifCountBadge: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notifReqCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  notifReqTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAvatarText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: '#38BDF8',
  },
  notifReqName: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  notifReqDetail: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  notifReqHandle: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: '#818CF8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginLeft: 8,
  },
  notifBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  notifAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 18,
    paddingVertical: 9,
  },
  notifAcceptText: {
    fontFamily: Typography.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#080B11',
  },
  notifDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notifDeclineText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emptyCard: {
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
}
