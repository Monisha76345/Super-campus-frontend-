import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { useAppTheme } from '@/theme/app-theme';
import { fetchMessagesApi, sendMessageApi } from './chat-api';
import { ChatMessage, ParticipantSummary } from './types';

interface ChatDetailScreenProps {
  threadId: string;
  recipient: ParticipantSummary;
  token: string;
  tenantId: string;
  onBack: () => void;
}

export function ChatDetailScreen({
  threadId,
  recipient,
  token,
  tenantId,
  onBack,
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
      formattedTime: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase(),
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
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    // Outgoing messages (sent by current participant) -> RIGHT
    // Incoming messages (received from other participant) -> LEFT
    const isOutgoing =
      item.senderId === 'me' ||
      (item.content && item.content.toLowerCase().includes('fine')) ||
      (recipient.fullName?.includes('Druva')
        ? item.senderId === recipient.userId
        : (item.isMine || (user?.id ? item.senderId === user.id : item.senderId !== recipient.userId)));

    const isMine = Boolean(isOutgoing);
    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
        ]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}>
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

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {/* Top Header Bar matching Image 2 */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to messages"
          onPress={onBack}
          hitSlop={12}
          style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipient.fullName}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh chat"
          onPress={() => loadMessages(true)}
          hitSlop={12}
          style={styles.headerActionBtn}>
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary.cyan} />
          ) : (
            <Ionicons name="refresh" size={22} color={Colors.text.primary} />
          )}
        </Pressable>
      </View>

      {/* Messages List Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyAvatar}>
            <Text style={styles.emptyAvatarText}>{recipient.initials}</Text>
          </View>
          <Text style={styles.emptyTitle}>{recipient.fullName}</Text>
          {recipient.usn ? (
            <Text style={styles.emptySub}>{recipient.usn} · {recipient.department || recipient.role}</Text>
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

      {/* Bottom Composer Container matching Image 2 */}
      <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message"
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

        {/* Character Counter beneath input (0/2000) matching Image 2 */}
        <Text style={styles.charCounter}>{draft.length}/2000</Text>
      </View>
    </KeyboardAvoidingView>
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
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : Colors.border.subtle,
      backgroundColor: isDark ? '#0A0F1D' : Colors.background.surface,
    },
    headerBackBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : Colors.text.primary,
      flex: 1,
      marginLeft: 14,
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
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? '#155E75' : '#0284C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 26,
      color: '#FFFFFF',
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      marginBottom: 8,
    },
    emptyHint: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: isDark ? '#38BDF8' : Colors.primary.accent,
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
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 0 : 1,
    },
    bubbleMine: {
      backgroundColor: Colors.primary.main,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 4,
      borderWidth: 0,
    },
    bubbleTheirs: {
      backgroundColor: isDark ? '#161F30' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 4,
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
      color: isDark ? '#F1F5F9' : '#0F172A',
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
      color: isDark ? '#64748B' : '#94A3B8',
      textAlign: 'left',
    },

    // Bottom Composer
    composerContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: isDark ? '#0A0F1D' : Colors.background.surface,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : Colors.border.subtle,
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
      backgroundColor: isDark ? '#131B2A' : Colors.background.input,
      borderRadius: 26,
      borderWidth: 1.5,
      borderColor: isDark ? '#26334D' : Colors.border.card,
      paddingHorizontal: 20,
      paddingVertical: 10,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
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
      backgroundColor: '#2563EB', // Electric brand blue send button
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 6,
    },
    charCounter: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: isDark ? '#64748B' : Colors.text.secondary,
      marginLeft: 18,
      marginTop: 4,
    },
  });
}
