import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { profilePhotoUri } from '@/features/profile/api/profile-api';
import { useAuthSession } from '@/features/auth';
import {
  CampusClub,
  ConnectMember,
  ConnectTab,
  DirectoryRole,
  IncomingConnectionRequest,
} from '../types/connect-types';
import {
  fetchClubsApi,
  fetchMembersApi,
  fetchIncomingRequestsApi,
  fetchMyConnectionsApi,
  respondConnectionRequestApi,
} from '../api/connect-api';
import { ClubProfileModal } from '../components/ClubProfileModal';

interface ConnectHomeScreenProps {
  campusName: string;
  token: string;
  tenantId: string;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  onSelectCategory: (tab: ConnectTab) => void;
  onOpenClubsFeed: () => void;
  onOpenEventsFeed: () => void;
  onViewMemberProfile: (member: ConnectMember) => void;
}

const ROLES: DirectoryRole[] = ['Alumni', 'Students', 'Faculty', 'Connections'];
const BATCHES = ['All batches', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '1996'];

export function ConnectHomeScreen({
  campusName,
  token,
  tenantId,
  onRefresh,
  onOpenNotifications,
  onSelectCategory,
  onOpenClubsFeed,
  onOpenEventsFeed,
  onViewMemberProfile,
}: ConnectHomeScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(150, Math.floor((windowWidth - 32 - 12) / 2));

  const [selectedRole, setSelectedRole] = useState<DirectoryRole>('Alumni');
  const [selectedBatch, setSelectedBatch] = useState('All batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<ConnectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [incomingRequests, setIncomingRequests] = useState<IncomingConnectionRequest[]>([]);
  const [myConnections, setMyConnections] = useState<ConnectMember[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const { user } = useAuthSession();
  const currentUserId = user?.id || '';

  const loadMembers = useCallback(async () => {
    if (!token) return;
    setMembersLoading(true);
    try {
      if (selectedRole === 'Connections') {
        const [reqs, conns] = await Promise.all([
          fetchIncomingRequestsApi(token, tenantId).catch(() => []),
          fetchMyConnectionsApi(token, tenantId).catch(() => []),
        ]);
        setIncomingRequests(reqs);
        setMyConnections(
          currentUserId ? conns.filter((c) => c.userId !== currentUserId) : conns,
        );
      } else {
        const data = await fetchMembersApi(token, tenantId, {
          role: selectedRole,
          batch: selectedBatch === 'All batches' ? undefined : selectedBatch,
          query: searchQuery.trim() || undefined,
        });
        const filtered = currentUserId
          ? data.filter((m) => m.userId !== currentUserId)
          : data;
        setMembers(filtered);
      }
    } catch (err) {
      console.warn('Failed to fetch members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [token, tenantId, selectedRole, selectedBatch, searchQuery, currentUserId]);

  const loadIncomingAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const reqs = await fetchIncomingRequestsApi(token, tenantId);
      setIncomingRequests(reqs);
    } catch {
      // silent
    }
  }, [token, tenantId]);

  const [activeClubs, setActiveClubs] = useState<CampusClub[]>([]);
  const [selectedClub, setSelectedClub] = useState<CampusClub | null>(null);

  const loadActiveClubs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchClubsApi(token, tenantId);
      setActiveClubs(data);
    } catch {
      // silent
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadMembers();
    loadIncomingAlerts();
    loadActiveClubs();
  }, [loadMembers, loadIncomingAlerts, loadActiveClubs]);

  const handleRespond = async (connectionId: string, action: 'ACCEPT' | 'DECLINE') => {
    if (respondingId) return;
    setRespondingId(connectionId);
    try {
      await respondConnectionRequestApi(token, tenantId, connectionId, action);
      await loadMembers();
      await loadIncomingAlerts();
    } catch (err) {
      console.warn('Failed to respond:', err);
    } finally {
      setRespondingId(null);
    }
  };

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return myConnections;
    const q = searchQuery.toLowerCase();
    return myConnections.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.handle && m.handle.toLowerCase().includes(q)),
    );
  }, [myConnections, searchQuery]);

  const searchPlaceholder = useMemo(() => {
    if (selectedRole === 'Alumni') return 'Search alumni by name';
    if (selectedRole === 'Faculty') return 'Search faculty by name';
    if (selectedRole === 'Connections') return 'Search connections';
    return 'Search students by name';
  }, [selectedRole]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* 1. Top Bar matching Image 1: SuperCampus logo, campus pill, bell */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="school" size={26} color={Colors.primary.cyan} />
          <Text style={styles.brandText}>SuperCampus</Text>
        </View>

        <View style={styles.topRightRow}>
          <View style={styles.campusPill}>
            <Ionicons
              name="location-sharp"
              size={13}
              color={isDark ? Colors.primary.cyan : Colors.primary.main}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.campusPillText}>{campusName} campus</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={onOpenNotifications}
            hitSlop={8}
            style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
            {incomingRequests.length > 0 && <View style={styles.bellBadgeDot} />}
          </Pressable>
        </View>
      </View>

      {/* 2. Title Section: "Connect / People. Community. Possibilities." + Refresh */}
      <View style={styles.titleSection}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mainTitle}>Connect</Text>
          <Text style={styles.mainSubtitle}>People. Community. Possibilities.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh"
          onPress={() => {
            onRefresh();
            loadMembers();
          }}
          hitSlop={8}
          style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={Colors.text.primary} />
        </Pressable>
      </View>

      {/* 3. Hero Card matching Image 1: "YOUR CAMPUS COMMUNITY / Connect. Collaborate. Grow." */}
      <View style={styles.heroCard}>
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Ionicons name="school" size={130} color="rgba(255, 255, 255, 0.12)" />
        </View>

        <Text style={styles.heroKicker}>YOUR CAMPUS COMMUNITY</Text>
        <Text style={styles.heroHeadline}>Connect. Collaborate. Grow.</Text>
        <Text style={styles.heroBody}>
          Meet the people who make your campus.{'\n'}Campus imagery coming soon
        </Text>
      </View>

      {/* 4. Four Action Tiles matching Image 1: Events, Clubs, Internships, Jobs */}
      <View style={styles.tilesRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectCategory('events')}
          style={({ pressed }) => [styles.tileCard, pressed && styles.cardPressed]}>
          <View style={styles.tileIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={Colors.primary.cyan} />
          </View>
          <Text style={styles.tileTitle}>Events</Text>
          <Text style={styles.tileSub}>Upcoming</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectCategory('clubs')}
          style={({ pressed }) => [styles.tileCard, pressed && styles.cardPressed]}>
          <View style={styles.tileIconWrap}>
            <Ionicons name="people-outline" size={22} color={Colors.primary.cyan} />
          </View>
          <Text style={styles.tileTitle}>Clubs</Text>
          <Text style={styles.tileSub}>Community</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectCategory('internships')}
          style={({ pressed }) => [styles.tileCard, pressed && styles.cardPressed]}>
          <View style={styles.tileIconWrap}>
            <Ionicons name="briefcase-outline" size={22} color={Colors.primary.cyan} />
          </View>
          <Text style={styles.tileTitle}>Internships</Text>
          <Text style={styles.tileSub}>Explore</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectCategory('jobs')}
          style={({ pressed }) => [styles.tileCard, pressed && styles.cardPressed]}>
          <View style={styles.tileIconWrap}>
            <Ionicons name="bag-outline" size={22} color={Colors.primary.cyan} />
          </View>
          <Text style={styles.tileTitle}>Jobs</Text>
          <Text style={styles.tileSub}>Careers</Text>
        </Pressable>
      </View>

      {/* 5. Section "Upcoming events" with banner teaser matching Image 1 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming events</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenEventsFeed}
        style={({ pressed }) => [styles.teaserCard, pressed && styles.cardPressed]}>
        <View style={[styles.teaserIconWrap, styles.eventsTeaserIconWrap]}>
          <Ionicons name="calendar-outline" size={24} color={Colors.status.success} />
        </View>
        <View style={styles.teaserInfo}>
          <Text style={styles.teaserTitle}>Campus events</Text>
          <Text style={styles.teaserSubtitle}>Explore upcoming events or publish your own.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} style={{ marginLeft: 6 }} />
      </Pressable>

      {/* 6. Section "Active clubs" with banner teaser matching Image 1 & navigating to Clubs page */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active clubs</Text>
        <Pressable onPress={onOpenClubsFeed} hitSlop={8}>
          <Text style={styles.sectionSeeAll}>See all ({activeClubs.length || '6'})</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenClubsFeed}
        style={({ pressed }) => [styles.teaserCard, pressed && styles.cardPressed]}>
        <View style={[styles.teaserIconWrap, styles.clubsTeaserIconWrap]}>
          <Ionicons name="people" size={24} color={Colors.primary.cyan} />
        </View>
        <View style={styles.teaserInfo}>
          <Text style={styles.teaserTitle}>Find your community</Text>
          <Text style={styles.teaserSubtitle}>Explore and join campus clubs.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} style={{ marginLeft: 6 }} />
      </Pressable>

      {/* Horizontal Active Clubs Preview Cards */}
      {activeClubs.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalClubsScroll}
        >
          {activeClubs.slice(0, 6).map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${c.name} club details`}
              style={({ pressed }) => [styles.miniClubCard, pressed && styles.cardPressed]}
              onPress={() => setSelectedClub(c)}
            >
              <View style={styles.miniClubTop}>
                <View style={styles.miniClubIcon}>
                  <Ionicons name="people" size={16} color={isDark ? '#38BDF8' : Colors.primary.main} />
                </View>
                <View style={styles.miniCategoryBadge}>
                  <Text style={styles.miniCategoryText} numberOfLines={1}>
                    {c.category}
                  </Text>
                </View>
              </View>
              <Text style={styles.miniClubName} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.miniClubDesc} numberOfLines={2}>
                {c.description}
              </Text>
              <View style={styles.miniClubFooter}>
                <Text style={styles.miniClubMembers}>
                  {c.memberCount} members
                </Text>
                <Text style={styles.miniClubAction}>View Profile →</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* 7. Directory Section embedded directly below the Community Card matching Image 2 & 3 */}
      <View style={styles.directoryContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.secondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.secondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Role Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {ROLES.map((role) => {
            const isActive = selectedRole === role;
            const badgeCount = role === 'Connections' ? incomingRequests.length : 0;
            return (
              <Pressable
                key={role}
                onPress={() => setSelectedRole(role)}
                style={[
                  styles.roleChip,
                  isActive ? styles.roleChipActive : styles.roleChipInactive,
                ]}>
                <Ionicons
                  name={
                    role === 'Alumni'
                      ? 'school'
                      : role === 'Students'
                        ? 'people'
                        : role === 'Faculty'
                          ? 'person-circle'
                          : 'person-add'
                  }
                  size={16}
                  color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : Colors.text.secondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.roleChipText,
                    isActive ? styles.roleChipTextActive : styles.roleChipTextInactive,
                  ]}>
                  {role}
                </Text>
                {badgeCount > 0 && (
                  <View style={styles.chipBadge}>
                    <Text style={styles.chipBadgeText}>{badgeCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedRole === 'Connections' ? (
          <>
            {/* 1. Incoming Requests Section */}
            {incomingRequests.length > 0 && (
              <View style={styles.incomingSection}>
                <View style={styles.incomingSectionHeader}>
                  <Text style={styles.incomingSectionTitle}>Incoming Requests</Text>
                  <Text style={styles.incomingBadgeCount}>{incomingRequests.length} pending</Text>
                </View>

                {incomingRequests.map((req) => (
                  <View key={req.connectionId} style={styles.incomingCard}>
                    <Pressable
                      onPress={() =>
                        onViewMemberProfile({
                          userId: req.requesterUserId,
                          fullName: req.fullName,
                          role: req.role,
                          batch: req.batch,
                          department: req.department,
                          initials: req.initials,
                          photoKey: req.photoKey,
                          usn: null,
                          program: req.program,
                          handle: req.handle,
                          connectionId: req.connectionId,
                          connectionStatus: 'INCOMING_REQUEST',
                        })
                      }
                      style={styles.incomingCardTop}>
                      <View style={styles.incomingAvatarWrap}>
                        <Text style={styles.incomingAvatarInitials}>{req.initials}</Text>
                      </View>
                      <View style={styles.incomingTextCol}>
                        <Text style={styles.incomingName}>{req.fullName}</Text>
                        <Text style={styles.incomingHandle}>{req.handle}</Text>
                        <Text style={styles.incomingAcademic} numberOfLines={1}>
                          {[req.role, req.department, req.batch].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.incomingActionsRow}>
                      <Pressable
                        onPress={() => handleRespond(req.connectionId, 'ACCEPT')}
                        disabled={respondingId === req.connectionId}
                        style={({ pressed }) => [
                          styles.acceptRequestBtn,
                          respondingId === req.connectionId && { opacity: 0.8 },
                          pressed && styles.btnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Accept connection request">
                        {respondingId === req.connectionId ? (
                          <ActivityIndicator size="small" color="#080B11" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={15} color="#080B11" />
                            <Text style={styles.acceptRequestBtnText}>Accept</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => handleRespond(req.connectionId, 'DECLINE')}
                        disabled={respondingId === req.connectionId}
                        style={({ pressed }) => [
                          styles.declineRequestBtn,
                          respondingId === req.connectionId && { opacity: 0.8 },
                          pressed && styles.btnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Decline connection request">
                        <Ionicons name="close" size={15} color={Colors.text.secondary} />
                        <Text style={styles.declineRequestBtnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 2. My Connections Section */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>My Connections</Text>
              <Text style={styles.resultsCount}>
                {membersLoading
                  ? 'Loading...'
                  : `${filteredConnections.length} ${filteredConnections.length === 1 ? 'connection' : 'connections'}`}
              </Text>
            </View>

            {membersLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={Colors.primary.main} />
              </View>
            ) : filteredConnections.length === 0 && incomingRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="people-outline"
                  size={44}
                  color={Colors.text.tertiary}
                  style={{ marginBottom: 10 }}
                />
                <Text style={styles.emptyTitle}>No connections yet</Text>
                <Text style={styles.emptySub}>
                  Send connection requests to students, alumni, and faculty to build your campus network.
                </Text>
              </View>
            ) : (
              <View style={styles.membersGrid}>
                {filteredConnections.map((item) => {
                  const photoUri = profilePhotoUri(item.photoKey ?? null);
                  const roleTitleCase = item.role
                    ? item.role.charAt(0).toUpperCase() + item.role.slice(1).toLowerCase()
                    : '';
                  return (
                    <View
                      key={item.userId}
                      style={[styles.memberCard, { width: cardWidth }]}>
                      <View style={styles.avatarWrap}>
                        {photoUri ? (
                          <Image
                            source={{
                              uri: photoUri,
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'X-Tenant-Id': tenantId,
                              },
                            }}
                            style={styles.avatarImage}
                            contentFit="cover"
                            transition={150}
                          />
                        ) : (
                          <Text style={styles.avatarInitial}>{item.initials}</Text>
                        )}
                      </View>

                      <Text style={styles.memberName} numberOfLines={1}>
                        {item.fullName}
                      </Text>
                      <Text style={styles.memberRole}>{roleTitleCase}</Text>
                      {item.batch ? <Text style={styles.memberBatch}>{item.batch}</Text> : null}

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onViewMemberProfile(item)}
                        style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.btnPressed]}>
                        <Text style={styles.viewProfileText}>View profile</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Batch Selector Chips */}
            <Text style={styles.batchLabel}>{selectedRole} batch</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {BATCHES.map((batch) => {
                const isActive = selectedBatch === batch;
                return (
                  <Pressable
                    key={batch}
                    onPress={() => setSelectedBatch(batch)}
                    style={[
                      styles.batchChip,
                      isActive ? styles.batchChipActive : styles.batchChipInactive,
                    ]}>
                    <Text
                      style={[
                        styles.batchChipText,
                        isActive ? styles.batchChipTextActive : styles.batchChipTextInactive,
                      ]}>
                      {batch}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Results Header */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Discover {selectedRole.toLowerCase()}</Text>
              <Text style={styles.resultsCount}>
                {membersLoading
                  ? 'Searching...'
                  : `${members.length} ${members.length === 1 ? 'person' : 'people'}`}
              </Text>
            </View>

            {/* Member Cards list */}
            {membersLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={Colors.primary.main} />
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="people-outline"
                  size={44}
                  color={Colors.text.tertiary}
                  style={{ marginBottom: 10 }}
                />
                <Text style={styles.emptyTitle}>No {selectedRole.toLowerCase()} found</Text>
                <Text style={styles.emptySub}>Try adjusting your search query or batch filter.</Text>
              </View>
            ) : (
              <View style={styles.membersGrid}>
                {members.map((item) => {
                  const photoUri = profilePhotoUri(item.photoKey ?? null);
                  const roleTitleCase = item.role
                    ? item.role.charAt(0).toUpperCase() + item.role.slice(1).toLowerCase()
                    : '';
                  return (
                    <View
                      key={item.userId}
                      style={[styles.memberCard, { width: cardWidth }]}>
                      <View style={styles.avatarWrap}>
                        {photoUri ? (
                          <Image
                            source={{
                              uri: photoUri,
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'X-Tenant-Id': tenantId,
                              },
                            }}
                            style={styles.avatarImage}
                            contentFit="cover"
                            transition={150}
                          />
                        ) : (
                          <Text style={styles.avatarInitial}>{item.initials}</Text>
                        )}
                      </View>

                      <Text style={styles.memberName} numberOfLines={1}>
                        {item.fullName}
                      </Text>
                      <Text style={styles.memberRole}>{roleTitleCase}</Text>
                      {item.batch ? <Text style={styles.memberBatch}>{item.batch}</Text> : null}

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onViewMemberProfile(item)}
                        style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.btnPressed]}>
                        <Text style={styles.viewProfileText}>View profile</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      <ClubProfileModal
        visible={Boolean(selectedClub)}
        club={selectedClub}
        token={token}
        tenantId={tenantId}
        onClose={() => setSelectedClub(null)}
        onClubUpdated={(updated) => {
          setActiveClubs((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          );
          setSelectedClub((curr) => (curr?.id === updated.id ? { ...curr, ...updated } : curr));
        }}
      />
    </ScrollView>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 180, // Generous padding so content sits above floating bottom navigation bar
    },

    // 1. Top Bar
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      marginBottom: 6,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandText: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    topRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    campusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(79, 70, 229, 0.16)' : 'rgba(49, 52, 145, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(49, 52, 145, 0.2)',
    },
    campusPillText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    bellBtn: {
      padding: 4,
      position: 'relative',
    },
    bellBadgeDot: {
      position: 'absolute',
      top: 3,
      right: 3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },

    // 2. Title Section
    titleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    mainTitle: {
      fontFamily: Typography.bold,
      fontSize: 30,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    mainSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    refreshBtn: {
      padding: 6,
    },

    // 3. Hero Card
    heroCard: {
      position: 'relative',
      backgroundColor: isDark ? '#1A1842' : Colors.primary.main,
      borderRadius: 24,
      padding: 22,
      marginVertical: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.25)',
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.2,
      shadowRadius: 14,
      elevation: 6,
    },
    watermarkContainer: {
      position: 'absolute',
      right: -10,
      bottom: -15,
      opacity: 0.85,
    },
    heroKicker: {
      fontFamily: Typography.bold,
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: isDark ? Colors.primary.lavender : '#E0E7FF',
      marginBottom: 8,
    },
    heroHeadline: {
      fontFamily: Typography.bold,
      fontSize: 24,
      fontWeight: '800',
      color: Colors.text.onBrand,
      marginBottom: 8,
    },
    heroBody: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: isDark ? Colors.text.onBrandMuted : '#E2E8F0',
    },

    // 4. Four Tiles
    tilesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginVertical: 12,
    },
    tileCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    tileIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(49, 52, 145, 0.08)',
    },
    tileTitle: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: Colors.text.primary,
      textAlign: 'center',
    },
    tileSub: {
      fontFamily: Typography.regular,
      fontSize: 10.5,
      color: Colors.text.secondary,
      marginTop: 2,
      textAlign: 'center',
    },

    // 5. Section Headers & Teaser Cards
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
      marginBottom: 10,
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 19,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    sectionSeeAll: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    horizontalClubsScroll: {
      paddingBottom: 8,
      gap: 12,
    },
    miniClubCard: {
      width: 220,
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
      justifyContent: 'space-between',
    },
    miniClubTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    miniClubIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniCategoryBadge: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      maxWidth: 130,
    },
    miniCategoryText: {
      fontSize: 11,
      fontFamily: Typography.semiBold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    miniClubName: {
      fontSize: 15,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    miniClubDesc: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      marginBottom: 10,
    },
    miniClubFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : Colors.border.subtle,
      paddingTop: 8,
    },
    miniClubMembers: {
      fontSize: 11,
      fontFamily: Typography.medium,
      color: Colors.text.secondary,
    },
    miniClubAction: {
      fontSize: 11,
      fontFamily: Typography.bold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    teaserCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    teaserIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    eventsTeaserIconWrap: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.12)',
    },
    clubsTeaserIconWrap: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(49, 52, 145, 0.1)',
    },
    teaserInfo: {
      flex: 1,
    },
    teaserTitle: {
      fontFamily: Typography.bold,
      fontSize: 16.5,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    teaserSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      lineHeight: 18,
    },

    // 7. Directory Container
    directoryContainer: {
      marginTop: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.input,
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: Colors.border.card,
      paddingHorizontal: 16,
      height: 52,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 15,
      color: Colors.text.primary,
    },
    chipsRow: {
      gap: 10,
      paddingBottom: 6,
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
    },
    roleChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : Colors.primary.light,
    },
    roleChipInactive: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
    },
    roleChipText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
    },
    roleChipTextActive: {
      color: Colors.text.onBrand,
    },
    roleChipTextInactive: {
      color: Colors.text.secondary,
    },
    chipBadge: {
      backgroundColor: '#EF4444',
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: 6,
    },
    chipBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#FFFFFF',
    },

    batchLabel: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      color: Colors.text.primary,
      marginTop: 16,
      marginBottom: 10,
    },
    batchChip: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
    },
    batchChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : Colors.primary.light,
    },
    batchChipInactive: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
    },
    batchChipText: {
      fontFamily: Typography.medium,
      fontSize: 13.5,
    },
    batchChipTextActive: {
      color: Colors.text.onBrand,
    },
    batchChipTextInactive: {
      color: Colors.text.secondary,
    },

    resultsHeader: {
      marginTop: 20,
      marginBottom: 14,
    },
    resultsTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    resultsCount: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: Colors.text.secondary,
      marginTop: 3,
    },

    membersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingBottom: 24,
    },
    memberCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 22,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 8,
      elevation: isDark ? 0 : 2,
    },
    avatarWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.22)' : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 29,
    },
    avatarInitial: {
      fontFamily: Typography.bold,
      fontSize: 22,
      color: Colors.text.onBrand,
    },
    memberName: {
      fontFamily: Typography.bold,
      fontSize: 15.5,
      color: Colors.text.primary,
      marginBottom: 2,
      textAlign: 'center',
    },
    memberRole: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 2,
      textAlign: 'center',
    },
    memberBatch: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: Colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    viewProfileBtn: {
      backgroundColor: Colors.primary.main,
      borderRadius: 20,
      paddingHorizontal: 10,
      height: 38,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.2)',
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowRadius: 6,
      elevation: 3,
    },
    viewProfileText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.onBrand,
    },

    // Incoming Requests
    incomingSection: {
      marginBottom: 20,
      gap: 12,
    },
    incomingSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    incomingSectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 16.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    incomingBadgeCount: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#38BDF8',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    incomingCard: {
      backgroundColor: isDark ? '#101626' : Colors.background.surface,
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
      padding: 14,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    incomingCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    incomingAvatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    incomingAvatarInitials: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: '#38BDF8',
    },
    incomingTextCol: {
      flex: 1,
    },
    incomingName: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
      marginBottom: 2,
    },
    incomingHandle: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: isDark ? '#C4B5FD' : '#6366F1',
      marginBottom: 2,
    },
    incomingAcademic: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    incomingActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 2,
    },
    acceptRequestBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#38BDF8',
      borderRadius: 18,
      paddingVertical: 9,
    },
    acceptRequestBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#080B11',
    },
    declineRequestBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
      borderRadius: 18,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
    },
    declineRequestBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.secondary,
    },

    centerBox: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyBox: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 16.5,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    cardPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
  });
}
