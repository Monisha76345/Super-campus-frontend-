import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useRef, useState } from 'react';
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

  const [isExpanded, setIsExpanded] = useState(false);

  const isAuthor = currentUserId && post.authorId === currentUserId;
  const canManage = isAuthor || isAdmin;

  // Double tap to like handling & animation
  const lastTapRef = useRef<number>(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const triggerDoubleTapHeart = () => {
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

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url) || url.includes('/video/') || url.includes('type=video') || url.includes('ext=.mp4') || url.includes('.mp4') || url.includes('.mov');
  };

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

  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const contentIsLong = post.content && post.content.length > 90;
  const displayedContent =
    contentIsLong && !isExpanded ? `${post.content.slice(0, 90)}...` : post.content;

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
        <Ionicons name="heart" size={88} color="#EC4899" />
      </Animated.View>

      {/* 1. Instagram-Style Header */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{authorInfo.initial}</Text>
        </View>

        <View style={styles.authorColumn}>
          <Text style={styles.authorName}>{authorInfo.displayName}</Text>
          <Text style={styles.authorHandleAndDate}>
            {authorInfo.handle} · {formatDate(post.createdAt)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.campusTagPill}>
            <Text style={styles.campusTagText}>
              {post.campusId?.toUpperCase()}
            </Text>
          </View>

          {canManage && onDeletePress && (
            <Pressable
              onPress={() => onDeletePress(post.id)}
              hitSlop={8}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 2. Media Attachments FIRST (Instagram Layout: Big, Prominent Photos & Videos) */}
      {hasMedia && (
        <View style={styles.mediaContainer}>
          {post.mediaUrls.map((url, idx) => {
            if (isVideoUrl(url)) {
              return (
                <PostVideoPlayer
                  key={url + idx}
                  uri={url}
                  onLike={() => onLike(post.id)}
                  isLiked={post.isLikedByMe}
                />
              );
            }

            return (
              <Pressable key={url + idx} style={styles.imageFrame} onPress={handleCardPress}>
                <Image
                  source={{ uri: url }}
                  style={styles.postImage}
                  contentFit="cover"
                  transition={250}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. Interaction Bar: Like, Comment, Share */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {/* Like */}
          <Pressable
            onPress={() => onLike(post.id)}
            hitSlop={8}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
            <Ionicons
              name={post.isLikedByMe ? 'heart' : 'heart-outline'}
              size={24}
              color={post.isLikedByMe ? '#EC4899' : isDark ? '#F1F5F9' : '#0F172A'}
            />
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={() => onCommentPress(post)}
            hitSlop={8}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={isDark ? '#F1F5F9' : '#0F172A'}
            />
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={() => onSharePress?.(post)}
            hitSlop={8}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
            <Ionicons
              name="paper-plane-outline"
              size={22}
              color={isDark ? '#F1F5F9' : '#0F172A'}
            />
          </Pressable>
        </View>

        <Text style={styles.likesCountText}>
          {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
        </Text>
      </View>

      {/* 4. Instagram Caption / Description with "more" button */}
      {post.content ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.captionAuthor}>{authorInfo.displayName} </Text>
            {displayedContent}
            {contentIsLong && (
              <Text
                onPress={() => setIsExpanded((prev) => !prev)}
                style={styles.moreButtonText}>
                {isExpanded ? ' less' : ' more'}
              </Text>
            )}
          </Text>
        </View>
      ) : null}

      {/* 5. Comments Counter Link */}
      {post.commentCount > 0 && (
        <Pressable
          onPress={() => onCommentPress(post)}
          hitSlop={4}
          style={styles.viewCommentsLink}>
          <Text style={styles.viewCommentsText}>
            View all {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 10,
      elevation: 4,
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
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#083344' : 'rgba(6, 182, 212, 0.12)',
      borderWidth: 1.5,
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
      color: isDark ? '#F8FAFC' : Colors.text.primary,
    },
    authorHandleAndDate: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: isDark ? '#94A3B8' : '#64748B',
      marginTop: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    campusTagPill: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    campusTagText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#38BDF8',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    iconBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
    },
    mediaContainer: {
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 12,
      gap: 8,
    },
    imageFrame: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginBottom: 4,
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconAction: {
      padding: 2,
    },
    likesCountText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#0F172A',
    },
    captionContainer: {
      marginTop: 2,
      marginBottom: 6,
    },
    captionText: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    captionAuthor: {
      fontFamily: Typography.bold,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : '#0F172A',
    },
    moreButtonText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#38BDF8',
    },
    viewCommentsLink: {
      marginTop: 2,
    },
    viewCommentsText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: isDark ? '#64748B' : '#94A3B8',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
