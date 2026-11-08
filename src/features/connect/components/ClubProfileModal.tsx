import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { CampusClub, ClubAchievement, ClubMember, ClubPost } from '../types/connect-types';
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

type ChannelTab = 'OVERVIEW' | 'FEED' | 'ACHIEVEMENTS' | 'ROSTER';

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
  const [activeTab, setActiveTab] = useState<ChannelTab>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'LEADS' | 'MEMBERS'>('ALL');
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  // New post / achievement modal states
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [customPosts, setCustomPosts] = useState<ClubPost[]>([]);

  const [showAddAchievementModal, setShowAddAchievementModal] = useState(false);
  const [achieveTitle, setAchieveTitle] = useState('');
  const [achieveDesc, setAchieveDesc] = useState('');
  const [achieveBadge, setAchieveBadge] = useState('1st Place 🏆');
  const [customAchievements, setCustomAchievements] = useState<ClubAchievement[]>([]);

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
      setActiveTab('OVERVIEW');
    }
  }, [visible, initialClub?.id, loadFullProfile]);

  // Default rich channel feed posts
  const defaultClubPosts: ClubPost[] = useMemo(() => {
    if (!club) return [];
    return [
      {
        id: `post-1-${club.id}`,
        clubId: club.id,
        clubName: club.name,
        title: `${club.name} Fall Hackathon & Workshop 2026 Recap 🚀`,
        content: `Excited to announce that over 180+ students participated in our flagship technical workshop this past weekend! Special shoutout to our mentor leads and collegiate team who guided 30+ innovative project prototypes. More workshops coming next month!`,
        likes: 42,
        isLiked: false,
        commentsCount: 8,
        createdAt: '2 days ago',
      },
      {
        id: `post-2-${club.id}`,
        clubId: club.id,
        clubName: club.name,
        title: `Welcoming our 2026 Core Executive Committee 🌟`,
        content: `Congratulations to all student leads selected for this academic year! Together we will lead collegiate symposiums, organize inter-college competitions, and drive hands-on skill sprints. Connect with us in the roster tab to collaborate!`,
        likes: 67,
        isLiked: true,
        commentsCount: 14,
        createdAt: '1 week ago',
      },
    ];
  }, [club]);

  // Default achievements
  const defaultClubAchievements: ClubAchievement[] = useMemo(() => {
    if (!club) return [];
    return [
      {
        id: `ach-1-${club.id}`,
        clubId: club.id,
        title: 'National Collegiate Innovation Champion',
        description: 'Awarded 1st place among 120+ collegiate teams for autonomous design and campus sustainability solutions.',
        badgeText: 'National 1st Prize 🏆',
        date: 'October 2026',
      },
      {
        id: `ach-2-${club.id}`,
        clubId: club.id,
        title: 'Best Student Chapter Excellence Award',
        description: 'Recognized by college administration for holding 12+ technical workshops, peer mentorship circles, and community demos.',
        badgeText: 'Gold Chapter Rating ⭐',
        date: 'August 2026',
      },
      {
        id: `ach-3-${club.id}`,
        clubId: club.id,
        title: 'Inter-College Hackathon 2026 Winners',
        description: 'Team clinched runner-up position in smart campus automation category with open-source project submission.',
        badgeText: 'Runner-Up Award 🥈',
        date: 'June 2026',
      },
    ];
  }, [club]);

  const allPosts = useMemo(() => {
    return [...customPosts, ...defaultClubPosts];
  }, [customPosts, defaultClubPosts]);

  const allAchievements = useMemo(() => {
    return [...customAchievements, ...defaultClubAchievements];
  }, [customAchievements, defaultClubAchievements]);

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
        message: `Check out ${club.name} (${club.category}) on Supercampus!\n\n${club.description}\n\nMembers: ${club.memberCount} | Venue: ${club.roomOrVenue || 'Campus Activity Hub'}\n\nExplore achievements and announcements on Supercampus!`,
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

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert('Empty Post', 'Please write something to share on the club channel.');
      return;
    }
    const newPost: ClubPost = {
      id: `post-cust-${Date.now()}`,
      clubId: club?.id || '',
      clubName: club?.name || 'Club',
      title: newPostTitle.trim() || undefined,
      content: newPostContent.trim(),
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      createdAt: 'Just now',
    };
    setCustomPosts((prev) => [newPost, ...prev]);
    setNewPostContent('');
    setNewPostTitle('');
    setShowCreatePostModal(false);
    Alert.alert('Published 🎉', 'Update published to your club channel feed.');
  };

  const handleAddAchievement = () => {
    if (!achieveTitle.trim()) {
      Alert.alert('Required Field', 'Please enter achievement title.');
      return;
    }
    const newAch: ClubAchievement = {
      id: `ach-cust-${Date.now()}`,
      clubId: club?.id || '',
      title: achieveTitle.trim(),
      description: achieveDesc.trim() || 'Collegiate honor awarded to club members for outstanding performance.',
      badgeText: achieveBadge.trim() || 'Winner 🏆',
      date: 'Recent',
    };
    setCustomAchievements((prev) => [newAch, ...prev]);
    setAchieveTitle('');
    setAchieveDesc('');
    setShowAddAchievementModal(false);
    Alert.alert('Achievement Added 🏆', 'Milestone showcase is now live on the club channel.');
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

  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  if (!club) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.modalRoot, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {club.name} Channel
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={handleShareClub}>
            <Ionicons name="share-social-outline" size={22} color={Colors.primary.main} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.clubIconContainer}>
                <Ionicons name="shield-checkmark" size={32} color="#38BDF8" />
              </View>
              <View style={styles.heroBadgesCol}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{club.category}</Text>
                </View>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>{club.status || 'Verified Club'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.clubTitle}>{club.name}</Text>
            <Text style={styles.clubSubtitle} numberOfLines={2}>
              Official Collegiate Organization · NMIT Campus
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={15} color="#38BDF8" />
                <Text style={styles.statText}>{club.memberCount} Members</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={15} color="#FBBF24" />
                <Text style={styles.statText}>{allAchievements.length} Achievements</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="newspaper-outline" size={15} color="#A78BFA" />
                <Text style={styles.statText}>{allPosts.length} Updates</Text>
              </View>
            </View>

            {/* Join / Following Button */}
            <Pressable
              onPress={handleToggleJoin}
              disabled={joining}
              style={[styles.joinBtn, club.isJoined ? styles.joinedBtn : styles.unjoinedBtn]}>
              {joining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={club.isJoined ? 'checkmark-circle' : 'person-add-outline'}
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.joinBtnText}>
                    {club.isJoined ? 'Joined Member' : 'Join Club Channel'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* 4-Tab Channel Segment Navigation */}
          <View style={styles.channelTabsRow}>
            <Pressable
              onPress={() => setActiveTab('OVERVIEW')}
              style={[styles.channelTabPill, activeTab === 'OVERVIEW' && styles.channelTabPillActive]}>
              <Text style={[styles.channelTabText, activeTab === 'OVERVIEW' && styles.channelTabTextActive]}>
                Overview
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('FEED')}
              style={[styles.channelTabPill, activeTab === 'FEED' && styles.channelTabPillActive]}>
              <Text style={[styles.channelTabText, activeTab === 'FEED' && styles.channelTabTextActive]}>
                Feed ({allPosts.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('ACHIEVEMENTS')}
              style={[styles.channelTabPill, activeTab === 'ACHIEVEMENTS' && styles.channelTabPillActive]}>
              <Text style={[styles.channelTabText, activeTab === 'ACHIEVEMENTS' && styles.channelTabTextActive]}>
                Achievements ({allAchievements.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('ROSTER')}
              style={[styles.channelTabPill, activeTab === 'ROSTER' && styles.channelTabPillActive]}>
              <Text style={[styles.channelTabText, activeTab === 'ROSTER' && styles.channelTabTextActive]}>
                Members ({club.members?.length || club.memberCount})
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <View>
              {/* Quick Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoGridCard}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="time-outline" size={18} color="#38BDF8" />
                  </View>
                  <Text style={styles.infoLabel}>Meeting Schedule</Text>
                  <Text style={styles.infoValue}>
                    {club.meetingSchedule || 'Weekly sessions in activity hall'}
                  </Text>
                </View>

                <View style={styles.infoGridCard}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Ionicons name="business-outline" size={18} color="#38BDF8" />
                  </View>
                  <Text style={styles.infoLabel}>Room / Venue</Text>
                  <Text style={styles.infoValue}>{club.roomOrVenue || 'Campus Activity Hub'}</Text>
                </View>
              </View>

              {/* About Club Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About the Club</Text>
                <Text style={styles.descriptionText}>{club.description}</Text>
              </View>

              {/* Lead Coordinator */}
              {club.leadName ? (
                <View style={styles.leadCard}>
                  <View style={styles.leadAvatar}>
                    <Text style={styles.leadAvatarText}>{club.leadName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadRoleBadge}>Lead Coordinator</Text>
                    <Text style={styles.leadNameText}>{club.leadName}</Text>
                    {club.contactEmail ? (
                      <Text style={styles.leadContactText}>{club.contactEmail}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.leadMessageBtn}
                    onPress={() => {
                      if (club.leadUserId) {
                        handleMessageMember({
                          userId: club.leadUserId,
                          fullName: club.leadName || 'Lead',
                          clubRole: 'Lead Coordinator',
                          department: 'Leadership',
                          initials: club.leadName?.charAt(0) || 'L',
                          isLead: true,
                        });
                      } else {
                        router.push('/messages');
                        onClose();
                      }
                    }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.leadMessageBtnText}>Chat</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}

          {/* TAB 2: CHANNEL POSTS FEED */}
          {activeTab === 'FEED' && (
            <View style={styles.feedTabContainer}>
              <Pressable
                onPress={() => setShowCreatePostModal(true)}
                style={styles.createPostActionBtn}>
                <Ionicons name="add-circle" size={18} color="#38BDF8" />
                <Text style={styles.createPostActionText}>Post an Update to Club Channel</Text>
              </Pressable>

              {allPosts.map((post) => (
                <View key={post.id} style={styles.channelPostCard}>
                  <View style={styles.postHeaderRow}>
                    <View style={styles.postAvatarCircle}>
                      <Text style={styles.postAvatarText}>{club.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.postHeaderInfo}>
                      <Text style={styles.postClubName}>{club.name}</Text>
                      <Text style={styles.postDateText}>{post.createdAt} · Official Post</Text>
                    </View>
                  </View>

                  {post.title ? <Text style={styles.postTitleText}>{post.title}</Text> : null}
                  <Text style={styles.postContentText}>{post.content}</Text>

                  {/* Likes and interaction footer */}
                  <View style={styles.postFooterRow}>
                    <View style={styles.postFooterLeft}>
                      <Ionicons name="heart" size={16} color="#EC4899" />
                      <Text style={styles.postLikesText}>{post.likes} likes</Text>
                    </View>
                    <View style={styles.postFooterRight}>
                      <Ionicons name="chatbubble-outline" size={15} color="#94A3B8" />
                      <Text style={styles.postCommentsText}>{post.commentsCount} comments</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: ACHIEVEMENTS & TROPHIES */}
          {activeTab === 'ACHIEVEMENTS' && (
            <View style={styles.achievementsTabContainer}>
              <Pressable
                onPress={() => setShowAddAchievementModal(true)}
                style={styles.createPostActionBtn}>
                <Ionicons name="trophy" size={17} color="#FBBF24" />
                <Text style={[styles.createPostActionText, { color: '#FBBF24' }]}>
                  Add Milestone / Award
                </Text>
              </Pressable>

              {allAchievements.map((ach) => (
                <View key={ach.id} style={styles.achievementCard}>
                  <View style={styles.achievementBadgePill}>
                    <Ionicons name="ribbon" size={15} color="#F59E0B" />
                    <Text style={styles.achievementBadgeText}>{ach.badgeText}</Text>
                  </View>
                  <Text style={styles.achievementTitle}>{ach.title}</Text>
                  <Text style={styles.achievementDesc}>{ach.description}</Text>
                  <Text style={styles.achievementDate}>Achieved: {ach.date}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: MEMBERS & LEADS ROSTER */}
          {activeTab === 'ROSTER' && (
            <View style={styles.rosterTabContainer}>
              {/* Member Search Bar */}
              <View style={styles.searchBarWrap}>
                <Ionicons name="search" size={16} color={Colors.text.secondary} />
                <TextInput
                  value={searchMemberQuery}
                  onChangeText={setSearchMemberQuery}
                  placeholder="Search members by name, USN, or role..."
                  placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
                  style={styles.searchBarInput}
                  autoCorrect={false}
                />
              </View>

              {/* Filter Pills */}
              <View style={styles.filterRow}>
                <Pressable
                  onPress={() => setFilterRole('ALL')}
                  style={[styles.filterPill, filterRole === 'ALL' && styles.filterPillActive]}>
                  <Text style={[styles.filterPillText, filterRole === 'ALL' && styles.filterPillTextActive]}>
                    All ({club.members?.length || 0})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterRole('LEADS')}
                  style={[styles.filterPill, filterRole === 'LEADS' && styles.filterPillActive]}>
                  <Text style={[styles.filterPillText, filterRole === 'LEADS' && styles.filterPillTextActive]}>
                    Leads
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterRole('MEMBERS')}
                  style={[styles.filterPill, filterRole === 'MEMBERS' && styles.filterPillActive]}>
                  <Text style={[styles.filterPillText, filterRole === 'MEMBERS' && styles.filterPillTextActive]}>
                    Members
                  </Text>
                </Pressable>
              </View>

              {filteredMembers.map((m) => (
                <View key={m.userId} style={styles.memberRowCard}>
                  <View style={styles.memberAvatarCircle}>
                    <Text style={styles.memberAvatarInitial}>{m.initials || m.fullName.charAt(0)}</Text>
                  </View>
                  <View style={styles.memberInfoCol}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberFullName}>{m.fullName}</Text>
                      {m.isLead && (
                        <View style={styles.leadTag}>
                          <Text style={styles.leadTagText}>LEAD</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberSubText}>
                      {m.clubRole} · {m.department || 'NMIT'} {m.usn ? `(${m.usn})` : ''}
                    </Text>
                  </View>
                  <Pressable
                    disabled={messagingUserId === m.userId}
                    onPress={() => handleMessageMember(m)}
                    style={styles.memberChatBtn}>
                    {messagingUserId === m.userId ? (
                      <ActivityIndicator size="small" color="#38BDF8" />
                    ) : (
                      <Ionicons name="chatbubble-outline" size={16} color="#38BDF8" />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modal: Create Post to Club Channel */}
        <Modal
          visible={showCreatePostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreatePostModal(false)}>
          <Pressable
            style={styles.creationModalBackdrop}
            onPress={() => setShowCreatePostModal(false)}>
            <View style={styles.creationCard}>
              <Text style={styles.creationTitle}>Share to {club.name} Channel</Text>
              <TextInput
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="Announcement Title (optional)"
                placeholderTextColor="#64748B"
                style={styles.creationInput}
              />
              <TextInput
                value={newPostContent}
                onChangeText={setNewPostContent}
                placeholder="What did your club accomplish or organize? Share with campus members..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                style={[styles.creationInput, { height: 90, textAlignVertical: 'top' }]}
              />
              <View style={styles.creationActionsRow}>
                <Pressable
                  onPress={() => setShowCreatePostModal(false)}
                  style={styles.creationCancelBtn}>
                  <Text style={styles.creationCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreatePost}
                  style={styles.creationSubmitBtn}>
                  <Text style={styles.creationSubmitText}>Publish Post</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Modal: Add Milestone / Achievement */}
        <Modal
          visible={showAddAchievementModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddAchievementModal(false)}>
          <Pressable
            style={styles.creationModalBackdrop}
            onPress={() => setShowAddAchievementModal(false)}>
            <View style={styles.creationCard}>
              <Text style={styles.creationTitle}>Add Club Milestone or Award 🏆</Text>
              <TextInput
                value={achieveTitle}
                onChangeText={setAchieveTitle}
                placeholder="e.g. 1st Place at National Smart India Hackathon"
                placeholderTextColor="#64748B"
                style={styles.creationInput}
              />
              <TextInput
                value={achieveBadge}
                onChangeText={setAchieveBadge}
                placeholder="Badge text (e.g. Gold Trophy 🏆, Runner Up 🥈)"
                placeholderTextColor="#64748B"
                style={styles.creationInput}
              />
              <TextInput
                value={achieveDesc}
                onChangeText={setAchieveDesc}
                placeholder="Brief description of the achievement and participants..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                style={[styles.creationInput, { height: 80, textAlignVertical: 'top' }]}
              />
              <View style={styles.creationActionsRow}>
                <Pressable
                  onPress={() => setShowAddAchievementModal(false)}
                  style={styles.creationCancelBtn}>
                  <Text style={styles.creationCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddAchievement}
                  style={styles.creationSubmitBtn}>
                  <Text style={styles.creationSubmitText}>Add Milestone</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    headerBar: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    iconButton: {
      padding: 6,
    },
    iconButtonPressed: {
      opacity: 0.7,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    heroCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 16,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    clubIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: isDark ? '#082F49' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBadgesCol: {
      alignItems: 'flex-end',
      gap: 4,
    },
    categoryBadge: {
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    categoryBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#38BDF8',
      fontWeight: '700',
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    activePillText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: '#10B981',
    },
    clubTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
      marginBottom: 2,
    },
    clubSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12.5,
      color: Colors.text.secondary,
      marginBottom: 14,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 14,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.primary,
      fontWeight: '600',
    },
    joinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      borderRadius: 12,
      marginTop: 4,
    },
    unjoinedBtn: {
      backgroundColor: '#2563EB',
    },
    joinedBtn: {
      backgroundColor: '#10B981',
    },
    joinBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    channelTabsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    channelTabPill: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelTabPillActive: {
      backgroundColor: '#2563EB',
      borderColor: '#38BDF8',
    },
    channelTabText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#64748B',
      fontWeight: '600',
    },
    channelTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    infoGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    infoGridCard: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    infoIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    infoLabel: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    infoValue: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: Colors.text.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    sectionContainer: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 8,
    },
    descriptionText: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: isDark ? '#CBD5E1' : '#334155',
    },
    leadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      gap: 12,
    },
    leadAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    leadAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    leadInfo: {
      flex: 1,
    },
    leadRoleBadge: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#38BDF8',
      fontWeight: '700',
    },
    leadNameText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 2,
    },
    leadContactText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    leadMessageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#2563EB',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    leadMessageBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    feedTabContainer: {
      gap: 12,
    },
    createPostActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 12,
      borderRadius: 14,
      marginBottom: 6,
    },
    createPostActionText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: '#38BDF8',
      fontWeight: '600',
    },
    channelPostCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
    },
    postHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    postAvatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    postAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    postHeaderInfo: {
      flex: 1,
    },
    postClubName: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    postDateText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    postTitleText: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    postContentText: {
      fontFamily: Typography.regular,
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#CBD5E1' : '#334155',
      marginBottom: 12,
    },
    postFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.05)',
    },
    postFooterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    postLikesText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#EC4899',
      fontWeight: '700',
    },
    postFooterRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    postCommentsText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    achievementsTabContainer: {
      gap: 12,
    },
    achievementCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
    },
    achievementBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 8,
    },
    achievementBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#F59E0B',
      fontWeight: '700',
    },
    achievementTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    achievementDesc: {
      fontFamily: Typography.regular,
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#CBD5E1' : '#475569',
      marginBottom: 8,
    },
    achievementDate: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    rosterTabContainer: {
      gap: 10,
    },
    searchBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
      marginBottom: 10,
    },
    searchBarInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.primary,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    },
    filterPillActive: {
      backgroundColor: '#2563EB',
    },
    filterPillText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    filterPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    memberRowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      gap: 10,
    },
    memberAvatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarInitial: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#FFFFFF',
    },
    memberInfoCol: {
      flex: 1,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    memberFullName: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    leadTag: {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    leadTagText: {
      fontFamily: Typography.bold,
      fontSize: 9.5,
      color: '#38BDF8',
      fontWeight: '800',
    },
    memberSubText: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    memberChatBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
    },
    creationModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    creationCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
    },
    creationTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 14,
      textAlign: 'center',
    },
    creationInput: {
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.1)',
      paddingHorizontal: 12,
      height: 44,
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: Colors.text.primary,
      marginBottom: 12,
    },
    creationActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 6,
    },
    creationCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    creationCancelText: {
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.secondary,
    },
    creationSubmitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#2563EB',
    },
    creationSubmitText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
