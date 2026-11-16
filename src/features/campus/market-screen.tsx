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
  TextInput,
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
import { uploadMediaBatch } from '@/lib/api/media-upload';

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

const STORE_CATEGORIES: MarketplaceCategory[] = [
  'All',
  'Clothing & Accessories',
  'Books & Study Material',
  'Stationery',
  'Instruments & Equipment',
  'Bags & Luggage',
  'Other',
];

type MarketplaceSection = 'campus_store' | 'buy_sell' | 'my' | 'pending';

export function MarketplaceScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { user } = useAuthSession();

  const token = user?.token;
  const tenantId = user?.tenantId || 'nmit';
  const userRole = (user?.role || '').toLowerCase();
  const userRoles: string[] = Array.isArray((user as any)?.roles)
    ? (user as any).roles.map((r: string) => String(r).toLowerCase())
    : [];
  const isAdmin =
    userRole === 'admin' ||
    userRole === 'campus_admin' ||
    userRole === 'superadmin' ||
    userRoles.includes('admin') ||
    userRoles.includes('campus_admin') ||
    userRoles.includes('superadmin');
  const currentUserId = user?.id;

  // Active section: 'campus_store' (Amazon/Blinkit) vs 'buy_sell' (OLX) vs 'my' vs 'pending'
  const [activeSection, setActiveSection] = useState<MarketplaceSection>('campus_store');

  // Independent state for Campus Admin Store
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [storeCategory, setStoreCategory] = useState<MarketplaceCategory>('All');
  const [storeItems, setStoreItems] = useState<MarketplaceItem[]>([]);

  // Independent state for Buy & Sell (Students)
  const [buySellSearch, setBuySellSearch] = useState<string>('');
  const [buySellCategory, setBuySellCategory] = useState<MarketplaceCategory>('All');
  const [buySellItems, setBuySellItems] = useState<MarketplaceItem[]>([]);

  // My Listings & Pending items
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [pendingItems, setPendingItems] = useState<MarketplaceItem[]>([]);
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

  // Load Campus Admin Store items independently
  const loadStoreItems = useCallback(async () => {
    try {
      const data = await fetchMarketplaceItemsApi(token, tenantId, {
        category: storeCategory === 'All' ? undefined : storeCategory,
        search: storeSearch.trim() || undefined,
        listingType: 'CAMPUS_STORE',
      });
      // Fallback filter in case backend row only has sellerRole
      let list = (data || []).filter((it) => {
        const type = (it.listingType || '').toUpperCase();
        const role = (it.sellerRole || '').toUpperCase();
        return (
          type === 'CAMPUS_STORE' ||
          role === 'CAMPUS_ADMIN' ||
          role === 'ADMIN' ||
          it.sellerRole?.toLowerCase() === 'campus_admin'
        );
      });
      if (storeSearch.trim()) {
        const q = storeSearch.trim().toLowerCase();
        list = list.filter(
          (it) =>
            it.title?.toLowerCase().includes(q) ||
            it.description?.toLowerCase().includes(q) ||
            it.category?.toLowerCase().includes(q),
        );
      }
      setStoreItems(list);
    } catch {
      setStoreItems([]);
    }
  }, [token, tenantId, storeCategory, storeSearch]);

  // Load Buy & Sell student items independently
  const loadBuySellItems = useCallback(async () => {
    try {
      const data = await fetchMarketplaceItemsApi(token, tenantId, {
        category: buySellCategory === 'All' ? undefined : buySellCategory,
        search: buySellSearch.trim() || undefined,
        listingType: 'BUY_SELL',
      });
      let list = (data || []).filter((it) => {
        const type = (it.listingType || '').toUpperCase();
        const role = (it.sellerRole || '').toUpperCase();
        if (type === 'CAMPUS_STORE') return false;
        if (role === 'CAMPUS_ADMIN' || role === 'ADMIN' || it.sellerRole?.toLowerCase() === 'campus_admin') {
          return false;
        }
        return true;
      });
      if (buySellSearch.trim()) {
        const q = buySellSearch.trim().toLowerCase();
        list = list.filter(
          (it) =>
            it.title?.toLowerCase().includes(q) ||
            it.description?.toLowerCase().includes(q) ||
            it.category?.toLowerCase().includes(q) ||
            it.sellerName?.toLowerCase().includes(q),
        );
      }
      setBuySellItems(list);
    } catch {
      setBuySellItems([]);
    }
  }, [token, tenantId, buySellCategory, buySellSearch]);

  // Load My Listings
  const loadMyListings = useCallback(async () => {
    if (!token) {
      setMyItems([]);
      return;
    }
    try {
      const data = await fetchMyMarketplaceItemsApi(token, tenantId);
      setMyItems(data || []);
    } catch {
      setMyItems([]);
    }
  }, [token, tenantId]);

  // Load Pending Review Queue (Admin)
  const loadPendingQueue = useCallback(async () => {
    if (!token || !isAdmin) {
      setPendingItems([]);
      setPendingCount(0);
      return;
    }
    try {
      const data = await fetchPendingMarketplaceItemsApi(token, tenantId);
      const list = data || [];
      setPendingItems(list);
      setPendingCount(list.length);
    } catch {
      setPendingItems([]);
      setPendingCount(0);
    }
  }, [token, tenantId, isAdmin]);

  // Master loader depending on current section
  const loadCurrentSection = useCallback(async () => {
    setLoading(true);
    try {
      if (activeSection === 'campus_store') {
        await loadStoreItems();
      } else if (activeSection === 'buy_sell') {
        await loadBuySellItems();
      } else if (activeSection === 'my') {
        await loadMyListings();
      } else if (activeSection === 'pending') {
        await loadPendingQueue();
      }
      // Also silently refresh pending count in background for admin badge
      if (isAdmin && activeSection !== 'pending') {
        loadPendingQueue();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSection, loadStoreItems, loadBuySellItems, loadMyListings, loadPendingQueue, isAdmin]);

  useEffect(() => {
    loadCurrentSection();
  }, [loadCurrentSection]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCurrentSection();
  }, [loadCurrentSection]);

  // Section Tab switch handler
  const handleSectionSwitch = (sec: MarketplaceSection) => {
    if (sec === activeSection) return;
    setLoading(true);
    setActiveSection(sec);
  };

  // Handle Like Toggle
  const handleLikeToggle = async (item: MarketplaceItem) => {
    if (!token) {
      showModal('Sign in Required', 'Please log in to like marketplace listings.', 'warning');
      return;
    }

    const newIsLiked = !item.isLiked;
    const newCount = newIsLiked ? item.likeCount + 1 : Math.max(0, item.likeCount - 1);

    const updateInList = (list: MarketplaceItem[]) =>
      list.map((it) => (it.id === item.id ? { ...it, isLiked: newIsLiked, likeCount: newCount } : it));

    setStoreItems(updateInList);
    setBuySellItems(updateInList);
    setMyItems(updateInList);

    if (selectedItem?.id === item.id) {
      setSelectedItem((curr) =>
        curr ? { ...curr, isLiked: newIsLiked, likeCount: newCount } : null,
      );
    }

    try {
      const res = await toggleMarketplaceItemLikeApi(token, tenantId, item.id);
      const syncInList = (list: MarketplaceItem[]) =>
        list.map((it) => (it.id === item.id ? { ...it, isLiked: res.liked, likeCount: res.likeCount } : it));
      setStoreItems(syncInList);
      setBuySellItems(syncInList);
      setMyItems(syncInList);
    } catch {
      // Keep optimistic
    }
  };

  // Create Listing Submission
  const handleCreateListing = async (payload: CreateMarketplaceItemPayload) => {
    if (!token) {
      throw new Error('You must be signed in to list an item.');
    }

    let finalImages = payload.images || [];
    const localUris = finalImages.filter(
      (uri) => !uri.startsWith('http://') && !uri.startsWith('https://'),
    );
    if (localUris.length > 0) {
      setActionLoadingText('Uploading listing photos...');
      setActionLoading(true);
      try {
        const uploadedUrls = await uploadMediaBatch(
          localUris,
          token,
          tenantId,
          'marketplace',
          'listing',
        );
        const remoteExisting = finalImages.filter(
          (uri) => uri.startsWith('http://') || uri.startsWith('https://'),
        );
        finalImages = [...remoteExisting, ...uploadedUrls];
      } finally {
        setActionLoading(false);
      }
    }

    // Default listingType according to current section or admin status
    const assignedType =
      payload.listingType ||
      (activeSection === 'campus_store' && isAdmin ? 'CAMPUS_STORE' : 'BUY_SELL');

    const created = await createMarketplaceItemApi(token, tenantId, {
      ...payload,
      listingType: assignedType,
      images: finalImages,
    });

    if (created.status === 'APPROVED') {
      showModal('Published!', 'Your item is now live on the campus marketplace.', 'success');
      if (assignedType === 'CAMPUS_STORE') {
        setActiveSection('campus_store');
      } else {
        setActiveSection('buy_sell');
      }
    } else {
      showModal(
        'Submitted for Review',
        'Your listing has been submitted to Campus Admin. It will appear on Buy & Sell once approved.',
        'info',
      );
      setActiveSection('my');
    }
    loadCurrentSection();
  };

  // Admin Approve
  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      setActionLoadingText('Approving listing...');
      setActionLoading(true);
      await updateMarketplaceItemStatusApi(token, tenantId, id, 'APPROVED');
      await loadCurrentSection();
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
      await loadCurrentSection();
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
      await loadCurrentSection();
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
      await loadCurrentSection();
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Delete confirmation
  const handleAdminDelete = (item: MarketplaceItem) => {
    showModal(
      'Admin Delete Listing',
      `Are you sure you want to permanently delete "${item.title}" as Administrator?`,
      'warning',
      () => handleDelete(item.id),
    );
  };

  // Determine current active list
  const currentList = useMemo(() => {
    if (activeSection === 'campus_store') return storeItems;
    if (activeSection === 'buy_sell') return buySellItems;
    if (activeSection === 'my') return myItems;
    if (activeSection === 'pending') return pendingItems;
    return [];
  }, [activeSection, storeItems, buySellItems, myItems, pendingItems]);

  const renderItemCard = ({ item }: { item: MarketplaceItem }) => (
    <View style={styles.gridColumn}>
      <MarketplaceItemCard
        item={item}
        onPress={() => setSelectedItem(item)}
        onLikeToggle={() => handleLikeToggle(item)}
        showStatusBadge={activeSection === 'my' || activeSection === 'pending'}
        isAdmin={isAdmin}
        onAdminDelete={isAdmin ? () => handleAdminDelete(item) : undefined}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
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
          <Text style={styles.headerTitle}>Marketplace</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.listItemBtn}
            onPress={() => setCreateModalVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={Colors.primary.accent} />
            <Text style={styles.listItemText}>List Item</Text>
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

      {/* Main Two-Section Mode Switcher */}
      <View style={styles.primaryTabRow}>
        <Pressable
          style={[
            styles.primaryTabBtn,
            activeSection === 'campus_store' && styles.primaryTabBtnActiveStore,
          ]}
          onPress={() => handleSectionSwitch('campus_store')}
        >
          <Ionicons
            name="cart"
            size={16}
            color={activeSection === 'campus_store' ? '#FFFFFF' : Colors.text.secondary}
          />
          <Text
            style={[
              styles.primaryTabText,
              activeSection === 'campus_store' && styles.primaryTabTextActive,
            ]}
          >
            Campus Store
          </Text>
          <View style={styles.officialPill}>
            <Text style={styles.officialPillText}>Official</Text>
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.primaryTabBtn,
            activeSection === 'buy_sell' && styles.primaryTabBtnActiveBuySell,
          ]}
          onPress={() => handleSectionSwitch('buy_sell')}
        >
          <Ionicons
            name="pricetags"
            size={16}
            color={activeSection === 'buy_sell' ? '#FFFFFF' : Colors.text.secondary}
          />
          <Text
            style={[
              styles.primaryTabText,
              activeSection === 'buy_sell' && styles.primaryTabTextActive,
            ]}
          >
            Buy & Sell
          </Text>
          <View style={styles.studentsPill}>
            <Text style={styles.studentsPillText}>Students</Text>
          </View>
        </Pressable>
      </View>

      {/* Sub Tabs: My Listings & Review Queue */}
      <View style={styles.subTabRow}>
        <Pressable
          style={[
            styles.subTabBtn,
            activeSection === 'my' && styles.subTabBtnActive,
          ]}
          onPress={() => handleSectionSwitch('my')}
        >
          <Ionicons
            name="person-circle-outline"
            size={14}
            color={activeSection === 'my' ? Colors.primary.accent : Colors.text.tertiary}
          />
          <Text
            style={[
              styles.subTabText,
              activeSection === 'my' && styles.subTabTextActive,
            ]}
          >
            My Listings
          </Text>
        </Pressable>

        {isAdmin && (
          <Pressable
            style={[
              styles.subTabBtn,
              activeSection === 'pending' && styles.subTabBtnActive,
            ]}
            onPress={() => handleSectionSwitch('pending')}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={activeSection === 'pending' ? Colors.primary.accent : Colors.text.tertiary}
            />
            <Text
              style={[
                styles.subTabText,
                activeSection === 'pending' && styles.subTabTextActive,
              ]}
            >
              Review Queue
            </Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* SECTION 1: CAMPUS ADMIN STORE (Amazon / Blinkit style) */}
      {activeSection === 'campus_store' && (
        <>
          {/* Store Hero Banner */}
          <View style={styles.storeHeroBanner}>
            <View style={styles.storeHeroLeft}>
              <View style={styles.storeVerifiedTag}>
                <Ionicons name="shield-checkmark" size={13} color="#2563EB" />
                <Text style={styles.storeVerifiedText}>Official Campus Partner</Text>
              </View>
              <Text style={styles.storeHeroTitle}>College Store & Essentials</Text>
              <Text style={styles.storeHeroSubtitle}>
                Verified uniforms, hoodies, kits & books • Instant campus pickup
              </Text>
            </View>
            <View style={styles.storeHeroBadge}>
              <Ionicons name="flash" size={18} color="#F59E0B" />
              <Text style={styles.storeHeroBadgeText}>Express</Text>
            </View>
          </View>

          {/* Independent Search Bar for Campus Store */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search official hoodies, ID lanyards, uniform..."
              placeholderTextColor={Colors.text.tertiary}
              value={storeSearch}
              onChangeText={setStoreSearch}
              returnKeyType="search"
            />
            {storeSearch.length > 0 && (
              <Pressable
                style={styles.searchClearBtn}
                onPress={() => setStoreSearch('')}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          {/* Store Category Pills */}
          <View style={styles.categoryScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {STORE_CATEGORIES.map((cat) => {
                const isSelected = storeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActiveStore]}
                    onPress={() => setStoreCategory(cat)}
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
        </>
      )}

      {/* SECTION 2: BUY & SELL (OLX style) */}
      {activeSection === 'buy_sell' && (
        <>
          {/* Buy & Sell Hero Banner */}
          <View style={styles.buySellHeroBanner}>
            <View style={styles.buySellHeroLeft}>
              <View style={styles.buySellTag}>
                <Ionicons name="people" size={13} color="#10B981" />
                <Text style={styles.buySellTagText}>Peer-to-Peer Market</Text>
              </View>
              <Text style={styles.buySellHeroTitle}>Student Buy & Sell</Text>
              <Text style={styles.buySellHeroSubtitle}>
                Safe campus handoffs • Secondhand books, tech, bicycles & dorm items
              </Text>
            </View>
          </View>

          {/* Independent Search Bar for Buy & Sell */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cycles, calculators, dorm furniture..."
              placeholderTextColor={Colors.text.tertiary}
              value={buySellSearch}
              onChangeText={setBuySellSearch}
              returnKeyType="search"
            />
            {buySellSearch.length > 0 && (
              <Pressable
                style={styles.searchClearBtn}
                onPress={() => setBuySellSearch('')}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          {/* Student Category Pills */}
          <View style={styles.categoryScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = buySellCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActiveBuySell]}
                    onPress={() => setBuySellCategory(cat)}
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
        </>
      )}

      {/* SECTION 3: MY LISTINGS */}
      {activeSection === 'my' && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color={Colors.primary.accent} />
          <Text style={styles.infoBannerText}>
            Track the approval status and active listings created by your account.
          </Text>
        </View>
      )}

      {/* SECTION 4: REVIEW QUEUE (Admin) */}
      {activeSection === 'pending' && (
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
          <Text style={styles.infoBannerText}>
            Administrator Review Queue: Approve safe campus listings or reject inappropriate submissions.
          </Text>
        </View>
      )}

      {/* Product Grid / Listings */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <LogoLoader size={44} text="Loading items..." />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(it) => it.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            currentList.length === 0 && styles.listEmptyContent,
          ]}
          columnWrapperStyle={styles.gridRow}
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
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={
                    activeSection === 'campus_store'
                      ? 'cart-outline'
                      : activeSection === 'buy_sell'
                        ? 'pricetags-outline'
                        : 'cube-outline'
                  }
                  size={36}
                  color={Colors.text.tertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeSection === 'campus_store'
                  ? 'No store items found'
                  : activeSection === 'buy_sell'
                    ? 'No student listings found'
                    : 'No items in this section'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeSection === 'campus_store'
                  ? 'Campus administrators will add new official items shortly.'
                  : 'Be the first student to post an item for sale!'}
              </Text>
              <Pressable
                style={styles.emptyAddBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>
                  {activeSection === 'campus_store' && isAdmin
                    ? 'Add Official Product'
                    : 'List an Item for Sale'}
                </Text>
              </Pressable>
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
      {selectedItem ? (
        <MarketplaceDetailModal
          visible={Boolean(selectedItem)}
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
      ) : null}

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
      paddingTop: Platform.OS === 'ios' ? 54 : 36,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      backgroundColor: Colors.background.canvas,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    listItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary.accent + '15',
      borderWidth: 1,
      borderColor: Colors.primary.accent + '40',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    listItemText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary.accent,
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Primary Tab Switcher
    primaryTabRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 10,
    },
    primaryTabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    primaryTabBtnActiveStore: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    primaryTabBtnActiveBuySell: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },
    primaryTabText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: Colors.text.secondary,
    },
    primaryTabTextActive: {
      color: '#FFFFFF',
    },
    officialPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
    },
    officialPillText: {
      fontFamily: Typography.bold,
      fontSize: 9.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    studentsPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
    },
    studentsPillText: {
      fontFamily: Typography.bold,
      fontSize: 9.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Sub tabs
    subTabRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    subTabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    subTabBtnActive: {
      borderColor: Colors.primary.accent,
      backgroundColor: Colors.primary.accent + '15',
    },
    subTabText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.tertiary,
    },
    subTabTextActive: {
      color: Colors.primary.accent,
      fontWeight: '700',
    },
    pendingBadge: {
      marginLeft: 4,
      backgroundColor: '#F59E0B',
      borderRadius: 8,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    pendingBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // Store Hero Banner
    storeHeroBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 6,
      backgroundColor: '#2563EB15',
      borderWidth: 1,
      borderColor: '#2563EB35',
      borderRadius: 14,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    storeHeroLeft: {
      flex: 1,
    },
    storeVerifiedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    storeVerifiedText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      fontWeight: '700',
      color: '#2563EB',
    },
    storeHeroTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    storeHeroSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    storeHeroBadge: {
      backgroundColor: '#F59E0B20',
      borderWidth: 1,
      borderColor: '#F59E0B60',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
      alignItems: 'center',
      gap: 2,
    },
    storeHeroBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#D97706',
      fontWeight: '800',
    },
    // Buy & Sell Hero Banner
    buySellHeroBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 6,
      backgroundColor: '#10B98115',
      borderWidth: 1,
      borderColor: '#10B98135',
      borderRadius: 14,
      padding: 12,
    },
    buySellHeroLeft: {
      flex: 1,
    },
    buySellTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    buySellTagText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      fontWeight: '700',
      color: '#059669',
    },
    buySellHeroTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    buySellHeroSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    // Search bar
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border.card,
      paddingHorizontal: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.primary,
      paddingVertical: 0,
    },
    searchClearBtn: {
      padding: 4,
    },
    // Category chips
    categoryScrollWrapper: {
      paddingVertical: 4,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    catChipActiveStore: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    catChipActiveBuySell: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },
    catChipText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    catChipTextActive: {
      fontFamily: Typography.bold,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // Info banner
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 6,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 10,
      padding: 10,
    },
    infoBannerText: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    // Grid list
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 40,
    },
    listEmptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    gridRow: {
      justifyContent: 'space-between',
    },
    gridColumn: {
      width: '49%',
      marginBottom: 10,
    },
    loaderCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
      marginBottom: 18,
      lineHeight: 18,
    },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 22,
    },
    emptyAddBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
