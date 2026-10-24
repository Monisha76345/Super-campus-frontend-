import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { CommunityPost, PostComment } from '../types/community-types';

interface CommentsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => Promise<boolean>;
}

export function CommentsModal({
  visible,
  post,
  onClose,
  onAddComment,
}: CommentsModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible || !post) return null;

  const handleSend = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const success = await onAddComment(post.id, commentText.trim());
    if (success) {
      setCommentText('');
    }
    setSubmitting(false);
  };

  const renderComment = ({ item }: { item: PostComment }) => {
    let displayName = item.authorName || 'Campus Member';
    const dotIndex = displayName.indexOf('.');
    if (dotIndex > 0 && /^[0-9][a-zA-Z]{2}[0-9]{2}/i.test(displayName.slice(0, dotIndex))) {
      const raw = displayName.slice(dotIndex + 1);
      displayName = raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{initial}</Text>
        </View>
        <View style={styles.commentBubble}>
          <View style={styles.commentAuthorRow}>
            <Text style={styles.commentAuthorName}>{displayName}</Text>
            <Text style={styles.commentRoleTag}>{item.authorRole || 'STUDENT'}</Text>
          </View>
          <Text style={styles.commentContentText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.dragPill} />
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                Comments ({post.comments?.length || 0})
              </Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>
          </View>

          {/* Comments List */}
          <FlatList
            data={post.comments || []}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={32} color="#475569" />
                <Text style={styles.emptyText}>No comments yet.</Text>
                <Text style={styles.emptySubText}>Be the first to share your thoughts!</Text>
              </View>
            }
          />

          {/* Comment Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#64748B"
              style={styles.inputField}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!commentText.trim() || submitting}
              style={[
                styles.sendBtn,
                (!commentText.trim() || submitting) && styles.sendBtnDisabled,
              ]}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      minHeight: '50%',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    },
    modalHeader: {
      alignItems: 'center',
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    dragPill: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.15)',
      marginBottom: 10,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    closeBtn: {
      padding: 4,
    },
    listContent: {
      padding: 16,
      gap: 14,
    },
    commentItem: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    commentAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.08)',
    },
    commentAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    commentBubble: {
      flex: 1,
      backgroundColor: isDark ? '#090D16' : '#F8FAFC',
      borderRadius: 14,
      padding: 10,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    commentAuthorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3,
    },
    commentAuthorName: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.primary,
    },
    commentRoleTag: {
      fontFamily: Typography.medium,
      fontSize: 9.5,
      color: isDark ? '#38BDF8' : Colors.primary.main,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(49, 52, 145, 0.08)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    commentContentText: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.primary,
      lineHeight: 18,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 6,
    },
    emptyText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.primary,
    },
    emptySubText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    inputField: {
      flex: 1,
      backgroundColor: isDark ? '#090D16' : '#F1F5F9',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      color: Colors.text.primary,
      fontSize: 13.5,
      maxHeight: 80,
    },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#2563EB' : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      opacity: 0.5,
    },
  });
}
