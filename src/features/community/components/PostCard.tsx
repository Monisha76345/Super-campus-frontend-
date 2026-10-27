import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { CommunityPost } from '../types/community-types';
import { PostVideoPlayer } from './PostVideoPlayer';

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  isAdmin?: boolean;
  onLike: (postId: string) => void;
  onCommentPress: (post: CommunityPost) => void;
  onSharePress?: (post: CommunityPost) => void;
  onDeletePress?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  onLike,
  onCommentPress,
  onSharePress,
  onDeletePress,
}: PostCardProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const isAuthor = currentUserId && post.authorId === currentUserId;
  const canManage = isAuthor || isAdmin;

  // Double tap to like handling & animation
  const lastTapRef = useRef<number>(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const triggerDoubleTapHeart = () => {
    // Like the post if not already liked
    if (!post.isLikedByMe) {
      onLike(post.id);
    }

    heartScale.setValue(0.4);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.35,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleCardPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerDoubleTapHeart();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Helper to test if attachment is a video
  const isVideoUrl = (url: string) => {
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url) || url.includes('/video/');
  };

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

  // Format author display
  const authorInfo = useMemo(() => {
    const rawName = post.authorName || 'Campus Member';
    const rawHandle = post.authorHandle;

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
      ? rawHandle.startsWith('@')
        ? rawHandle
        : `@${rawHandle}`
      : `@${rawName.toLowerCase().replace(/\s+/g, '')}`;

    return {
      displayName: rawName,
      handle: cleanHandle,
      initial: rawName.charAt(0).toUpperCase(),
    };
  }, [post.authorName, post.authorHandle]);

  return (
    <Pressable onPress={handleCardPress} style={styles.card}>
      {/* Animated Floating Double-Tap Heart Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.doubleTapHeartContainer,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}>
        <Ionicons name="heart" size={84} color="#EC4899" />
      </Animated.View>

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

        {/* Action icons for author/admin: Delete */}
        {canManage && (
          <View style={styles.manageActions}>
            {onDeletePress && (
              <Pressable
                onPress={() => onDeletePress(post.id)}
                hitSlop={8}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Post Text Content */}
      {post.content ? <Text style={styles.contentBody}>{post.content}</Text> : null}

      {/* Media Attachments Gallery (Images or Videos) */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.mediaUrls.map((url, idx) => {
            if (isVideoUrl(url)) {
              return <PostVideoPlayer key={url + idx} uri={url} />;
            }

            return (
              <View key={url + idx} style={styles.imageFrame}>
                <Image
                  source={{ uri: url }}
                  style={styles.postImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* Interaction Footer: Likes, Comments & Share */}
      <View style={styles.footerRow}>
        {/* Like Button */}
        <Pressable
          onPress={() => onLike(post.id)}
          hitSlop={8}
          style={({ pressed }) => [styles.interactionButton, pressed && styles.pressed]}>
          <Ionicons
            name={post.isLikedByMe ? 'heart' : 'heart-outline'}
            size={19}
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
          <Text style={styles.interactionText}>{post.commentCount}</Text>
        </Pressable>

        {/* Share Button */}
        <Pressable
          onPress={() => onSharePress?.(post)}
          hitSlop={8}
          style={({ pressed }) => [styles.interactionButton, pressed && styles.pressed]}>
          <Ionicons name="share-social-outline" size={18} color="#818CF8" />
          <Text style={styles.interactionText}>Share</Text>
        </Pressable>
      </View>
    </Pressable>
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
      position: 'relative',
    },
    doubleTapHeartContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 16,
      color: isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    authorColumn: {
      flex: 1,
    },
    authorName: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    authorHandleAndDate: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    campusTag: {
      fontFamily: Typography.medium,
      fontSize: 10,
      color: isDark ? '#38BDF8' : '#2563EB',
      marginTop: 2,
      letterSpacing: 0.3,
    },
    manageActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
    },
    contentBody: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: Colors.text.primary,
      marginBottom: 12,
    },
    mediaContainer: {
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 12,
      gap: 8,
    },
    imageFrame: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.05)',
      gap: 20,
    },
    interactionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    interactionText: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: isDark ? '#94A3B8' : '#64748B',
      fontWeight: '600',
    },
    likedText: {
      color: '#EC4899',
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
