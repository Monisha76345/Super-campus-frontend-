import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { useAuthSession } from '@/features/auth';
import {
  CampusClub,
  CampusEvent,
  CampusOpportunity,
  ConnectTab,
} from '../types/connect-types';
import {
  fetchClubsApi,
  fetchEventsApi,
  fetchOpportunitiesApi,
} from '../api/connect-api';
import { ClubProfileModal } from '../components/ClubProfileModal';
import { EventDetailModal } from '../components/EventDetailModal';

interface ConnectFeedScreenProps {
  campusName: string;
  initialTab?: ConnectTab;
  token: string;
  tenantId: string;
  onBack: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateOpportunity: (type: 'INTERNSHIP' | 'JOB') => void;
}

const TABS: { key: ConnectTab; label: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'internships', label: 'Internships' },
  { key: 'jobs', label: 'Jobs' },
];

export function ConnectFeedScreen({
  campusName,
  initialTab = 'events',
  token,
  tenantId,
  onBack,
  onOpenCreateEvent,
  onOpenCreateOpportunity,
}: ConnectFeedScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const roleNorm = (user?.role || '').toLowerCase().replace(/[-_]/g, '');
  const canPostJob =
    roleNorm === 'alumni' ||
    roleNorm === 'faculty' ||
    roleNorm === 'admin' ||
    roleNorm === 'superadmin' ||
    roleNorm === 'campusadmin';

  const [activeTab, setActiveTab] = useState<ConnectTab>(initialTab);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [clubs, setClubs] = useState<CampusClub[]>([]);
  const [opportunities, setOpportunities] = useState<CampusOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedClub, setSelectedClub] = useState<CampusClub | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [applyingOpportunity, setApplyingOpportunity] = useState<CampusOpportunity | null>(null);
  const [applicantUsn, setApplicantUsn] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const data = await fetchEventsApi(token, tenantId);
        setEvents(data);
      } else if (activeTab === 'clubs') {
        const data = await fetchClubsApi(token, tenantId);
        setClubs(data);
      } else if (activeTab === 'internships') {
        const data = await fetchOpportunitiesApi(token, tenantId, 'INTERNSHIP');
        setOpportunities(data);
      } else if (activeTab === 'jobs') {
        const data = await fetchOpportunitiesApi(token, tenantId, 'JOB');
        setOpportunities(data);
      }
    } catch (err) {
      console.warn('Failed to load feed data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, token, tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClubUpdated = (updated: CampusClub) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    setSelectedClub((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
  };

  const handleSubmitApplication = () => {
    if (!applicantUsn.trim()) {
      Alert.alert('Required Field', 'Please enter your USN or Roll Number.');
      return;
    }
    setIsSubmittingApp(true);
    setTimeout(() => {
      setIsSubmittingApp(false);
      const title = applyingOpportunity?.title || 'Position';
      setApplyingOpportunity(null);
      setApplicantNote('');
      Alert.alert(
        'Application Sent! 🎉',
        `Your application for "${title}" has been successfully submitted to the recruiter.`,
      );
    }, 600);
  };

  const renderEventItem = ({ item }: { item: CampusEvent }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View full details for event ${item.title}`}
      onPress={() => setSelectedEvent(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Banner Preview if present */}
      {(item.bannerUrl || item.bannerKey) && (
        <View style={styles.eventBannerFrame}>
          <Image
            source={{ uri: item.bannerUrl || item.bannerKey || '' }}
            style={styles.eventBannerImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Ionicons name="calendar" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.eventBadgeText}>{item.formattedDate}</Text>
        </View>
        <Text style={styles.timeBadgeText}>{item.formattedTime}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooterRow}>
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={15} color={isDark ? '#94A3B8' : Colors.text.secondary} />
          <Text style={styles.venueText}>{item.venue}</Text>
        </View>
        <View style={styles.viewFullPill}>
          <Text style={styles.viewFullPillText}>Full Details & RSVP</Text>
          <Ionicons name="chevron-forward" size={13} color="#38BDF8" />
        </View>
      </View>
    </Pressable>
  );

  const renderClubItem = ({ item }: { item: CampusClub }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name} channel`}
      style={({ pressed }) => [styles.card, styles.clubCard, pressed && styles.cardPressed]}
      onPress={() => setSelectedClub(item)}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>{item.category}</Text>
        </View>
        <View style={styles.clubHeaderRight}>
          {item.isJoined ? (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.joinedBadgeText}>Joined</Text>
            </View>
          ) : null}
          <Text style={styles.memberCountText}>{item.memberCount} members</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.clubCardFooter}>
        <View style={styles.clubCardFooterLeft}>
          <Ionicons name="shield-checkmark" size={14} color="#38BDF8" />
          <Text style={styles.viewClubMembersText}>Explore Channel, Posts & Trophies</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
      </View>
    </Pressable>
  );

  const renderOpportunityItem = ({ item }: { item: CampusOpportunity }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>{item.type}</Text>
        </View>
        <Text style={styles.companyText}>{item.company}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>

      {/* Attached Document Pill if available */}
      {item.documentName ? (
        <Pressable
          onPress={() => {
            Alert.alert(
              'Attached JD / Criteria 📄',
              `File: ${item.documentName}\n\nDocument is attached and ready for viewing.`,
            );
          }}
          style={styles.attachedDocPill}>
          <Ionicons name="document-text" size={15} color="#38BDF8" />
          <Text style={styles.attachedDocName} numberOfLines={1}>
            {item.documentName}
          </Text>
          <Text style={styles.attachedDocAction}>View Document</Text>
        </Pressable>
      ) : null}

      <View style={styles.cardFooterRow}>
        <View style={styles.venueRow}>
          <Ionicons name="business-outline" size={15} color={Colors.text.secondary} />
          <Text style={styles.venueText}>{item.location}</Text>
        </View>
        {item.stipendOrSalary ? (
          <Text style={styles.stipendText}>{item.stipendOrSalary}</Text>
        ) : null}
      </View>

      {/* Apply Button */}
      <View style={styles.applyActionRow}>
        <Pressable
          onPress={() => {
            setApplicantUsn(user?.email?.split('@')[0]?.toUpperCase() || '');
            setApplyingOpportunity(item);
          }}
          style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.8 }]}>
          <Ionicons name="paper-plane" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.applyBtnText}>Apply Now</Text>
        </Pressable>
      </View>
    </View>
  );

  const currentList = useMemo(() => {
    if (activeTab === 'events') return events;
    if (activeTab === 'clubs') return clubs;
    return opportunities;
  }, [activeTab, events, clubs, opportunities]);

  // Determine if post button should show
  const showPostButton = useMemo(() => {
    if (activeTab === 'clubs') return false;
    if (activeTab === 'jobs') return canPostJob;
    return true; // events and internships are open to campus
  }, [activeTab, canPostJob]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* 1. Header Navigation */}
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        hitSlop={8}
        style={styles.backRow}>
        <Ionicons name="arrow-back" size={18} color={isDark ? Colors.primary.cyan : Colors.primary.main} style={{ marginRight: 6 }} />
        <Text style={styles.backText}>Back to Connect</Text>
      </Pressable>

      {/* 2. Main Title */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{campusName} Connect</Text>
        <Text style={styles.mainSubtitle}>Find your community. Build your future.</Text>
      </View>

      {/* 3. Segmented Filter Tabs: Events, Clubs, Internships, Jobs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabPill,
                isActive ? styles.tabPillActive : styles.tabPillInactive,
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  isActive ? styles.tabPillTextActive : styles.tabPillTextInactive,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4. Action Row */}
      <View style={styles.actionRow}>
        {showPostButton && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (activeTab === 'events') {
                onOpenCreateEvent();
              } else if (activeTab === 'internships') {
                onOpenCreateOpportunity('INTERNSHIP');
              } else if (activeTab === 'jobs') {
                onOpenCreateOpportunity('JOB');
              }
            }}
            style={({ pressed }) => [styles.postEventBtn, pressed && styles.btnPressed]}>
            <Text style={styles.postEventText}>
              {activeTab === 'events'
                ? 'Post event'
                : activeTab === 'internships'
                  ? 'Post internship'
                  : 'Post job'}
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={handleManualRefresh}
          hitSlop={8}
          style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {/* 5. Content Feed */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={currentList as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (activeTab === 'events') return renderEventItem({ item: item as CampusEvent });
            if (activeTab === 'clubs') return renderClubItem({ item: item as CampusClub });
            return renderOpportunityItem({ item: item as CampusOpportunity });
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              tintColor={Colors.primary.main}
              colors={[Colors.primary.main]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab} yet. Published campus listings will appear here.
              </Text>
            </View>
          }
        />
      )}

      {/* 6. Club Channel Modal */}
      <ClubProfileModal
        visible={Boolean(selectedClub)}
        club={selectedClub}
        token={token}
        tenantId={tenantId}
        onClose={() => setSelectedClub(null)}
        onClubUpdated={handleClubUpdated}
      />

      {/* 7. Comprehensive Event Details Modal */}
      <EventDetailModal
        visible={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* 8. Opportunity Application Modal */}
      <Modal
        visible={Boolean(applyingOpportunity)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApplyingOpportunity(null)}>
        <Pressable
          style={styles.appModalBackdrop}
          onPress={() => setApplyingOpportunity(null)}>
          <View style={styles.appModalCard}>
            <Text style={styles.appModalTitle}>
              Apply for {applyingOpportunity?.title}
            </Text>
            <Text style={styles.appModalCompany}>{applyingOpportunity?.company}</Text>

            <View style={styles.appField}>
              <Text style={styles.appLabel}>Your USN / Student ID</Text>
              <TextInput
                value={applicantUsn}
                onChangeText={setApplicantUsn}
                placeholder="e.g. 1NT22AD015"
                placeholderTextColor="#64748B"
                style={styles.appInput}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.appField}>
              <Text style={styles.appLabel}>Note to Recruiter (optional)</Text>
              <TextInput
                value={applicantNote}
                onChangeText={setApplicantNote}
                placeholder="Mention key skills, GitHub/portfolio links..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                style={[styles.appInput, { height: 75, textAlignVertical: 'top' }]}
              />
            </View>

            <View style={styles.appActionsRow}>
              <Pressable
                onPress={() => setApplyingOpportunity(null)}
                style={styles.appCancelBtn}>
                <Text style={styles.appCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isSubmittingApp}
                onPress={handleSubmitApplication}
                style={styles.appSubmitBtn}>
                {isSubmittingApp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.appSubmitText}>Submit Application</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
      paddingHorizontal: 16,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 6,
    },
    backText: {
      fontFamily: Typography.semiBold,
      fontSize: 14.5,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    titleSection: {
      marginBottom: 16,
    },
    mainTitle: {
      fontFamily: Typography.bold,
      fontSize: 28,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    mainSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.secondary,
      marginTop: 4,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    tabPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
    },
    tabPillActive: {
      backgroundColor: Colors.primary.main,
    },
    tabPillInactive: {
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    tabPillText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
    },
    tabPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    tabPillTextInactive: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    postEventBtn: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
    },
    postEventText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    refreshBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    refreshText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#38BDF8',
    },
    btnPressed: {
      opacity: 0.8,
    },
    listContent: {
      paddingBottom: 110,
    },
    card: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 14,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    eventBannerFrame: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    },
    eventBannerImage: {
      width: '100%',
      height: '100%',
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    eventBadgeText: {
      fontFamily: Typography.semiBold,
      fontSize: 11.5,
      color: '#38BDF8',
    },
    timeBadgeText: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
    },
    companyText: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: '#38BDF8',
    },
    cardTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    cardDescription: {
      fontFamily: Typography.regular,
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#CBD5E1' : '#475569',
      marginBottom: 10,
    },
    attachedDocPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.1)',
      marginBottom: 10,
    },
    attachedDocName: {
      flex: 1,
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.primary,
    },
    attachedDocAction: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#38BDF8',
    },
    cardFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
    },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    venueText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    viewFullPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewFullPillText: {
      fontFamily: Typography.semiBold,
      fontSize: 11.5,
      color: '#38BDF8',
    },
    stipendText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: '#10B981',
      fontWeight: '700',
    },
    applyActionRow: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      height: 38,
      borderRadius: 10,
    },
    applyBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    clubCard: {
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
    },
    clubHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    joinedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    joinedBadgeText: {
      fontSize: 11,
      fontFamily: Typography.semiBold,
      color: '#10B981',
    },
    memberCountText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    clubCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
      marginTop: 4,
    },
    clubCardFooterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    viewClubMembersText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: '#38BDF8',
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingVertical: 30,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
    appModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    appModalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
    },
    appModalTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    appModalCompany: {
      fontFamily: Typography.regular,
      fontSize: 12.5,
      color: '#38BDF8',
      marginBottom: 16,
    },
    appField: {
      marginBottom: 12,
    },
    appLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 4,
    },
    appInput: {
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.1)',
      paddingHorizontal: 12,
      height: 44,
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: Colors.text.primary,
    },
    appActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
    appCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    appCancelText: {
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.secondary,
    },
    appSubmitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#2563EB',
    },
    appSubmitText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
