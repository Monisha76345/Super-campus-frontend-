import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { CampusClub, ClubMember } from '../types/connect-types';
import { fetchClubDetailsApi, toggleJoinClubApi } from '../api/connect-api';
import { startDirectChatApi } from '@/features/chat/chat-api';

interface ClubProfileModalProps {
  visible: boolean;
  onClose: () => void;
  club: CampusClub | null;
  token?: string;
  tenantId?: string;
  onClubUpdated?: (updatedClub: CampusClub) => void;
}

export function ClubProfileModal({
  visible,
  onClose,
  club: initialClub,
  token = '',
  tenantId = '',
  onClubUpdated,
}: ClubProfileModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [club, setClub] = useState<CampusClub | null>(initialClub);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'LEADS' | 'MEMBERS'>('ALL');
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  // Sync initial club when prop changes or modal opens
  useEffect(() => {
    if (initialClub) {
      setClub(initialClub);
    }
  }, [initialClub]);

  // Load detailed profile and roster whenever modal opens
  const loadFullProfile = useCallback(async () => {
    if (!visible || !initialClub?.id || !token || !tenantId) return;
    setLoading(true);
    try {
      const detailed = await fetchClubDetailsApi(token, tenantId, initialClub.id);
      setClub(detailed);
      onClubUpdated?.(detailed);
    } catch (err) {
      console.warn('Failed to load full club details:', err);
    } finally {
      setLoading(false);
    }
  }, [visible, initialClub?.id, token, tenantId, onClubUpdated]);

  useEffect(() => {
    if (visible && initialClub?.id) {
      loadFullProfile();
      setSearchMemberQuery('');
      setFilterRole('ALL');
    }
  }, [visible, initialClub?.id, loadFullProfile]);

  // Handle Join / Leave club
  const handleToggleJoin = async () => {
    if (!club || !token || !tenantId || joining) return;
    setJoining(true);
    try {
      const updated = await toggleJoinClubApi(token, tenantId, club.id);
      setClub(updated);
      onClubUpdated?.(updated);
    } catch (err: any) {
      Alert.alert(
        'Club Membership',
        err?.message || 'Could not update club membership. Please try again.',
      );
    } finally {
      setJoining(false);
    }
  };

  // Handle Share club
  const handleShareClub = async () => {
    if (!club) return;
    try {
      await Share.share({
        title: club.name,
        message: `Check out ${club.name} (${club.category}) on Supercampus!\n\n${club.description}\n\nMembers: ${club.memberCount} | Venue: ${club.roomOrVenue || 'Campus'}\nSchedule: ${club.meetingSchedule || 'Weekly'}\n\nJoin us on Supercampus!`,
      });
    } catch {
      // dismissed
    }
  };

  // Direct Message action for members
  const handleMessageMember = async (member: ClubMember) => {
    if (!token || !tenantId) {
      router.push('/messages');
      onClose();
      return;
    }
    setMessagingUserId(member.userId);
    try {
      const thread = await startDirectChatApi(token, tenantId, member.userId);
      onClose();
      if (thread?.id) {
        router.push({
          pathname: '/messages',
          params: { threadId: thread.id, title: member.fullName },
        } as any);
      } else {
        router.push('/messages');
      }
    } catch {
      onClose();
      router.push('/messages');
    } finally {
      setMessagingUserId(null);
    }
  };

  // Member filter and search
  const filteredMembers = useMemo(() => {
    const list = club?.members || [];
    return list.filter((m) => {
      const query = searchMemberQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        m.fullName.toLowerCase().includes(query) ||
        m.clubRole.toLowerCase().includes(query) ||
        (m.department && m.department.toLowerCase().includes(query)) ||
        (m.usn && m.usn.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      if (filterRole === 'LEADS') {
        return m.isLead;
      }
      if (filterRole === 'MEMBERS') {
        return !m.isLead;
      }
      return true;
    });
  }, [club?.members, searchMemberQuery, filterRole]);

  const leadsCount = useMemo(() => {
    return (club?.members || []).filter((m) => m.isLead).length;
  }, [club?.members]);

  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  if (!club) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalRoot, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Club Profile"
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Club Profile
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share Club"
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={handleShareClub}
          >
            <Ionicons name="share-social-outline" size={22} color={Colors.primary.main} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.clubIconContainer}>
                <Ionicons name="people" size={32} color={Colors.primary.light} />
              </View>
              <View style={styles.heroBadgesCol}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{club.category}</Text>
                </View>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>{club.status || 'Active Club'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.clubTitle}>{club.name}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color={Colors.primary.light} />
                <Text style={styles.statText}>{club.memberCount} Members</Text>
              </View>
              {club.roomOrVenue ? (
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={16} color="#A78BFA" />
                  <Text style={styles.statText} numberOfLines={1}>
                    {club.roomOrVenue}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Quick Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoGridCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="time-outline" size={18} color={Colors.primary.light} />
              </View>
              <Text style={styles.infoLabel}>Meeting Schedule</Text>
              <Text style={styles.infoValue}>
                {club.meetingSchedule || 'Weekly sessions announced in group'}
              </Text>
            </View>

            <View style={styles.infoGridCard}>
              <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="business-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={styles.infoLabel}>Venue / Room</Text>
              <Text style={styles.infoValue}>{club.roomOrVenue || 'Campus Activity Hub'}</Text>
            </View>

            {club.contactEmail ? (
              <View style={[styles.infoGridCard, styles.infoGridCardFull]}>
                <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="mail-outline" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Official Contact</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {club.contactEmail}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* About Club Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary.light} />
              <Text style={styles.sectionTitle}>About the Club</Text>
            </View>
            <Text style={styles.descriptionText}>{club.description}</Text>
          </View>

          {/* Lead Coordinator Highlight */}
          {club.leadName ? (
            <View style={styles.leadCard}>
              <View style={styles.leadAvatar}>
                <Text style={styles.leadAvatarText}>
                  {club.leadName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.leadInfo}>
                <View style={styles.leadBadgeRow}>
                  <Text style={styles.leadRoleBadge}>Lead Coordinator</Text>
                </View>
                <Text style={styles.leadNameText}>{club.leadName}</Text>
                {club.contactEmail ? (
                  <Text style={styles.leadContactText}>{club.contactEmail}</Text>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [styles.leadMessageBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (club.leadUserId) {
                    handleMessageMember({
                      userId: club.leadUserId,
                      fullName: club.leadName || 'Club Lead',
                      clubRole: 'Lead Coordinator',
                      department: 'Leadership',
                      initials: club.leadName?.charAt(0) || 'L',
                      isLead: true,
                    });
                  } else {
                    router.push('/messages');
                    onClose();
                  }
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                <Text style={styles.leadMessageBtnText}>Chat</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Complete Club Members Roster Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="people-circle-outline" size={20} color={Colors.primary.light} />
              <Text style={styles.sectionTitle}>
                Club Members ({club.members?.length || club.memberCount})
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary.main} style={{ marginLeft: 8 }} />
              ) : null}
            </View>
            <Text style={styles.rosterSubtitle}>
              Who and all are inside the club, including leads and active student members.
            </Text>

            {/* Member Search Bar */}
            <View style={styles.searchBarWrap}>
              <Ionicons name="search" size={16} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member by name, role, USN..."
                placeholderTextColor={Colors.text.secondary}
                value={searchMemberQuery}
                onChangeText={setSearchMemberQuery}
                autoCapitalize="none"
              />
              {searchMemberQuery.length > 0 ? (
                <Pressable onPress={() => setSearchMemberQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={Colors.text.secondary} />
                </Pressable>
              ) : null}
            </View>

            {/* Filter Chips: All, Leads, Members */}
            <View style={styles.filterChipsRow}>
              <Pressable
                style={[styles.filterChip, filterRole === 'ALL' && styles.filterChipActive]}
                onPress={() => setFilterRole('ALL')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterRole === 'ALL' && styles.filterChipTextActive,
                  ]}
                >
                  All ({club.members?.length || 0})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterRole === 'LEADS' && styles.filterChipActive]}
                onPress={() => setFilterRole('LEADS')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterRole === 'LEADS' && styles.filterChipTextActive,
                  ]}
                >
                  Core Team ({leadsCount})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterRole === 'MEMBERS' && styles.filterChipActive]}
                onPress={() => setFilterRole('MEMBERS')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterRole === 'MEMBERS' && styles.filterChipTextActive,
                  ]}
                >
                  Members ({(club.members?.length || 0) - leadsCount})
                </Text>
              </Pressable>
            </View>

            {/* Member Roster List */}
            {filteredMembers.length > 0 ? (
              <View style={styles.rosterList}>
                {filteredMembers.map((member) => (
                  <View key={member.userId} style={styles.memberCard}>
                    <View
                      style={[
                        styles.memberAvatar,
                        member.isLead && styles.memberAvatarLead,
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberAvatarText,
                          member.isLead && styles.memberAvatarTextLead,
                        ]}
                      >
                        {member.initials || member.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.memberDetailsCol}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberFullName} numberOfLines={1}>
                          {member.fullName}
                        </Text>
                        {member.isLead ? (
                          <View style={styles.leadBadgeMini}>
                            <Text style={styles.leadBadgeMiniText}>Lead</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.memberRoleText}>{member.clubRole}</Text>

                      <View style={styles.memberSubRow}>
                        <Text style={styles.memberDeptText} numberOfLines={1}>
                          {member.department}
                          {member.batch ? ` · ${member.batch}` : ''}
                        </Text>
                        {member.usn ? (
                          <View style={styles.usnBadge}>
                            <Text style={styles.usnBadgeText}>{member.usn}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.memberMessageBtn,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleMessageMember(member)}
                      disabled={messagingUserId === member.userId}
                    >
                      {messagingUserId === member.userId ? (
                        <ActivityIndicator size="small" color={Colors.primary.main} />
                      ) : (
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={18}
                          color={Colors.primary.light}
                        />
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRoster}>
                <Ionicons name="people-outline" size={32} color={Colors.text.secondary} />
                <Text style={styles.emptyRosterText}>
                  {searchMemberQuery
                    ? `No members found matching "${searchMemberQuery}"`
                    : 'No members listed for this filter.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Sticky Action Footer */}
        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={club.isJoined ? 'Leave Club' : 'Join Club'}
            style={({ pressed }) => [
              styles.joinButton,
              club.isJoined ? styles.joinedButton : styles.notJoinedButton,
              pressed && styles.btnPressed,
            ]}
            onPress={handleToggleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator
                size="small"
                color={club.isJoined ? Colors.text.primary : '#FFFFFF'}
              />
            ) : club.isJoined ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.joinedButtonText}>Joined Club (Tap to Leave)</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join this Club</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: isDark ? '#080B11' : Colors.background.canvas,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : Colors.border.subtle,
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
    },
    iconButton: {
      padding: 6,
      borderRadius: 20,
    },
    iconButtonPressed: {
      opacity: 0.6,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    heroCard: {
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    heroHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    clubIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : Colors.primary.light,
    },
    heroBadgesCol: {
      alignItems: 'flex-end',
      gap: 6,
    },
    categoryBadge: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
    },
    categoryBadgeText: {
      fontSize: 12,
      fontFamily: Typography.semiBold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      gap: 5,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    activePillText: {
      fontSize: 11,
      fontFamily: Typography.medium,
      color: '#10B981',
    },
    clubTitle: {
      fontSize: 22,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 4,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 13,
      fontFamily: Typography.medium,
      color: Colors.text.secondary,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    infoGridCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
    },
    infoGridCardFull: {
      minWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 11,
      fontFamily: Typography.medium,
      color: Colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 13,
      fontFamily: Typography.semiBold,
      color: Colors.text.primary,
    },
    sectionContainer: {
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
    },
    descriptionText: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Typography.regular,
      color: isDark ? '#CBD5E1' : Colors.text.secondary,
    },
    rosterSubtitle: {
      fontSize: 12,
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      marginBottom: 12,
    },
    leadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : Colors.border.subtle,
      marginBottom: 16,
      gap: 12,
    },
    leadAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: Colors.primary.main,
    },
    leadAvatarText: {
      fontSize: 18,
      fontFamily: Typography.bold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    leadInfo: {
      flex: 1,
    },
    leadBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    leadRoleBadge: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    leadNameText: {
      fontSize: 15,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
    },
    leadContactText: {
      fontSize: 12,
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    leadMessageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.primary.main,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    leadMessageBtnText: {
      fontSize: 12,
      fontFamily: Typography.semiBold,
      color: '#FFFFFF',
    },
    searchBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : Colors.background.canvas,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontFamily: Typography.regular,
      color: Colors.text.primary,
      padding: 0,
    },
    filterChipsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? '#111827' : Colors.background.canvas,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.15)',
      borderColor: Colors.primary.main,
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: Typography.medium,
      color: Colors.text.secondary,
    },
    filterChipTextActive: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontFamily: Typography.semiBold,
    },
    rosterList: {
      gap: 10,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : Colors.background.canvas,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : Colors.border.subtle,
      gap: 12,
    },
    memberAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarLead: {
      borderWidth: 2,
      borderColor: isDark ? '#38BDF8' : Colors.primary.main,
    },
    memberAvatarText: {
      fontSize: 15,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
    },
    memberAvatarTextLead: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    memberDetailsCol: {
      flex: 1,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    memberFullName: {
      fontSize: 14,
      fontFamily: Typography.bold,
      color: Colors.text.primary,
      maxWidth: '75%',
    },
    leadBadgeMini: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
    },
    leadBadgeMiniText: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    memberRoleText: {
      fontSize: 12,
      fontFamily: Typography.medium,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      marginTop: 1,
    },
    memberSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    },
    memberDeptText: {
      fontSize: 11,
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      maxWidth: '65%',
    },
    usnBadge: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    usnBadgeText: {
      fontSize: 9,
      fontFamily: Typography.semiBold,
      color: Colors.text.secondary,
    },
    memberMessageBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyRoster: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 8,
    },
    emptyRosterText: {
      fontSize: 13,
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
    bottomActionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#0F172A' : Colors.background.surface,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : Colors.border.subtle,
      paddingHorizontal: 16,
      paddingTop: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    joinButton: {
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    notJoinedButton: {
      backgroundColor: Colors.primary.main,
    },
    joinedButton: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : Colors.border.subtle,
    },
    joinButtonText: {
      fontSize: 15,
      fontFamily: Typography.bold,
      color: '#FFFFFF',
    },
    joinedButtonText: {
      fontSize: 15,
      fontFamily: Typography.semiBold,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
    },
    btnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
  });
}
