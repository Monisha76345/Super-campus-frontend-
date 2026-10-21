import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import {
  fetchIncomingRequestsApi,
  respondConnectionRequestApi,
} from '@/features/connect/api/connect-api';
import { IncomingConnectionRequest } from '@/features/connect/types/connect-types';

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

import { CsvDirectoryImportModal } from './components/admin/CsvDirectoryImportModal';

export function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [showCsvModal, setShowCsvModal] = useState(false);
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'campus_admin' || role === 'superadmin';

  return (
    <CampusScreen title="Campus Services" subtitle="Your campus, in one place." activeTab="services">
      {isAdmin && (
        <CampusCard
          icon="shield-checkmark"
          title="Student Directory CSV Importer"
          detail="Batch onboard students, faculty & hostelites to campus DB"
          accent="#38BDF8"
          meta="Admin"
          onPress={() => setShowCsvModal(true)}
        />
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

export function FoodScreen() {
  return (
    <CampusScreen title="Campus dining" subtitle="Same Campus. Healthier You." activeTab="services">
      <Banner kicker="FOOD FOR YOU" title="Campus dining" body="Open cafes and the food court on NMIT." />
      <CampusCard icon="pizza" title="Student Bistro" detail="Fast food and snacks · 10m wait" meta="Open" accent="#F59E0B" />
      <CampusCard icon="cafe" title="Tech Cafe Express" detail="Coffee and bakery · 5m wait" meta="Open" accent="#38BDF8" />
      <CampusCard icon="restaurant" title="NMIT Food Court" detail="Meals through the evening" meta="Open" accent="#F59E0B" />
    </CampusScreen>
  );
}

export function NotificationsScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuthSession();
  const token = user?.token || '';
  const tenantId = user?.tenantId || 'nmit';

  const [requests, setRequests] = useState<IncomingConnectionRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchIncomingRequestsApi(token, tenantId);
      setRequests(data);
    } catch {
      // silent
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRespond = async (connectionId: string, action: 'ACCEPT' | 'DECLINE') => {
    if (respondingId) return;
    setRespondingId(connectionId);
    try {
      await respondConnectionRequestApi(token, tenantId, connectionId, action);
      await loadRequests();
    } catch (err) {
      console.warn('Failed to respond to request:', err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <CampusScreen title="Notifications" subtitle="Campus alerts and connection requests." activeTab="profile">
      <Note>Stay updated with real-time campus events, class schedules, and peer connection requests.</Note>

      {/* Dynamic Incoming Connection Requests */}
      {requests.length > 0 && (
        <View style={styles.notifRequestsBox}>
          <View style={styles.notifHeaderRow}>
            <View style={styles.notifHeaderBadge}>
              <Ionicons name="people" size={16} color="#38BDF8" />
              <Text style={styles.notifHeaderTitle}>Connection Requests</Text>
            </View>
            <Text style={styles.notifCountBadge}>{requests.length} new</Text>
          </View>

          {requests.map((req) => (
            <View key={req.connectionId} style={styles.notifReqCard}>
              <View style={styles.notifReqTop}>
                <View style={styles.notifAvatar}>
                  <Text style={styles.notifAvatarText}>{req.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifReqName}>{req.fullName}</Text>
                  <Text style={styles.notifReqDetail}>
                    {[req.role, req.department, req.batch].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.notifReqHandle}>{req.handle}</Text>
                </View>
              </View>

              <View style={styles.notifBtnRow}>
                <Pressable
                  onPress={() => handleRespond(req.connectionId, 'ACCEPT')}
                  disabled={respondingId === req.connectionId}
                  style={({ pressed }) => [
                    styles.notifAcceptBtn,
                    respondingId === req.connectionId && { opacity: 0.8 },
                    pressed && styles.btnPressed,
                  ]}>
                  {respondingId === req.connectionId ? (
                    <ActivityIndicator size="small" color="#080B11" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={15} color="#080B11" />
                      <Text style={styles.notifAcceptText}>Accept</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleRespond(req.connectionId, 'DECLINE')}
                  disabled={respondingId === req.connectionId}
                  style={({ pressed }) => [
                    styles.notifDeclineBtn,
                    respondingId === req.connectionId && { opacity: 0.8 },
                    pressed && styles.btnPressed,
                  ]}>
                  <Ionicons name="close" size={15} color={Colors.text.secondary} />
                  <Text style={styles.notifDeclineText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <CampusCard icon="time" title="Next lecture in 35m" detail="Cloud Architecture & DevOps · Lecture Hall 302" meta="Now" />
      <CampusCard icon="exit" title="Outpass is active" detail="Main Campus Gate · Valid till 10:30 PM" meta="Gate" accent="#34D399" />
      <CampusCard icon="basketball" title="Upcoming booking" detail="Basketball · Main campus court" meta="Sports" accent="#A78BFA" />
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
});
}
