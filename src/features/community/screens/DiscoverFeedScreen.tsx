import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuthSession } from '@/features/auth';
import { openTab } from '@/features/campus/navigation';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import {
  addPostCommentApi,
  createCommunityPostApi,
  deletePostApi,
  fetchCommunityFeedApi,
  fetchMySubmissionsApi,
  togglePostLikeApi,
} from '../api/community-api';
import { uploadMediaBatch } from '@/lib/api/media-upload';
import { CampusPollsCard } from '../components/CampusPollsCard';
import { CommentsModal } from '../components/CommentsModal';
import { FeedFilterTabs, FeedFilterType } from '../components/FeedFilterTabs';
import { FeedHeader } from '../components/FeedHeader';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';
import { SubmissionsBanner } from '../components/SubmissionsBanner';
import { SubmissionsModal } from '../components/SubmissionsModal';
import { SharePostModal } from '../components/SharePostModal';
import {
  CommunityPost,
  MySubmissionsData,
  PostVisibility,
} from '../types/community-types';

export function DiscoverFeedScreen() {
  const router = useRouter();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const { user } = useAuthSession();
  const token = user?.token || '';
  const tenantId = user?.tenantId || 'nmit';
  const campusName = user?.campusName || 'NMIT Campus';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [submissions, setSubmissions] = useState<MySubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<FeedFilterType>('campus');
  const [activePostForComments, setActivePostForComments] = useState<CommunityPost | null>(null);
  const [activePostForShare, setActivePostForShare] = useState<CommunityPost | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showComposerModal, setShowComposerModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [feedData, mySubmissions] = await Promise.all([
        fetchCommunityFeedApi(token, tenantId, selectedFilter),
        fetchMySubmissionsApi(token, tenantId).catch(() => null),
      ]);
      setPosts(feedData);
      if (mySubmissions) {
        setSubmissions(mySubmissions);
      }
    } catch (err) {
      console.warn('Failed to load feed data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, selectedFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreatePost = async (
    content: string,
    mediaUrls: string[],
    visibility: PostVisibility,
  ): Promise<boolean> => {
    if (!token) return false;
    setIsSubmittingPost(true);
    try {
      let finalMediaUrls = mediaUrls;
      const localUris = mediaUrls.filter(
        (uri) => !uri.startsWith('http://') && !uri.startsWith('https://'),
      );
      if (localUris.length > 0) {
        const uploaded = await uploadMediaBatch(localUris, token, tenantId, 'community', 'post');
        const remoteExisting = mediaUrls.filter(
          (uri) => uri.startsWith('http://') || uri.startsWith('https://'),
        );
        finalMediaUrls = [...remoteExisting, ...uploaded];
      }

      const newPost = await createCommunityPostApi(token, tenantId, {
        content,
        mediaUrls: finalMediaUrls,
        visibility,
      });

      // Optimistically insert into feed if approved or campus view
      setPosts((prev) => [newPost, ...prev]);

      // Refresh submissions count
      fetchMySubmissionsApi(token, tenantId)
        .then((data) => setSubmissions(data))
        .catch(() => {});

      setShowComposerModal(false);
      return true;
    } catch (err: any) {
      Alert.alert('Post Failed', err?.message || 'Could not publish post. Please try again.');
      return false;
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!token) return false;

    // Optimistic UI toggle
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: isLiked,
            likeCount: isLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
          };
        }
        return p;
      }),
    );

    try {
      await togglePostLikeApi(token, tenantId, postId);
    } catch (err) {
      console.warn('Like toggle failed on server, rolling back:', err);
      // Rollback on network failure
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLiked = !p.isLikedByMe;
            return {
              ...p,
              isLikedByMe: isLiked,
              likeCount: isLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
            };
          }
          return p;
        }),
      );
    }
  };

  const handleOpenComments = (post: CommunityPost) => {
    setActivePostForComments(post);
    setShowCommentsModal(true);
  };

  const handleAddComment = async (postId: string, text: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await addPostCommentApi(token, tenantId, postId, text);

      // Optimistically bump comment count in feed
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
      );
      return true;
    } catch (err: any) {
      Alert.alert('Comment Failed', err?.message || 'Could not post comment.');  return false;}
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to remove this post from the campus feed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePostApi(token, tenantId, postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  const handleOpenShare = (post: CommunityPost) => {
    setActivePostForShare(post);
  };

  const userInitial = (user?.fullName || user?.email || 'U').charAt(0);
  const roleNorm = (user?.role || '').toLowerCase().replace(/[-_]/g, '');
  const isAdmin =
    roleNorm === 'admin' ||
    roleNorm === 'campusadmin' ||
    roleNorm === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin';

  const emptyTitle =
    selectedFilter === 'following'
      ? 'No posts from followed members yet'
      : selectedFilter === 'clubs'
      ? 'No club posts yet'
      : 'No posts yet';

  const emptySubtitle =
    selectedFilter === 'following'
      ? 'Connect with classmates in the Connect tab to see their posts here.'
      : selectedFilter === 'clubs'
      ? 'Club announcements, updates, and events will appear here.'
      : 'Be the first to share an update with your campus!';

  return (
    <View style={styles.container}>
      {/* Feed Top Header Bar */}
      <FeedHeader
        campusName={campusName}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => router.push('/notifications')}
        onConnectPress={() => router.push('/connect')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }>
        {/* Filter Pills: Campus / Following / Clubs */}
        <FeedFilterTabs
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {/* Collapsed "Share with campus" trigger bar with '+' Icon */}
        <View style={styles.shareBarCard}>
          <View style={styles.shareBarAvatar}>
            <Text style={styles.shareBarAvatarText}>{userInitial.toUpperCase()}</Text>
          </View>
          <Pressable
            onPress={() => setShowComposerModal(true)}
            style={styles.shareBarInputMock}>
            <Text style={styles.shareBarPlaceholder}>Share with your campus...</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowComposerModal(true)}
            style={({ pressed }) => [styles.shareBarPlusBtn, pressed && { opacity: 0.75 }]}
            hitSlop={8}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* My Submissions Counter Banner */}
        <SubmissionsBanner
          count={submissions?.pendingCount || 0}
          onPressView={() => setShowSubmissionsModal(true)}
        />

        {/* Feed Posts List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyFeedBox}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onLike={handleToggleLike}
              onCommentPress={handleOpenComments}
              onSharePress={handleOpenShare}
              onDeletePress={handleDeletePost}
            />
          ))
        )}

        {/* Campus Polls Placeholder */}
        <CampusPollsCard />
      </ScrollView>

      {/* Floating Action Button (FAB) '+' */}
      <Pressable
        onPress={() => setShowComposerModal(true)}
        style={({ pressed }) => [
          styles.fabButton,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Post Composer Sheet / Modal */}
      <Modal
        visible={showComposerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposerModal(false)}>
        <View style={[styles.composerModalContainer, { backgroundColor: Colors.background.canvas }]}>
          <PostComposer
            userInitial={userInitial}
            isSubmitting={isSubmittingPost}
            onClose={() => setShowComposerModal(false)}
            onSubmit={handleCreatePost}
          />
        </View>
      </Modal>

      {/* Share Post Modal */}
      <SharePostModal
        visible={Boolean(activePostForShare)}
        post={activePostForShare}
        onClose={() => setActivePostForShare(null)}
        token={token}
        tenantId={tenantId}
      />

      {/* Floating Bottom Nav with Discover Active */}
      <HomeBottomTabs
        activeTab="discover"
        onTabChange={(tab) => openTab(router, tab)}
        onCenterActionPress={() => router.push('/scan')}
      />

      {/* Comments Sheet Modal */}
      <CommentsModal
        visible={showCommentsModal}
        post={activePostForComments}
        onClose={() => {
          setShowCommentsModal(false);
          setActivePostForComments(null);
        }}
        onAddComment={handleAddComment}
      />

      {/* Submissions Status Modal */}
      <SubmissionsModal
        visible={showSubmissionsModal}
        data={submissions}
        onClose={() => setShowSubmissionsModal(false)}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    scrollContent: {
      paddingBottom: 130, // Clearance for floating bottom bar and FAB
    },
    shareBarCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 14,
      shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    shareBarAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#0E7490' : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareBarAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    shareBarInputMock: {
      flex: 1,
      paddingVertical: 6,
    },
    shareBarPlaceholder: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: isDark ? '#64748B' : '#94A3B8',
    },
    shareBarPlusBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabButton: {
      position: 'absolute',
      right: 20,
      bottom: 90,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 40,
    },
    composerModalContainer: {
      flex: 1,
      paddingTop: 20,
    },
    centerBox: {
      paddingVertical: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyFeedBox: {
      paddingVertical: 40,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
  });
}
