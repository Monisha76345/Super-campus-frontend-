import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useAppTheme } from '@/theme/app-theme';
import { profilePhotoUri } from '@/features/profile/api/profile-api';
import { createGroupChatApi, searchUsersApi } from './chat-api';
import { ChatThread, SearchUser } from './types';

interface CreateGroupModalProps {
  visible: boolean;
  token: string;
  tenantId: string;
  directoryUsers: SearchUser[];
  onClose: () => void;
  onGroupCreated: (thread: ChatThread) => void;
}

export function CreateGroupModal({
  visible,
  token,
  tenantId,
  directoryUsers,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (visible) {
      setGroupName('');
      setSearchQuery('');
      setSelectedUsers([]);
      setSearchResults([]);
      setErrorMessage(null);
    }
  }, [visible]);

  // Search members live debounce
  useEffect(() => {
    const clean = searchQuery.trim();
    if (!clean) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsersApi(token, tenantId, clean);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search members error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, token, tenantId]);

  const displayedUsers = searchQuery.trim().length > 0 ? searchResults : directoryUsers;

  const toggleSelectUser = (user: SearchUser) => {
    setErrorMessage(null);
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.userId === user.userId);
      if (exists) {
        return prev.filter((u) => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId));
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setErrorMessage('Please select at least 1 member to add to the group');
      return;
    }

    setCreating(true);
    setErrorMessage(null);
    try {
      const memberUserIds = selectedUsers.map((u) => u.userId);
      const newThread = await createGroupChatApi(token, tenantId, trimmedName, memberUserIds);
      onGroupCreated(newThread);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderMemberItem = ({ item }: { item: SearchUser }) => {
    const isSelected = selectedUsers.some((u) => u.userId === item.userId);
    const photoUri = profilePhotoUri(item.photoKey ?? null);

    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={() => toggleSelectUser(item)}
        style={({ pressed }) => [
          styles.memberCard,
          isSelected && styles.memberCardSelected,
          pressed && styles.memberCardPressed,
        ]}>
        <View style={styles.avatarCircle}>
          {photoUri ? (
            <Image
              source={{
                uri: photoUri,
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Tenant-Id': tenantId || 'nmit',
                },
              }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.avatarText}>{item.initials}</Text>
          )}
        </View>

        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.fullName}
          </Text>
          <Text style={styles.memberSubtitle} numberOfLines={1}>
            {item.usn ? `${item.usn} · ` : ''}
            {item.department || item.role}
          </Text>
        </View>

        <View
          style={[
            styles.checkboxCircle,
            isSelected && styles.checkboxCircleSelected,
          ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            hitSlop={12}
            style={styles.headerActionBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>New Group</Text>
            <Text style={styles.headerSubtitle}>
              {selectedUsers.length} member{selectedUsers.length === 1 ? '' : 's'} selected
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create group"
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            onPress={handleCreateGroup}
            style={[
              styles.createBtn,
              (!groupName.trim() || selectedUsers.length === 0 || creating) && styles.createBtnDisabled,
            ]}>
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createBtnText}>Create</Text>
            )}
          </Pressable>
        </View>

        {/* Group Name Input & Avatar Icon */}
        <View style={styles.groupInputSection}>
          <View style={styles.groupAvatarCircle}>
            <Ionicons name="people" size={26} color="#FFFFFF" />
          </View>
          <TextInput
            value={groupName}
            onChangeText={(text) => {
              setGroupName(text);
              setErrorMessage(null);
            }}
            placeholder="Group name (e.g. Study Group, Project Team)"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            maxLength={60}
            style={styles.groupNameInput}
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Selected Members Chip Tray */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedTrayWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedTrayContent}>
              {selectedUsers.map((u) => (
                <View key={u.userId} style={styles.chip}>
                  <View style={styles.chipAvatar}>
                    <Text style={styles.chipAvatarText}>{u.initials.slice(0, 2)}</Text>
                  </View>
                  <Text style={styles.chipName} numberOfLines={1}>
                    {u.fullName.split(' ')[0]}
                  </Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => removeSelectedUser(u.userId)}
                    style={styles.chipRemoveBtn}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Members */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color={isDark ? '#64748B' : Colors.text.secondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search members to add..."
              placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
              autoCorrect={false}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={isDark ? '#94A3B8' : Colors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim().length > 0
              ? `Results (${displayedUsers.length})`
              : `Suggested members (${displayedUsers.length})`}
          </Text>

          {searching ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={Colors.primary.main} />
            </View>
          ) : displayedUsers.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          ) : (
            <FlatList
              data={displayedUsers}
              keyExtractor={(item) => item.userId}
              renderItem={renderMemberItem}
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: Colors.background.canvas,
    },
    headerActionBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleBox: {
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 17,
      color: Colors.text.primary,
    },
    headerSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    createBtn: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      minWidth: 70,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createBtnDisabled: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      opacity: 0.6,
    },
    createBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },
    groupInputSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    groupAvatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    groupNameInput: {
      flex: 1,
      fontFamily: Typography.medium,
      fontSize: 15,
      color: Colors.text.primary,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    errorText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#EF4444',
      flex: 1,
    },
    selectedTrayWrapper: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      backgroundColor: Colors.background.canvas,
    },
    selectedTrayContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      borderRadius: 20,
      paddingVertical: 4,
      paddingLeft: 4,
      paddingRight: 8,
    },
    chipAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    chipAvatarText: {
      fontFamily: Typography.semiBold,
      fontSize: 10,
      color: '#FFFFFF',
    },
    chipName: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.primary,
      marginRight: 6,
      maxWidth: 90,
    },
    chipRemoveBtn: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: isDark ? '#475569' : '#94A3B8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBarWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    membersSection: {
      flex: 1,
      paddingTop: 4,
    },
    sectionTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 6,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    memberCardSelected: {
      borderColor: '#2563EB',
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)',
    },
    memberCardPressed: {
      opacity: 0.85,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    avatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginRight: 12,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontFamily: Typography.semiBold,
      fontSize: 15,
      color: '#FFFFFF',
    },
    memberInfo: {
      flex: 1,
      marginRight: 8,
    },
    memberName: {
      fontFamily: Typography.medium,
      fontSize: 15,
      color: Colors.text.primary,
    },
    memberSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    checkboxCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? '#475569' : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxCircleSelected: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyText: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.tertiary,
    },
  });
}
