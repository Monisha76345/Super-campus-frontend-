import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { openTab } from '@/features/campus/navigation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/theme/app-theme';
import { profilePhotoUri } from '@/features/profile/api/profile-api';
import { fetchThreadsApi, searchUsersApi, startDirectChatApi } from './chat-api';
import { ChatDetailScreen } from './ChatDetailScreen';
import { ChatThread, ParticipantSummary, SearchUser } from './types';

export function InboxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipientId?: string; recipientName?: string }>();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const token = user?.token;
  const tenantId = user?.tenantId;

  // Active chat state
  const [activeThread, setActiveThread] = useState<{
    id: string;
    recipient: ParticipantSummary;
  } | null>(null);

  // Auto-open chat if navigated with recipientId
  useEffect(() => {
    if (!token || !tenantId || !params.recipientId) return;
    const recipientId = params.recipientId;
    const recipientName = params.recipientName || 'Member';

    (async () => {
      try {
        const thread = await startDirectChatApi(token, tenantId, recipientId);
        setActiveThread({
          id: thread.id,
          recipient: thread.recipient || {
            userId: recipientId,
            fullName: recipientName,
            initials: recipientName.slice(0, 2).toUpperCase(),
            role: 'Student',
          },
        });
      } catch (err) {
        console.warn('Failed to auto-open direct chat thread:', err);
      }
    })();
  }, [params.recipientId, params.recipientName, token, tenantId]);

  // Thread list state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

  const loadThreadsAndSuggestions = useCallback(async () => {
    if (!token || !tenantId) return;
    try {
      const [threadsData, directoryData] = await Promise.all([
        fetchThreadsApi(token, tenantId).catch(() => [] as ChatThread[]),
        searchUsersApi(token, tenantId, '').catch(() => [] as SearchUser[]),
      ]);
      setThreads(threadsData);
      setSuggestedUsers(directoryData);
    } catch (err) {
      console.warn('Failed to fetch inbox data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    loadThreadsAndSuggestions();
  }, [loadThreadsAndSuggestions]);

  // Live search users by Name or USN
  useEffect(() => {
    if (!token || !tenantId) return;
    const clean = searchQuery.trim();
    if (!clean) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await searchUsersApi(token, tenantId, clean);
        setSearchResults(results);
      } catch (err) {
        console.warn('Failed to search users:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token, tenantId]);

  const activeThreads = useMemo(() => {
    return threads.filter((t) => t.lastMessageText && t.lastMessageText.trim().length > 0);
  }, [threads]);

  const handleStartChatWithUser = async (targetUser: SearchUser) => {
    if (!token || !tenantId) return;
    setStartingChatUserId(targetUser.userId);
    try {
      const thread = await startDirectChatApi(token, tenantId, targetUser.userId);
      setSearchQuery('');
      setSearchResults([]);
      setActiveThread({
        id: thread.id,
        recipient: {
          userId: targetUser.userId,
          fullName: targetUser.fullName,
          usn: targetUser.usn,
          role: targetUser.role,
          initials: targetUser.initials,
          department: targetUser.department,
          photoKey: targetUser.photoKey,
        },
      });
      loadThreadsAndSuggestions();
    } catch (err) {
      console.warn('Failed to start chat:', err);
    } finally {
      setStartingChatUserId(null);
    }
  };

  const handleOpenThread = (thread: ChatThread) => {
    setActiveThread({
      id: thread.id,
      recipient: thread.recipient,
    });
  };

  // If a chat conversation is currently open, show ChatDetailScreen (Image 2)
  if (activeThread && token && tenantId) {
    return (
      <ChatDetailScreen
        threadId={activeThread.id}
        recipient={activeThread.recipient}
        token={token}
        tenantId={tenantId}
        onBack={() => {
          setActiveThread(null);
          loadThreadsAndSuggestions();
        }}
      />
    );
  }

  const renderThreadCard = ({ item }: { item: ChatThread }) => {
    const subtitle = item.lastMessageText
      ? item.lastMessageText
      : 'No messages yet';
    const photoUri = profilePhotoUri(item.recipient.photoKey ?? null);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => handleOpenThread(item)}
        style={({ pressed }) => [styles.threadCard, pressed && styles.threadCardPressed]}>
        {/* Left circular avatar with image or initial */}
        <View style={styles.avatarCircle}>
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
              style={styles.avatarImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.avatarText}>{item.recipient.initials}</Text>
          )}
        </View>

        {/* Center Name & Last message snippet */}
        <View style={styles.threadInfo}>
          <Text style={styles.recipientName} numberOfLines={1}>
            {item.recipient.fullName}
          </Text>
          <Text style={styles.lastMessageText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right date timestamp matching Image 1 */}
        {item.formattedDate ? (
          <Text style={styles.dateText}>{item.formattedDate}</Text>
        ) : null}
      </Pressable>
    );
  };

  const renderSearchResultItem = ({ item }: { item: SearchUser }) => {
    const isStarting = startingChatUserId === item.userId;
    const photoUri = profilePhotoUri(item.photoKey ?? null);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => handleStartChatWithUser(item)}
        style={({ pressed }) => [styles.searchResultCard, pressed && styles.threadCardPressed]}>
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#0E7490' : '#0284C7' }]}>
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
              style={styles.avatarImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.avatarText}>{item.initials}</Text>
          )}
        </View>
        <View style={styles.threadInfo}>
          <Text style={styles.recipientName} numberOfLines={1}>
            {item.fullName}
          </Text>
          <Text style={styles.searchUserMeta} numberOfLines={1}>
            {item.usn ? `${item.usn} · ` : ''}{item.department || item.role}
          </Text>
        </View>
        <View style={styles.chatActionBtn}>
          {isStarting ? (
            <ActivityIndicator size="small" color={isDark ? '#38BDF8' : Colors.primary.accent} />
          ) : (
            <Ionicons name="chatbubble-ellipses" size={20} color={isDark ? '#38BDF8' : Colors.primary.accent} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header matching Image 1: "Messages" with Refresh button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh messages"
          onPress={() => {
            setRefreshing(true);
            loadThreadsAndSuggestions();
          }}
          hitSlop={12}
          style={styles.headerActionBtn}>
          <Ionicons name="refresh" size={22} color={isDark ? '#F8FAFC' : Colors.text.primary} />
        </Pressable>
      </View>

      {/* Campus Directory Search Bar (Search by Name or USN to chat with anyone) */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color={isDark ? '#64748B' : Colors.text.secondary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Name or USN to chat..."
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

      {/* Main Content: Search Results or Conversation Threads List */}
      {searchQuery.trim().length > 0 ? (
        <View style={styles.searchSection}>
          <Text style={styles.sectionHeaderLabel}>
            {searching ? 'Searching campus members...' : `Campus members (${searchResults.length})`}
          </Text>
          {searching ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={isDark ? '#38BDF8' : Colors.primary.accent} />
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No student or staff found for "{searchQuery}".</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.userId}
              renderItem={renderSearchResultItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      ) : loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={isDark ? '#38BDF8' : Colors.primary.accent} />
        </View>
      ) : activeThreads.length === 0 ? (
        <View style={{ flex: 1 }}>
          <View style={styles.emptyHeaderBox}>
            <Ionicons name="chatbubbles-outline" size={48} color={isDark ? '#334155' : '#94A3B8'} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap any campus member below or search above by Name or USN to start chatting!
            </Text>
          </View>
          {suggestedUsers.length > 0 && (
            <>
              <Text style={styles.sectionHeaderLabel}>Campus members ({suggestedUsers.length})</Text>
              <FlatList
                data={suggestedUsers}
                keyExtractor={(item) => item.userId}
                renderItem={renderSearchResultItem}
                contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={loadThreadsAndSuggestions}
                    tintColor={isDark ? '#38BDF8' : Colors.primary.accent}
                    colors={[isDark ? '#38BDF8' : Colors.primary.accent]}
                  />
                }
              />
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={activeThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadThreadsAndSuggestions}
              tintColor={isDark ? '#38BDF8' : Colors.primary.accent}
              colors={[isDark ? '#38BDF8' : Colors.primary.accent]}
            />
          }
        />
      )}

      {/* Floating Frosted Bottom Navigation Bar with 'Inbox' Active */}
      <HomeBottomTabs
        activeTab="community"
        onTabChange={(tab) => openTab(router, tab)}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? '#0A0F1D' : Colors.background.canvas,
    },
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 4,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 26,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : Colors.text.primary,
    },
    headerActionBtn: {
      padding: 6,
    },

    // Search bar
    searchBarWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#121826' : Colors.background.surface,
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : Colors.border.card,
      paddingHorizontal: 14,
      height: 48,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
    },
    searchSection: {
      flex: 1,
    },
    sectionHeaderLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      marginHorizontal: 18,
      marginBottom: 8,
      marginTop: 4,
    },

    // List & cards matching Image 1
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
      gap: 12,
    },
    threadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#121826' : Colors.background.surface, // Exact dark slate rounded container from Image 1 / adaptive surface in light
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : Colors.border.subtle,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 8,
      elevation: isDark ? 0 : 2,
    },
    threadCardPressed: {
      opacity: 0.82,
      backgroundColor: isDark ? '#161F32' : Colors.background.surfaceHover,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? '#155E75' : '#0284C7', // Dark electric teal circular avatar from reference Image 1 / vibrant ocean in light
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 26,
    },
    avatarText: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: '#FFFFFF',
    },
    threadInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    recipientName: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
      marginBottom: 3,
    },
    lastMessageText: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
    },
    dateText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      marginLeft: 8,
    },

    // Search Results Card
    searchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#121826' : Colors.background.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(49, 52, 145, 0.12)',
      marginBottom: 10,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    searchUserMeta: {
      fontFamily: Typography.regular,
      fontSize: 12.5,
      color: isDark ? '#38BDF8' : Colors.primary.accent,
      marginTop: 2,
    },
    chatActionBtn: {
      padding: 6,
    },

    // Empty state
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      marginTop: 60,
    },
    emptyHeaderBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 20,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 19,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: isDark ? '#64748B' : Colors.text.secondary,
    },
  });
}
