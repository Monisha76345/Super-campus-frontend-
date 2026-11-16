import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
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

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { fetchThreadsApi, searchUsersApi, sendMessageApi, startDirectChatApi } from '@/features/chat/chat-api';
import { ChatThread, SearchUser } from '@/features/chat/types';
import { useAppTheme } from '@/theme/app-theme';
import { CommunityPost } from '../types/community-types';

interface SharePostModalProps {
  visible: boolean;
  onClose: () => void;
  post: CommunityPost | null;
  token?: string;
  tenantId?: string;
}

export function SharePostModal({
  visible,
  onClose,
  post,
  token = '',
  tenantId = '',
}: SharePostModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTargetId, setSendingTargetId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible && token && tenantId) {
      setLoadingThreads(true);
      fetchThreadsApi(token, tenantId)
        .then((data) => setThreads(data))
        .catch(() => setThreads([]))
        .finally(() => setLoadingThreads(false));
    }
  }, [visible, token, tenantId]);

  useEffect(() => {
    if (!searchQuery.trim() || !token || !tenantId) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsersApi(token, tenantId, searchQuery);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, token, tenantId]);

  if (!post) return null;

  const postShareUrl = `https://supercampus.io/posts/${post.id}`;
  const shareText = `Check out this campus post by ${post.authorName} on Supercampus:\n\n"${post.content?.slice(0, 160)}${
    (post.content?.length || 0) > 160 ? '...' : ''
  }"\n\n${postShareUrl}`;

  const handleExternalShare = async () => {
    try {
      await Share.share({
        title: `Post by ${post.authorName}`,
        message: shareText,
        url: postShareUrl,
      });
      onClose();
    } catch {
      // Ignored
    }
  };

  const handleSendToThread = async (threadId: string, threadName: string) => {
    if (sentMap[threadId]) return;
    setSendingTargetId(threadId);

    try {
      const messageBody = `📌 [Shared Post from ${post.authorName}]:\n${post.content || 'Attached media'}\n${
        post.mediaUrls && post.mediaUrls.length > 0 ? `\nMedia: ${post.mediaUrls[0]}` : ''
      }`;
      await sendMessageApi(token, tenantId, threadId, messageBody);
      setSentMap((prev) => ({ ...prev, [threadId]: true }));
      Alert.alert('Shared! 🚀', `Post shared to "${threadName}".`);
    } catch (err: any) {
      Alert.alert('Send Failed', err?.message || 'Could not send post to this conversation.');
    } finally {
      setSendingTargetId(null);
    }
  };

  const handleSendToUser = async (user: SearchUser) => {
    const targetUserId = user.userId || user.id || '';
    if (!targetUserId || sentMap[targetUserId]) return;
    setSendingTargetId(targetUserId);

    try {
      const thread = await startDirectChatApi(token, tenantId, targetUserId);
      const messageBody = `📌 [Shared Post from ${post.authorName}]:\n${post.content || 'Attached media'}\n${
        post.mediaUrls && post.mediaUrls.length > 0 ? `\nMedia: ${post.mediaUrls[0]}` : ''
      }`;
      await sendMessageApi(token, tenantId, thread.id, messageBody);
      setSentMap((prev) => ({ ...prev, [targetUserId]: true }));
      Alert.alert('Shared! 🚀', `Post sent to ${user.fullName}.`);
    } catch (err: any) {
      Alert.alert('Send Failed', err?.message || 'Could not send post to this user.');
    } finally {
      setSendingTargetId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Handle indicator */}
          <View style={styles.dragBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Share Post</Text>
              <Text style={styles.subtitle}>By {post.authorName}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* External App Share Option */}
          <Pressable
            style={({ pressed }) => [styles.externalShareCard, pressed && styles.pressed]}
            onPress={handleExternalShare}>
            <View style={styles.externalIconBox}>
              <Ionicons name="share-social-outline" size={20} color="#38BDF8" />
            </View>
            <View style={styles.externalTextWrapper}>
              <Text style={styles.externalTitle}>Share to other apps</Text>
              <Text style={styles.externalSubtitle}>WhatsApp, Instagram, Messages, or Copy Link</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* In-app Direct Sharing Section */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or send in Supercampus</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classmates or conversations..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.trim().length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Chat List / Search Results */}
          <ScrollView style={styles.threadScroll} showsVerticalScrollIndicator={false}>
            {searching || loadingThreads ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#38BDF8" />
                <Text style={styles.loadingText}>Loading campus peers...</Text>
              </View>
            ) : searchQuery.trim().length > 0 ? (
              searchResults.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No users found for &quot;{searchQuery}&quot;</Text>
                </View>
              ) : (
                searchResults.map((usr) => {
                  const targetId = usr.userId || usr.id || '';
                  const isSent = Boolean(sentMap[targetId]);
                  const isSending = sendingTargetId === targetId;
                  return (
                    <View key={targetId} style={styles.peerRow}>
                      <View style={styles.peerAvatar}>
                        <Text style={styles.peerAvatarText}>
                          {(usr.fullName || usr.initials || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.peerInfo}>
                        <Text style={styles.peerName} numberOfLines={1}>
                          {usr.fullName}
                        </Text>
                        <Text style={styles.peerHandle} numberOfLines={1}>
                          {usr.usn ? `${usr.usn} · ` : ''}{usr.role}
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.sendBtn,
                          isSent && styles.sentBtn,
                          pressed && styles.pressed,
                        ]}
                        disabled={isSent || isSending}
                        onPress={() => handleSendToUser(usr)}>
                        {isSending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.sendBtnText, isSent && styles.sentBtnText]}>
                            {isSent ? 'Sent ✓' : 'Send'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })
              )
            ) : threads.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="chatbubbles-outline" size={28} color="#64748B" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyText}>No active chat threads yet</Text>
                <Text style={styles.emptySubText}>Search for classmates above to send this post directly</Text>
              </View>
            ) : (
              threads.map((thread) => {
                const isSent = Boolean(sentMap[thread.id]);
                const isSending = sendingTargetId === thread.id;
                const isGroupThread = thread.type === 'GROUP';
                const title = isGroupThread
                  ? thread.name || 'Group Chat'
                  : thread.recipient?.fullName || 'Classmate';

                return (
                  <View key={thread.id} style={styles.peerRow}>
                    <View style={[styles.peerAvatar, isGroupThread && styles.groupAvatar]}>
                      {isGroupThread ? (
                        <Ionicons name="people" size={16} color="#38BDF8" />
                      ) : (
                        <Text style={styles.peerAvatarText}>{title.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.peerHandle} numberOfLines={1}>
                        {isGroupThread ? 'Group Conversation' : 'Direct Chat'}
                      </Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.sendBtn,
                        isSent && styles.sentBtn,
                        pressed && styles.pressed,
                      ]}
                      disabled={isSent || isSending}
                      onPress={() => handleSendToThread(thread.id, title)}>
                      {isSending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.sendBtnText, isSent && styles.sentBtnText]}>
                          {isSent ? 'Sent ✓' : 'Send'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(8, 11, 17, 0.7)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
      maxHeight: '82%',
    },
    dragBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#334155' : '#CBD5E1',
      alignSelf: 'center',
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 17,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    subtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    externalShareCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#E2E8F0',
      marginBottom: 14,
    },
    externalIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(37, 99, 235, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    externalTextWrapper: {
      flex: 1,
    },
    externalTitle: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    externalSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    dividerText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: Colors.text.tertiary,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? '#111827' : '#F1F5F9',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingHorizontal: 12,
      height: 42,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.primary,
    },
    threadScroll: {
      maxHeight: 280,
    },
    peerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F1F5F9',
    },
    peerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    groupAvatar: {
      backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#EDE9FE',
    },
    peerAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#38BDF8',
      fontWeight: '700',
    },
    peerInfo: {
      flex: 1,
    },
    peerName: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
    },
    peerHandle: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    sendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sentBtn: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
      borderWidth: 1,
      borderColor: '#10B981',
    },
    sendBtnText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    sentBtnText: {
      color: '#10B981',
    },
    centerLoading: {
      paddingVertical: 30,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    emptyBox: {
      paddingVertical: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
    emptySubText: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.tertiary,
      textAlign: 'center',
      marginTop: 4,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
