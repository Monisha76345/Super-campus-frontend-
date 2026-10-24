import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { CommunityPost } from '../types/community-types';

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  isAdmin?: boolean;
  onLike: (postId: string) => void;
  onCommentPress: (post: CommunityPost) => void;
  onDeletePress?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  onLike,
  onCommentPress,
  onDeletePress,
}: PostCardProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const isAuthor = currentUserId && post.authorId === currentUserId;
  const canManage = isAuthor || isAdmin;

  // Format date: e.g. Aug 25, 2026
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  // Format author display: show Name as title, login ID / handle below it, and proper initial
  const authorInfo = useMemo(() => {
    const rawName = post.authorName || 'Campus Member';
    const rawHandle = post.authorHandle;

    // Check if rawName is formatted like USN.name e.g. "1nt22ec012.kavya"
    const dotIndex = rawName.indexOf('.');
    const usnPattern = /^[0-9][a-zA-Z]{2}[0-9]{2}/i;

    if (dotIndex > 0 && usnPattern.test(rawName.slice(0, dotIndex))) {
      const namePart = rawName.slice(dotIndex + 1);
      const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const handle = rawHandle || `@${rawName.toLowerCase()}`;
      return {
        displayName: cleanName,
        handle,
        initial: cleanName.charAt(0).toUpperCase(),
      };
    }

    const cleanHandle = rawHandle
      ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
      : `@${rawName.toLowerCase().replace(/\s+/g, '')}`;

    return {
      displayName: rawName,
      handle: cleanHandle,
      initial: rawName.charAt(0).toUpperCase(),
    };
  }, [post.authorName, post.authorHandle]);

  return (
    <View style={styles.card}>
      {/* Author Header */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{authorInfo.initial}</Text>
        </View>

        <View style={styles.authorColumn}>
          <Text style={styles.authorName}>{authorInfo.displayName}</Text>
          <Text style={styles.authorHandleAndDate}>
            {authorInfo.handle} · {formatDate(post.createdAt)}
          </Text>
          <Text style={styles.campusTag}>
            {post.campusId?.toUpperCase()} Main Campus
          </Text>
        </View>

        {/* Action icons for author/admin: Edit & Delete */}
        {canManage && (
          <View style={styles.manageActions}>
            {onDeletePress && (
              <Pressable
                onPress={() => onDeletePress(post.id)}
                hitSlop={6}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <Ionicons name="trash-outline" size={17} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Post Text Content */}
      {post.content ? <Text style={styles.contentBody}>{post.content}</Text> : null}

      {/* Media Attachments Gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.mediaUrls.map((url, idx) => (
            <View key={url + idx} style={styles.imageFrame}>
              <Image
                source={{ uri: url }}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          ))}
        </View>
      )}

      {/* Interaction Footer: Likes & Comments */}
      <View style={styles.footerRow}>
        {/* Like Button */}
        <Pressable
          onPress={() => onLike(post.id)}
          hitSlop={8}
          style={({ pressed }) => [styles.interactionButton, pressed && styles.pressed]}>
          <Ionicons
            name={post.isLikedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.isLikedByMe ? '#EC4899' : '#818CF8'}
          />
          <Text
            style={[
              styles.interactionText,
              post.isLikedByMe && styles.likedText,
            ]}>
            {post.likeCount}
          </Text>
        </Pressable>

        {/* Comment Button */}
        <Pressable
          onPress={() => onCommentPress(post)}
          hitSlop={8}
          style={({ pressed }) => [styles.interactionButton, pressed && styles.pressed]}>
          <Ionicons name="chatbubble-outline" size={17} color="#818CF8" />
          <Text style={styles.interactionText}>{post.commentCount} comments</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    avatarCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#083344' : 'rgba(6, 182, 212, 0.12)',
      borderWidth: 1.2,
      borderColor: isDark ? '#06B6D4' : '#0891B2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#38BDF8' : '#0891B2',
    },
    authorColumn: {
      flex: 1,
    },
    authorName: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    authorHandleAndDate: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    campusTag: {
      fontFamily: Typography.medium,
      fontSize: 10,
      color: Colors.text.tertiary,
      letterSpacing: 0.2,
      marginTop: 2,
    },
    manageActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    iconBtn: {
      padding: 4,
    },
    contentBody: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.primary,
      marginBottom: 12,
    },
    mediaContainer: {
      gap: 8,
      marginBottom: 12,
    },
    imageFrame: {
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: isDark ? '#090D16' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    postImage: {
      width: '100%',
      height: 220,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.06)',
    },
    interactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    interactionText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    likedText: {
      color: '#EC4899',
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
