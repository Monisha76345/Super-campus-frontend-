import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { profilePhotoUri } from '@/features/profile/api/profile-api';
import { useAppTheme } from '@/theme/app-theme';
import {
  fetchMessagesApi,
  fetchThreadDetailsApi,
  searchUsersApi,
  sendMessageApi,
  updateGroupChatApi,
} from './chat-api';
import { ChatMessage, ChatThread, ParticipantSummary, SearchUser } from './types';

interface ChatDetailScreenProps {
  threadId: string;
  recipient: ParticipantSummary;
  isGroup?: boolean;
  groupName?: string | null;
  participantsCount?: number;
  token: string;
  tenantId: string;
  onBack: () => void;
  onUpdateGroup?: (updatedName: string, updatedCount: number) => void;
}

export function ChatDetailScreen({
  threadId,
  recipient,
  isGroup = false,
  groupName,
  participantsCount,
  token,
  tenantId,
  onBack,
  onUpdateGroup,
}: ChatDetailScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Group Info Modal & Edit states
  const [groupInfoVisible, setGroupInfoVisible] = useState(false);
  const [threadDetails, setThreadDetails] = useState<ChatThread | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Editing Group Name
  const [currentGroupName, setCurrentGroupName] = useState<string>(
    isGroup ? groupName || recipient.fullName : recipient.fullName,
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameText, setEditNameText] = useState(currentGroupName);
  const [savingName, setSavingName] = useState(false);

  // Add Members Modal
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<SearchUser[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const photoUri = !isGroup ? profilePhotoUri(recipient.photoKey ?? null) : null;
  const displayName = isGroup ? currentGroupName : recipient.fullName;

  const loadMessages = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const list = await fetchMessagesApi(token, tenantId, threadId);
        setMessages(list);
      } catch (err) {
        console.warn('Could not load chat messages:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, tenantId, threadId],
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time auto polling every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages();
    }, 3000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  const handleOpenGroupInfo = async () => {
    if (!isGroup) return;
    setGroupInfoVisible(true);
    setLoadingDetails(true);
    try {
      const details = await fetchThreadDetailsApi(token, tenantId, threadId);
      setThreadDetails(details);
      if (details.name) {
        setCurrentGroupName(details.name);
        setEditNameText(details.name);
      }
    } catch (err) {
      console.warn('Failed to load group details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveGroupName = async () => {
    const trimmed = editNameText.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Group name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateGroupChatApi(token, tenantId, threadId, { name: trimmed });
      setCurrentGroupName(trimmed);
      setThreadDetails(updated);
      setIsEditingName(false);
      onUpdateGroup?.(trimmed, updated.participantsCount || updated.participants?.length || 0);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update group name');
    } finally {
      setSavingName(false);
    }
  };

  const handleOpenAddMembers = async () => {
    setAddMembersModalVisible(true);
    setSelectedUserIdsToAdd([]);
    setMemberSearchQuery('');
    setSearchingMembers(true);
    try {
      const results = await searchUsersApi(token, tenantId, '');
      setDirectoryUsers(results);
    } catch (err) {
      console.warn('Could not load users for adding to group:', err);
    } finally {
      setSearchingMembers(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setMemberSearchQuery(query);
    setSearchingMembers(true);
    try {
      const results = await searchUsersApi(token, tenantId, query);
      setDirectoryUsers(results);
    } catch (err) {
      console.warn('Could not search users:', err);
    } finally {
      setSearchingMembers(false);
    }
  };

  const toggleSelectUserToAdd = (userId: string) => {
    setSelectedUserIdsToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleAddMembersSubmit = async () => {
    if (selectedUserIdsToAdd.length === 0) return;
    setAddingMembers(true);
    try {
      const updated = await updateGroupChatApi(token, tenantId, threadId, {
        addMemberUserIds: selectedUserIdsToAdd,
      });
      setThreadDetails(updated);
      setAddMembersModalVisible(false);
      setSelectedUserIdsToAdd([]);
      onUpdateGroup?.(
        updated.name || currentGroupName,
        updated.participantsCount || updated.participants?.length || 0,
      );
      Alert.alert('Success', 'Selected members have been added to the group!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = (member: ParticipantSummary) => {
    if ((threadDetails?.participants?.length || 0) <= 2) {
      Alert.alert('Cannot Remove', 'A group must have at least 2 participants.');
      return;
    }
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.fullName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingUserId(member.userId);
            try {
              const updated = await updateGroupChatApi(token, tenantId, threadId, {
                removeUserId: member.userId,
              });
              setThreadDetails(updated);
              onUpdateGroup?.(
                updated.name || currentGroupName,
                updated.participantsCount || updated.participants?.length || 0,
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove member');
            } finally {
              setRemovingUserId(null);
            }
          },
        },
      ],
    );
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    if (text.length > 2000) {
      return;
    }

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      threadId,
      senderId: user?.id || 'me',
      senderName: user?.fullName || 'Me',
      senderUsn: null,
      content: text,
      status: 'SENT',
      isMine: true,
      createdAt: new Date().toISOString(),
      formattedTime: new Date()
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');

    try {
      const saved = await sendMessageApi(token, tenantId, threadId, text);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.warn('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMine = Boolean(
      item.senderId === 'me' || (user?.id ? item.senderId === user.id : item.isMine),
    );

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
        ]}>
        {!isMine && isGroup && (
          <View style={styles.groupSenderAvatar}>
            <Text style={styles.groupSenderAvatarText}>
              {(item.senderInitials || item.senderName?.slice(0, 2) || 'U').toUpperCase()}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}>
          {!isMine && isGroup && (
            <Text style={styles.groupSenderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
            {item.formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  const existingParticipantIds = useMemo(
    () => new Set(threadDetails?.participants?.map((p) => p.userId) || []),
    [threadDetails],
  );

  const availableUsersToAdd = useMemo(
    () => directoryUsers.filter((u) => !existingParticipantIds.has(u.userId) && u.userId !== user?.id),
    [directoryUsers, existingParticipantIds, user?.id],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to messages"
          onPress={onBack}
          hitSlop={12}
          style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isGroup ? 'Group information' : recipient.fullName}
          disabled={!isGroup}
          onPress={handleOpenGroupInfo}
          style={styles.headerRecipientRow}>
          <View style={[styles.headerAvatarCircle, isGroup && styles.headerGroupAvatarCircle]}>
            {isGroup ? (
              <Ionicons name="people" size={18} color="#FFFFFF" />
            ) : photoUri ? (
              <Image
                source={{
                  uri: photoUri,
                  headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                        'X-Tenant-Id': tenantId || 'nmit',
                      }
                    : undefined,
                }}
                style={styles.headerAvatarImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <Text style={styles.headerAvatarText}>{recipient.initials}</Text>
            )}
          </View>
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayName}
            </Text>
            {isGroup ? (
              <Text style={styles.headerGroupSubtitle} numberOfLines={1}>
                {participantsCount ? `${participantsCount} members · Tap for info & edit` : 'Tap for info & edit'}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh chat"
          onPress={() => loadMessages(true)}
          hitSlop={12}
          style={styles.headerActionBtn}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <Ionicons name="refresh" size={22} color={Colors.text.primary} />
          )}
        </Pressable>
      </View>

      {/* Messages List Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyAvatar}>
            {photoUri ? (
              <Image
                source={{
                  uri: photoUri,
                  headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                        'X-Tenant-Id': tenantId || 'nmit',
                      }
                    : undefined,
                }}
                style={styles.emptyAvatarImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <Text style={styles.emptyAvatarText}>
                {isGroup ? <Ionicons name="people" size={36} color="#FFFFFF" /> : recipient.initials}
              </Text>
            )}
          </View>
          <Text style={styles.emptyTitle}>{displayName}</Text>
          {isGroup ? (
            <Text style={styles.emptySub}>
              {participantsCount ? `${participantsCount} members in this group` : 'Group Conversation'}
            </Text>
          ) : recipient.usn ? (
            <Text style={styles.emptySub}>
              {recipient.usn} · {recipient.department || recipient.role}
            </Text>
          ) : null}
          <Text style={styles.emptyHint}>Say hello to start the conversation!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Bottom Composer Container */}
      <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message..."
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            multiline
            maxLength={2000}
            style={styles.inputField}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!draft.trim() || sending}
            onPress={handleSend}
            style={[
              styles.sendCircleBtn,
              draft.trim().length > 0 && styles.sendCircleBtnActive,
            ]}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </Pressable>
        </View>

        <Text style={styles.charCounter}>{draft.length}/2000</Text>
      </View>

      {/* Group Info & Edit Modal */}
      {isGroup && (
        <Modal
          visible={groupInfoVisible}
          animationType="slide"
          transparent={false}
          statusBarTranslucent
          onRequestClose={() => {
            if (isEditingName) setIsEditingName(false);
            else setGroupInfoVisible(false);
          }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close group info"
                onPress={() => setGroupInfoVisible(false)}
                hitSlop={12}
                style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
              </Pressable>
              <Text style={styles.modalHeaderTitle}>Group Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Group Hero Card */}
              <View style={styles.groupInfoHero}>
                <View style={styles.groupHeroAvatar}>
                  <Ionicons name="people" size={44} color="#FFFFFF" />
                </View>

                {/* Edit Group Name Section */}
                {isEditingName ? (
                  <View style={styles.editNameContainer}>
                    <TextInput
                      value={editNameText}
                      onChangeText={setEditNameText}
                      placeholder="Enter group name"
                      placeholderTextColor="#64748B"
                      maxLength={100}
                      autoFocus
                      style={styles.editNameInput}
                    />
                    <View style={styles.editNameActionsRow}>
                      <Pressable
                        onPress={() => {
                          setIsEditingName(false);
                          setEditNameText(currentGroupName);
                        }}
                        style={styles.editNameCancelBtn}>
                        <Ionicons name="close" size={20} color="#94A3B8" />
                        <Text style={styles.editNameCancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        disabled={savingName || !editNameText.trim()}
                        onPress={handleSaveGroupName}
                        style={styles.editNameSaveBtn}>
                        {savingName ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            <Text style={styles.editNameSaveText}>Save</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.titleRow}>
                    <Text style={styles.groupHeroTitle}>{displayName}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Edit group name"
                      onPress={() => {
                        setEditNameText(displayName);
                        setIsEditingName(true);
                      }}
                      hitSlop={8}
                      style={styles.editNamePencilBtn}>
                      <Ionicons name="pencil-outline" size={18} color="#38BDF8" />
                    </Pressable>
                  </View>
                )}

                <Text style={styles.groupHeroSub}>
                  {threadDetails?.participants?.length || participantsCount || 0} campus members
                </Text>
              </View>

              {/* Participants Card */}
              <View style={styles.membersListCard}>
                <View style={styles.membersCardHeaderRow}>
                  <Text style={styles.membersListTitle}>
                    PARTICIPANTS ({threadDetails?.participants?.length || participantsCount || 0})
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add members to group"
                    onPress={handleOpenAddMembers}
                    style={styles.addMembersPillBtn}>
                    <Ionicons name="person-add-outline" size={15} color="#38BDF8" />
                    <Text style={styles.addMembersPillText}>+ Add Members</Text>
                  </Pressable>
                </View>

                {loadingDetails ? (
                  <View style={{ padding: 28, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#2563EB" />
                  </View>
                ) : (
                  (threadDetails?.participants || []).map((member) => {
                    const isCurrentUser = member.userId === user?.id;
                    const isRemovingThis = removingUserId === member.userId;

                    return (
                      <View key={member.userId} style={styles.modalMemberRow}>
                        <View style={styles.modalMemberAvatar}>
                          <Text style={styles.modalMemberAvatarText}>{member.initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.modalMemberName}>{member.fullName}</Text>
                            {isCurrentUser && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>You</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.modalMemberSub}>
                            {member.usn ? `${member.usn} · ` : ''}
                            {member.department || member.role}
                          </Text>
                        </View>

                        {/* Remove participant button (only for other members) */}
                        {!isCurrentUser && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${member.fullName}`}
                            disabled={isRemovingThis}
                            onPress={() => handleRemoveMember(member)}
                            hitSlop={10}
                            style={styles.removeMemberBtn}>
                            {isRemovingThis ? (
                              <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            )}
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Add Members Sub-Modal */}
      <Modal
        visible={addMembersModalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setAddMembersModalVisible(false)}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel adding members"
              onPress={() => setAddMembersModalVisible(false)}
              hitSlop={12}
              style={styles.modalBackBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Add Members</Text>
            <Pressable
              disabled={selectedUserIdsToAdd.length === 0 || addingMembers}
              onPress={handleAddMembersSubmit}
              style={[
                styles.addSubmitBtn,
                selectedUserIdsToAdd.length > 0 && styles.addSubmitBtnActive,
              ]}>
              {addingMembers ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.addSubmitBtnText,
                    selectedUserIdsToAdd.length > 0 && styles.addSubmitBtnTextActive,
                  ]}>
                  Add ({selectedUserIdsToAdd.length})
                </Text>
              )}
            </Pressable>
          </View>

          {/* Search bar inside Add Members */}
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={isDark ? '#64748B' : Colors.text.secondary} style={{ marginRight: 10 }} />
              <TextInput
                value={memberSearchQuery}
                onChangeText={handleSearchUsers}
                placeholder="Search campus members..."
                placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
                style={styles.searchInput}
              />
              {memberSearchQuery.length > 0 && (
                <Pressable onPress={() => handleSearchUsers('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          {searchingMembers ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : availableUsersToAdd.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="people-outline" size={48} color="#64748B" />
              <Text style={styles.emptyAddTitle}>No new members found</Text>
              <Text style={styles.emptyAddSub}>
                All matching campus members are already part of this group.
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableUsersToAdd}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const selected = selectedUserIdsToAdd.includes(item.userId);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleSelectUserToAdd(item.userId)}
                    style={[styles.addUserRow, selected && styles.addUserRowSelected]}>
                    <View style={styles.modalMemberAvatar}>
                      <Text style={styles.modalMemberAvatarText}>{item.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalMemberName}>{item.fullName}</Text>
                      <Text style={styles.modalMemberSub}>
                        {item.usn ? `${item.usn} · ` : ''}
                        {item.department || item.role}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selected ? '#2563EB' : '#64748B'}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: Colors.background.canvas,
    },
    headerBackBtn: {
      padding: 4,
    },
    headerRecipientRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
      marginRight: 8,
    },
    headerAvatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#155E75' : '#0284C7',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginRight: 10,
    },
    headerGroupAvatarCircle: {
      backgroundColor: '#2563EB',
    },
    headerTextBox: {
      flex: 1,
    },
    headerGroupSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginTop: 1,
    },
    headerAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
    },
    headerAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#FFFFFF',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      flex: 1,
    },
    headerActionBtn: {
      padding: 4,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyAvatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    emptyAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
    },
    emptyAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 26,
      color: '#FFFFFF',
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 8,
    },
    emptyHint: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginTop: 4,
    },

    // Messages
    messageListContent: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    messageRow: {
      flexDirection: 'row',
      marginVertical: 4,
      width: '100%',
    },
    messageRowMine: {
      justifyContent: 'flex-end',
    },
    messageRowTheirs: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
    },
    bubbleMine: {
      backgroundColor: '#2563EB', // Electric Brand Blue
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 4,
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    bubbleText: {
      fontFamily: Typography.regular,
      fontSize: 15,
      lineHeight: 21,
    },
    bubbleTextMine: {
      color: '#FFFFFF',
    },
    bubbleTextTheirs: {
      color: Colors.text.primary,
    },
    bubbleTime: {
      fontFamily: Typography.regular,
      fontSize: 11,
      marginTop: 4,
    },
    bubbleTimeMine: {
      color: 'rgba(255, 255, 255, 0.75)',
      textAlign: 'right',
    },
    bubbleTimeTheirs: {
      color: Colors.text.tertiary,
      textAlign: 'left',
    },

    // Bottom Composer
    composerContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: isDark ? '#080B11' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    inputField: {
      flex: 1,
      minHeight: 46,
      maxHeight: 110,
      backgroundColor: isDark ? '#111827' : '#F1F5F9',
      borderRadius: 26,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      color: Colors.text.primary,
      fontFamily: Typography.regular,
      fontSize: 15,
    },
    sendCircleBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendCircleBtnActive: {
      backgroundColor: '#2563EB',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 6,
    },
    charCounter: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.tertiary,
      marginLeft: 18,
      marginTop: 4,
    },

    // Group message bubbles
    groupSenderAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
      alignSelf: 'flex-end',
      marginBottom: 4,
    },
    groupSenderAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#FFFFFF',
    },
    groupSenderName: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginBottom: 2,
    },

    // Group Info Modal styles
    modalScreen: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: Colors.background.canvas,
    },
    modalBackBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalHeaderTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 17,
      color: Colors.text.primary,
    },
    modalContent: {
      padding: 16,
      paddingBottom: 40,
    },
    groupInfoHero: {
      alignItems: 'center',
      paddingVertical: 24,
      borderRadius: 20,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 16,
      paddingHorizontal: 16,
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    groupHeroAvatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 4,
    },
    groupHeroTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      color: Colors.text.primary,
      textAlign: 'center',
    },
    editNamePencilBtn: {
      padding: 6,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
    },
    editNameContainer: {
      width: '100%',
      alignItems: 'center',
      marginVertical: 6,
    },
    editNameInput: {
      width: '90%',
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? '#111827' : '#F1F5F9',
      borderWidth: 1.5,
      borderColor: '#2563EB',
      paddingHorizontal: 14,
      color: Colors.text.primary,
      fontFamily: Typography.semiBold,
      fontSize: 16,
      textAlign: 'center',
    },
    editNameActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
    },
    editNameCancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      gap: 4,
    },
    editNameCancelText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    editNameSaveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      gap: 4,
    },
    editNameSaveText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    groupHeroSub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    membersListCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    membersCardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    membersListTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
      letterSpacing: 0.6,
    },
    addMembersPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    addMembersPillText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    modalMemberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    modalMemberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#155E75' : '#0284C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    modalMemberAvatarText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    modalMemberName: {
      fontFamily: Typography.medium,
      fontSize: 15,
      color: Colors.text.primary,
    },
    youBadge: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    youBadgeText: {
      fontFamily: Typography.semiBold,
      fontSize: 10,
      color: '#FFFFFF',
    },
    modalMemberSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    removeMemberBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },

    // Add Members Sub-Modal Styles
    addSubmitBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    addSubmitBtnActive: {
      backgroundColor: '#2563EB',
    },
    addSubmitBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.tertiary,
    },
    addSubmitBtnTextActive: {
      color: '#FFFFFF',
    },
    searchBarWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 14,
      height: 46,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    addUserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 8,
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    addUserRowSelected: {
      borderColor: '#2563EB',
      backgroundColor: isDark ? '#16223D' : '#EFF6FF',
    },
    emptyAddTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: Colors.text.primary,
      marginTop: 12,
      marginBottom: 4,
    },
    emptyAddSub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
      maxWidth: 260,
    },
  });
}
