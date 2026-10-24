import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAppTheme } from '@/theme/app-theme';
import {
  addPostCommentApi,
  createCommunityPostApi,
  deletePostApi,
  fetchCommunityFeedApi,
  fetchMySubmissionsApi,
  togglePostLikeApi,
} from '../api/community-api';
import { CampusPollsCard } from '../components/CampusPollsCard';
import { CommentsModal } from '../components/CommentsModal';
import { FeedFilterTabs, FeedFilterType } from '../components/FeedFilterTabs';
import { FeedHeader } from '../components/FeedHeader';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';
import { SubmissionsBanner } from '../components/SubmissionsBanner';
import { SubmissionsModal } from '../components/SubmissionsModal';
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
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

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
      const newPost = await createCommunityPostApi(token, tenantId, {
        content,
        mediaUrls,
        visibility,
      });

      // Optimistically insert into feed if approved or campus view
      setPosts((prev) => [newPost, ...prev]);

      // Refresh submissions count
      fetchMySubmissionsApi(token, tenantId)
        .then((data) => setSubmissions(data))
        .catch(() => {});

      return true;
    } catch (err: any) {
      Alert.alert('Post Failed', err?.message || 'Could not publish post. Please try again.');
      return false;
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!token) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: isLiked,
            likeCount: isLiked ? p.likeCount + 1 : Math.max(p.likeCount - 1, 0),
          };
        }
        return p;
      }),
    );

    try {
      const res = await togglePostLikeApi(token, tenantId, postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likeCount: res.likeCount,
              isLikedByMe: res.isLikedByMe,
            };
          }
          return p;
        }),
      );
    } catch {
      // Revert on error
      loadData();
    }
  };

  const handleOpenComments = (post: CommunityPost) => {
    setActivePostForComments(post);
    setShowCommentsModal(true);
  };

  const handleAddComment = async (postId: string, commentText: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const updatedPost = await addPostCommentApi(token, tenantId, postId, commentText);

      // Update feed post and active post in modal
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      setActivePostForComments(updatedPost);
      return true;
    } catch (err: any) {
      Alert.alert('Comment Failed', err?.message || 'Could not post comment.');
      return false;
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
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

  const userInitial = (user?.fullName || user?.email || 'U').charAt(0);
  const isAdmin = user?.role === 'superadmin';

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

        {/* Post Creator Box */}
        <PostComposer
          userInitial={userInitial}
          isSubmitting={isSubmittingPost}
          onSubmit={handleCreatePost}
        />

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
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to share an update with your campus!</Text>
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
              onDeletePress={handleDeletePost}
            />
          ))
        )}

        {/* Campus Polls Placeholder */}
        <CampusPollsCard />
      </ScrollView>

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
      paddingBottom: 120, // Ample clearance for floating bottom bar
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
