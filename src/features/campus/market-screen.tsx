import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { useColors } from '@/theme/app-theme';

import { CreateListingModal } from './components/marketplace/CreateListingModal';
import { MarketplaceDetailModal } from './components/marketplace/MarketplaceDetailModal';
import { MarketplaceItemCard } from './components/marketplace/MarketplaceItemCard';
import {
  createMarketplaceItemApi,
  deleteMarketplaceItemApi,
  fetchMarketplaceItemsApi,
  fetchMyMarketplaceItemsApi,
  fetchPendingMarketplaceItemsApi,
  toggleMarketplaceItemLikeApi,
  updateMarketplaceItemStatusApi,
} from './marketplace-api';
import {
  CreateMarketplaceItemPayload,
  MarketplaceCategory,
  MarketplaceItem,
} from './marketplace-types';

const CATEGORIES: MarketplaceCategory[] = [
  'All',
  'Bags & Luggage',
  'Bicycles',
  'Books & Study Material',
  'Clothing & Accessories',
  'Electronics',
  'Furniture',
  'Instruments & Equipment',
  'Other',
  'Sports & Fitness',
  'Stationery',
];

type ActiveTab = 'explore' | 'my' | 'pending';

export function MarketplaceScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuthSession();

  const token = user?.token;
  const tenantId = user?.tenantId || 'nmit';
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'campus_admin' || userRole === 'superadmin';
  const currentUserId = user?.id;

  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('All');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Overlay loader for screen-level actions
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionLoadingText, setActionLoadingText] = useState<string>('Processing...');

  // Themed message modal
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
    onOk?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (
    title: string,
    message: string,
    type: AppMessageType = 'info',
    onOk?: () => void,
  ) => {
    setModalConfig({ visible: true, title, message, type, onOk });
  };

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Load items based on active tab and category
  const loadItems = useCallback(async () => {
    try {
      if (activeTab === 'explore') {
        const data = await fetchMarketplaceItemsApi(token, tenantId, {
          category: selectedCategory === 'All' ? undefined : selectedCategory,
        });
        setItems(data || []);
      } else if (activeTab === 'my') {
        if (!token) {
          setItems([]);
          return;
        }
        const data = await fetchMyMarketplaceItemsApi(token, tenantId);
        setItems(data || []);
      } else if (activeTab === 'pending') {
        if (!token || !isAdmin) {
          setItems([]);
          return;
        }
        const data = await fetchPendingMarketplaceItemsApi(token, tenantId);
        setItems(data || []);
        setPendingCount(data.length);
      }

      // If admin, keep the pending count badge updated
      if (isAdmin && token && activeTab !== 'pending') {
        fetchPendingMarketplaceItemsApi(token, tenantId)
          .then((p) => setPendingCount(p?.length || 0))
          .catch(() => undefined);
      }
    } catch (err: any) {
      console.warn('Failed to load marketplace items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedCategory, token, tenantId, isAdmin]);

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [loadItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems();
  }, [loadItems]);

  // Tab switch handler with instant visual loader
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setLoading(true);
    setActiveTab(tab);
  };

  // Category switch handler with instant visual loader
  const handleCategoryChange = (cat: MarketplaceCategory) => {
    if (cat === selectedCategory) return;
    setLoading(true);
    setSelectedCategory(cat);
  };

  // Handle Like Toggle
  const handleLikeToggle = async (item: MarketplaceItem) => {
    if (!token) {
      showModal('Sign in Required', 'Please log in to like marketplace listings.', 'warning');
      return;
    }

    // Optimistic UI update
    const previousItems = [...items];
    const newIsLiked = !item.isLiked;
    const newCount = newIsLiked ? item.likeCount + 1 : Math.max(0, item.likeCount - 1);

    setItems((curr) =>
      curr.map((it) =>
        it.id === item.id ? { ...it, isLiked: newIsLiked, likeCount: newCount } : it,
      ),
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem((curr) =>
        curr ? { ...curr, isLiked: newIsLiked, likeCount: newCount } : null,
      );
    }

    try {
      const res = await toggleMarketplaceItemLikeApi(token, tenantId, item.id);
      // Sync real response count
      setItems((curr) =>
        curr.map((it) =>
          it.id === item.id ? { ...it, isLiked: res.isLiked, likeCount: res.likeCount } : it,
        ),
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem((curr) =>
          curr ? { ...curr, isLiked: res.isLiked, likeCount: res.likeCount } : null,
        );
      }
    } catch {
      // Revert on error
      setItems(previousItems);
    }
  };

  // Create Listing Submission
  const handleCreateListing = async (payload: CreateMarketplaceItemPayload) => {
    if (!token) {
      throw new Error('You must be signed in to list an item.');
    }
    const created = await createMarketplaceItemApi(token, tenantId, payload);
    if (created.status === 'APPROVED') {
      showModal('Published!', 'Your item is now live on the campus marketplace.', 'success');
      handleTabChange('explore');
    } else {
      showModal(
        'Submitted for Review',
        'Your listing has been submitted to Campus Admin. It will appear on the market once approved.',
        'info',
      );
      handleTabChange('my');
    }
    loadItems();
  };

  // Admin Approve
  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      setActionLoadingText('Approving listing...');
      setActionLoading(true);
      await updateMarketplaceItemStatusApi(token, tenantId, id, 'APPROVED');
      await loadItems();
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Reject
  const handleReject = async (id: string, reason?: string) => {
    if (!token) return;
    try {
      setActionLoadingText('Rejecting listing...');
      setActionLoading(true);
      await updateMarketplaceItemStatusApi(token, tenantId, id, 'REJECTED', reason);
      await loadItems();
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Sold
  const handleMarkSold = async (id: string) => {
    if (!token) return;
    try {
      setActionLoadingText('Updating status...');
      setActionLoading(true);
      await updateMarketplaceItemStatusApi(token, tenantId, id, 'SOLD');
      await loadItems();
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      setActionLoadingText('Deleting listing...');
      setActionLoading(true);
      await deleteMarketplaceItemApi(token, tenantId, id);
      await loadItems();
    } finally {
      setActionLoading(false);
    }
  };

  // Render 2-column grid pairs
  const renderItemCard = ({ item }: { item: MarketplaceItem }) => (
    <View style={styles.gridColumn}>
      <MarketplaceItemCard
        item={item}
        onPress={() => setSelectedItem(item)}
        onLikeToggle={() => handleLikeToggle(item)}
        showStatusBadge={activeTab !== 'explore'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header matching Screenshot 1 with Back Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Market</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.listItemBtn}
            onPress={() => setCreateModalVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={Colors.primary.accent} />
            <Text style={styles.listItemText}>List item</Text>
          </Pressable>

          <Pressable
            style={styles.refreshBtn}
            onPress={onRefresh}
            hitSlop={8}
            accessibilityLabel="Refresh listings"
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Subtitles matching Screenshot 1 */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.mainSubtitle}>Find your next campus essential</Text>
        <Text style={styles.secondarySubtitle}>Buy & sell with your community</Text>
      </View>

      {/* View Segment Switcher (Explore | My Listings | Admin Review Queue) */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'explore' && styles.segmentBtnActive]}
          onPress={() => handleTabChange('explore')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'explore' && styles.segmentTextActive,
            ]}
          >
            Market Feed
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'my' && styles.segmentBtnActive]}
          onPress={() => handleTabChange('my')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'my' && styles.segmentTextActive,
            ]}
          >
            My Listings
          </Text>
        </Pressable>

        {isAdmin && (
          <Pressable
            style={[styles.segmentBtn, activeTab === 'pending' && styles.segmentBtnActive]}
            onPress={() => handleTabChange('pending')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'pending' && styles.segmentTextActive,
                ]}
              >
                Review Queue
              </Text>
              {pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>

      {/* Category Pills (Visible when in Explore tab) */}
      {activeTab === 'explore' && (
        <View style={styles.categoryScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    isSelected && styles.catChipActive,
                  ]}
                  onPress={() => handleCategoryChange(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      isSelected && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Admin Review Queue Banner Info */}
      {activeTab === 'pending' && (
        <View style={styles.adminInfoBanner}>
          <Ionicons name="shield-outline" size={18} color={Colors.primary.accent} style={{ marginRight: 8 }} />
          <Text style={styles.adminInfoText}>
            Student submissions awaiting your approval before being published to everyone.
          </Text>
        </View>
      )}

      {/* Product Grid List (2 Columns) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <LogoLoader size={48} text="Loading marketplace..." style={{ marginTop: 24 }} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={renderItemCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.accent}
              colors={[Colors.primary.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-handle-outline" size={54} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending'
                  ? 'All caught up!'
                  : activeTab === 'my'
                  ? 'No listings yet'
                  : 'Nothing found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'No pending student listings to review right now.'
                  : activeTab === 'my'
                  ? 'Tap "+ List item" to sell something to your campus community.'
                  : `No items listed under "${selectedCategory}". Be the first to list one!`}
              </Text>
              {activeTab === 'my' && (
                <Pressable
                  style={styles.emptyActionBtn}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={styles.emptyActionBtnText}>Create a Listing</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* Create Listing Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <CreateListingModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSubmit={handleCreateListing}
          isAdmin={isAdmin}
        />
      </Modal>

      {/* Marketplace Detail Modal */}
      <MarketplaceDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onLikeToggle={() => selectedItem && handleLikeToggle(selectedItem)}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkSold={handleMarkSold}
        onDelete={handleDelete}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {/* Themed Feedback Modal */}
      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          modalConfig.onOk?.();
        }}
      />

      {/* Screen-level Action Overlay Loader */}
      {actionLoading && <LogoLoader overlay text={actionLoadingText} />}
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
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
      paddingTop: Platform.OS === 'ios' ? 8 : 12,
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: Typography.extraBold,
      fontSize: 26,
      fontWeight: '800',
      color: Colors.text.primary,
      letterSpacing: -0.5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    listItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    listItemText: {
      fontFamily: Typography.semiBold,
      fontSize: 15,
      fontWeight: '600',
      color: Colors.primary.accent,
    },
    refreshBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: Colors.background.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    subtitleContainer: {
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    mainSubtitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 2,
    },
    secondarySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    segmentContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: Colors.background.surface,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
    },
    segmentBtnActive: {
      backgroundColor: Colors.background.elevated,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    segmentText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    segmentTextActive: {
      color: Colors.text.primary,
    },
    pendingBadge: {
      backgroundColor: Colors.status.error,
      borderRadius: 9,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: 6,
    },
    pendingBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    categoryScrollWrapper: {
      marginBottom: 14,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    catChipActive: {
      backgroundColor: Colors.primary.cyan,
      borderColor: Colors.primary.light,
    },
    catChipText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '500',
      color: Colors.text.secondary,
    },
    catChipTextActive: {
      color: Colors.text.onBrand,
      fontWeight: '600',
    },
    adminInfoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.primary.accent,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 10,
    },
    adminInfoText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.primary.lavender,
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 40,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    gridColumn: {
      width: '48.5%',
    },
    centerLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 14,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
    },
    emptyActionBtn: {
      backgroundColor: Colors.primary.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
    },
    emptyActionBtnText: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
