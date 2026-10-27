import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { useColors } from '@/theme/app-theme';
import { MarketplaceItem } from '../../marketplace-types';

interface MarketplaceDetailModalProps {
  visible: boolean;
  item: MarketplaceItem | null;
  onClose: () => void;
  onLikeToggle?: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  onMarkSold?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  currentUserId?: string;
  isAdmin: boolean;
}

export function MarketplaceDetailModal({
  visible,
  item,
  onClose,
  onLikeToggle,
  onApprove,
  onReject,
  onMarkSold,
  onDelete,
  currentUserId,
  isAdmin,
}: MarketplaceDetailModalProps) {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const [rejectPrompt, setRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingActionText, setLoadingActionText] = useState('Processing...');
  const [contactSheetVisible, setContactSheetVisible] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
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
    primaryButtonText = 'OK',
    onPrimaryPress?: () => void,
    secondaryButtonText?: string,
    onSecondaryPress?: () => void,
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      primaryButtonText,
      onPrimaryPress,
      secondaryButtonText,
      onSecondaryPress,
    });
  };

  if (!visible || !item) return null;

  const isSeller = currentUserId === item.sellerId;
  const hasPhotos = Array.isArray(item.images) && item.images.length > 0;

  const handleApprove = async () => {
    try {
      setLoadingActionText('Approving listing...');
      setLoadingAction(true);
      await onApprove?.(item.id);
      showModal(
        'Approved',
        'Listing has been approved and is now live on the campus marketplace!',
        'success',
        'OK',
        onClose,
      );
    } catch (e: any) {
      showModal('Error', e?.message || 'Could not approve listing.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoadingActionText('Rejecting listing...');
      setLoadingAction(true);
      await onReject?.(item.id, rejectReason.trim() || undefined);
      setRejectPrompt(false);
      setRejectReason('');
      showModal('Rejected', 'Listing has been rejected.', 'success', 'OK', onClose);
    } catch (e: any) {
      showModal('Error', e?.message || 'Could not reject listing.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkSold = async () => {
    try {
      setLoadingActionText('Updating status...');
      setLoadingAction(true);
      await onMarkSold?.(item.id);
      showModal('Updated', 'Item has been marked as sold.', 'success', 'OK', onClose);
    } catch (e: any) {
      showModal('Error', e?.message || 'Could not mark item as sold.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = () => {
    showModal(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing?',
      'warning',
      'Delete',
      async () => {
        try {
          setLoadingActionText('Deleting listing...');
          setLoadingAction(true);
          await onDelete?.(item.id);
          onClose();
        } catch (e: any) {
          showModal('Error', e?.message || 'Could not delete listing.', 'error');
        } finally {
          setLoadingAction(false);
        }
      },
      'Cancel',
      () => setModalConfig((prev) => ({ ...prev, visible: false })),
    );
  };

  const isOfficialAdmin =
    item.sellerRole?.toUpperCase() === 'CAMPUS_ADMIN' ||
    item.sellerRole?.toUpperCase() === 'ADMIN' ||
    item.sellerRole?.toLowerCase() === 'campus_admin' ||
    item.sellerRole?.toLowerCase() === 'admin';

  const handleChatSeller = () => {
    setContactSheetVisible(false);
    onClose();
    router.push({
      pathname: '/inbox',
      params: {
        recipientId: item.sellerId,
        recipientName: item.sellerName,
      },
    });
  };

  const handleCallSeller = () => {
    if (!item.contactPhone) return;
    const phoneUrl = `tel:${item.contactPhone.replace(/\s+/g, '')}`;
    Linking.openURL(phoneUrl).catch(() => {
      showModal('Call Failed', 'Unable to initiate phone call on this device.', 'error');
    });
  };

  const handleWhatsAppSeller = () => {
    if (!item.contactPhone) return;
    const cleanNumber = item.contactPhone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(
      `Hi ${item.sellerName}, I saw your listing for "${item.title}" (₹${item.price}) on Supercampus Marketplace. Is it still available?`
    );
    const waUrl = `whatsapp://send?phone=${cleanNumber}&text=${message}`;
    const webWaUrl = `https://wa.me/${cleanNumber.replace('+', '')}?text=${message}`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          return Linking.openURL(webWaUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webWaUrl).catch(() => {
          showModal('WhatsApp Failed', 'Unable to open WhatsApp.', 'error');
        });
      });
  };

  const handleEmailSeller = () => {
    if (!item.contactEmail) return;
    const subject = encodeURIComponent(`Inquiry about ${item.title} on Supercampus Marketplace`);
    const body = encodeURIComponent(
      `Hi ${item.sellerName},\n\nI'm interested in your marketplace listing "${item.title}" priced at ₹${item.price}.\n\nIs it still available?`
    );
    Linking.openURL(`mailto:${item.contactEmail}?subject=${subject}&body=${body}`).catch(() => {
      showModal('Email Failed', 'Unable to open email client.', 'error');
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Pressable
              onPress={onLikeToggle}
              hitSlop={12}
              style={styles.heartBtn}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={item.isLiked ? Colors.status.error : Colors.text.tertiary}
              />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Main Photo Gallery / Placeholder */}
            {hasPhotos ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.gallery}
              >
                {item.images.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="storefront-outline" size={64} color={Colors.text.tertiary} />
              </View>
            )}

            {/* Price & Status Row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
              {item.status === 'PENDING_APPROVAL' && (
                <View style={[styles.badge, { backgroundColor: Colors.status.warning + '33' }]}>
                  <Text style={[styles.badgeText, { color: Colors.status.warning }]}>Review Pending</Text>
                </View>
              )}
              {item.status === 'REJECTED' && (
                <View style={[styles.badge, { backgroundColor: Colors.status.errorBackground }]}>
                  <Text style={[styles.badgeText, { color: Colors.status.error }]}>Rejected</Text>
                </View>
              )}
              {item.status === 'SOLD' && (
                <View style={[styles.badge, { backgroundColor: Colors.background.elevated }]}>
                  <Text style={[styles.badgeText, { color: Colors.text.tertiary }]}>Sold</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Official Store Banner if listed by Admin */}
            {isOfficialAdmin && (
              <View style={styles.officialStoreBanner}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.primary.accent} />
                <Text style={styles.officialStoreBannerText}>Official Campus Admin Listing</Text>
              </View>
            )}

            {/* Tags: Condition & Category */}
            <View style={styles.tagsRow}>
              <View style={styles.conditionTag}>
                <Text style={styles.conditionTagText}>Condition: {item.condition}</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.descSectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>

            {/* Rejection notice if rejected */}
            {item.status === 'REJECTED' && item.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionTitle}>Admin Feedback:</Text>
                <Text style={styles.rejectionBody}>{item.rejectionReason}</Text>
              </View>
            )}

            {/* Seller Info Card */}
            <View style={styles.sellerCard}>
              <View style={[styles.sellerAvatar, isOfficialAdmin && { backgroundColor: Colors.primary.main }]}>
                <Text style={styles.sellerAvatarText}>
                  {isOfficialAdmin ? 'ADM' : getInitials(item.sellerName)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.sellerName}>{item.sellerName}</Text>
                  {isOfficialAdmin && (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary.accent} />
                  )}
                </View>
                <Text style={styles.sellerRole}>
                  {isOfficialAdmin ? 'Campus Admin (Official)' : 'Student Seller'}
                </Text>
                {(item.contactPhone || item.contactEmail) && (
                  <View style={styles.sellerContactChipsRow}>
                    {item.contactPhone && (
                      <Pressable style={styles.sellerContactChip} onPress={handleCallSeller}>
                        <Ionicons name="call-outline" size={11} color={Colors.primary.accent} />
                        <Text style={styles.sellerContactChipText}>{item.contactPhone}</Text>
                      </Pressable>
                    )}
                    {item.contactEmail && (
                      <Pressable style={styles.sellerContactChip} onPress={handleEmailSeller}>
                        <Ionicons name="mail-outline" size={11} color={Colors.primary.accent} />
                        <Text style={styles.sellerContactChipText}>{item.contactEmail}</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.likesBadge}>
                <Ionicons name="heart" size={14} color={Colors.status.error} />
                <Text style={styles.likesBadgeText}>{item.likeCount} likes</Text>
              </View>
            </View>

            {/* Rejection input box if triggered */}
            {rejectPrompt && (
              <View style={styles.rejectInputCard}>
                <Text style={styles.rejectLabel}>Reason for rejection:</Text>
                <TextInput
                  style={styles.rejectInput}
                  placeholder="e.g. Prohibited item or inappropriate content"
                  placeholderTextColor={Colors.text.tertiary}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                />
                <View style={styles.rejectActionsRow}>
                  <Pressable
                    style={[styles.smallBtn, { backgroundColor: Colors.background.elevated }]}
                    onPress={() => setRejectPrompt(false)}
                  >
                    <Text style={styles.smallBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.smallBtn, { backgroundColor: Colors.status.error }]}
                    onPress={handleReject}
                    disabled={loadingAction}
                  >
                    {loadingAction ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.smallBtnText}>Confirm Rejection</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Actions Toolbar */}
            <View style={styles.actionsContainer}>
              {/* If Admin and item is PENDING_APPROVAL -> Approve & Reject buttons */}
              {isAdmin && item.status === 'PENDING_APPROVAL' && !rejectPrompt && (
                <View style={styles.adminActionRow}>
                  <Pressable
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={handleApprove}
                    disabled={loadingAction}
                  >
                    {loadingAction ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Approve Listing</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => setRejectPrompt(true)}
                    disabled={loadingAction}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </Pressable>
                </View>
              )}

              {/* Mark as sold (Seller or Admin) */}
              {(isSeller || isAdmin) && item.status !== 'SOLD' && (
                <Pressable
                  style={[styles.actionBtn, styles.markSoldBtn]}
                  onPress={handleMarkSold}
                  disabled={loadingAction}
                >
                  <Ionicons name="pricetag-outline" size={18} color={Colors.text.secondary} />
                  <Text style={styles.markSoldBtnText}>Mark as Sold</Text>
                </Pressable>
              )}

              {/* Contact Seller (for other campus users) */}
              {!isSeller && item.status === 'APPROVED' && (
                <Pressable
                  style={[styles.actionBtn, styles.contactBtn]}
                  onPress={() => setContactSheetVisible(true)}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.contactBtnText}>Message / Contact Seller</Text>
                </Pressable>
              )}

              {/* Delete button (Seller or Admin) */}
              {(isSeller || isAdmin) && (
                <Pressable
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={handleDelete}
                  disabled={loadingAction}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
                  <Text style={styles.deleteBtnText}>
                    {isAdmin && !isSeller ? 'Admin Delete Product' : 'Delete Listing'}
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>

      {/* Contact Options Sheet Modal */}
      <Modal
        visible={contactSheetVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setContactSheetVisible(false)}
      >
        <View style={styles.contactSheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactSheetVisible(false)} />
          <View style={styles.contactSheetContainer}>
            <View style={styles.contactSheetHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.contactSheetTitle}>Contact {item.sellerName}</Text>
                <Text style={styles.contactSheetSubtitle} numberOfLines={1}>
                  {item.title} • ₹{Number(item.price).toFixed(2)}
                </Text>
              </View>
              <Pressable
                onPress={() => setContactSheetVisible(false)}
                hitSlop={10}
                style={styles.contactSheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.contactSheetActions}>
              {/* Option 1: Chat on Supercampus */}
              <Pressable style={styles.contactOptionPrimary} onPress={handleChatSeller}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactOptionPrimaryTitle}>Chat on Supercampus</Text>
                  <Text style={styles.contactOptionPrimarySubtitle}>
                    Instant direct messaging inside campus
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </Pressable>

              {/* Option 2: WhatsApp (if phone available) */}
              {item.contactPhone ? (
                <Pressable style={styles.contactOptionSecondary} onPress={handleWhatsAppSeller}>
                  <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactOptionSecondaryTitle}>WhatsApp</Text>
                    <Text style={styles.contactOptionSecondarySubtitle}>{item.contactPhone}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={Colors.text.secondary} />
                </Pressable>
              ) : null}

              {/* Option 3: Phone Call (if phone available) */}
              {item.contactPhone ? (
                <Pressable style={styles.contactOptionSecondary} onPress={handleCallSeller}>
                  <Ionicons name="call-outline" size={20} color={Colors.primary.accent} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactOptionSecondaryTitle}>Phone Call</Text>
                    <Text style={styles.contactOptionSecondarySubtitle}>{item.contactPhone}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={Colors.text.secondary} />
                </Pressable>
              ) : null}

              {/* Option 4: Email (if email available) */}
              {item.contactEmail ? (
                <Pressable style={styles.contactOptionSecondary} onPress={handleEmailSeller}>
                  <Ionicons name="mail-outline" size={20} color={Colors.primary.accent} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactOptionSecondaryTitle}>Send Email</Text>
                    <Text style={styles.contactOptionSecondarySubtitle}>{item.contactEmail}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={Colors.text.secondary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryButtonText}
        onPrimaryPress={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          modalConfig.onPrimaryPress?.();
        }}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onSecondaryPress={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          modalConfig.onSecondaryPress?.();
        }}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />

      {loadingAction && <LogoLoader overlay text={loadingActionText} />}
    </Modal>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      height: '88%',
      backgroundColor: Colors.background.canvas,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: Colors.border.card,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
    },
    closeBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      flex: 1,
      marginHorizontal: 12,
    },
    heartBtn: {
      padding: 4,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    gallery: {
      height: 240,
      borderRadius: 16,
      marginBottom: 16,
    },
    galleryImage: {
      width: 320,
      height: 240,
      borderRadius: 16,
      marginRight: 10,
    },
    placeholderBox: {
      height: 200,
      backgroundColor: Colors.background.surface,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border.card,
      marginBottom: 16,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    price: {
      fontFamily: Typography.bold,
      fontSize: 24,
      fontWeight: '800',
      color: Colors.primary.accent,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 12,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    conditionTag: {
      backgroundColor: Colors.primary.glow,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    conditionTagText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      fontWeight: '600',
      color: Colors.primary.lavender,
      textTransform: 'capitalize',
    },
    categoryTag: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    categoryTagText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      fontWeight: '500',
      color: Colors.text.secondary,
    },
    descSectionTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.secondary,
      marginBottom: 6,
    },
    description: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 22,
      color: Colors.text.primary,
      marginBottom: 20,
    },
    rejectionBox: {
      backgroundColor: Colors.status.errorBackground,
      borderColor: Colors.status.error,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    rejectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.status.error,
      marginBottom: 4,
    },
    rejectionBody: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.primary,
    },
    sellerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.card,
      padding: 12,
      marginBottom: 24,
    },
    sellerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sellerAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
    sellerName: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    sellerRole: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    likesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.background.elevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    likesBadgeText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
      fontWeight: '600',
    },
    rejectInputCard: {
      backgroundColor: Colors.background.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    rejectLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: 8,
    },
    rejectInput: {
      fontFamily: Typography.regular,
      backgroundColor: Colors.background.input,
      borderRadius: 8,
      padding: 10,
      color: Colors.text.primary,
      fontSize: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    rejectActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    smallBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    smallBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    actionsContainer: {
      gap: 10,
    },
    adminActionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 14,
    },
    approveBtn: {
      flex: 1,
      backgroundColor: Colors.status.success,
    },
    rejectBtn: {
      flex: 1,
      backgroundColor: Colors.status.error,
    },
    actionBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    contactBtn: {
      backgroundColor: Colors.primary.main,
    },
    contactBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    markSoldBtn: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    markSoldBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    deleteBtn: {
      backgroundColor: 'transparent',
    },
    deleteBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.status.error,
    },
    officialStoreBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB20',
      borderWidth: 1,
      borderColor: '#2563EB80',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      marginBottom: 12,
    },
    officialStoreBannerText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.primary.accent,
    },
    sellerContactChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    sellerContactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.background.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    sellerContactChipText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.primary,
    },
    contactSheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    contactSheetContainer: {
      backgroundColor: Colors.background.canvas,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: Colors.border.card,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    contactSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    contactSheetTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    contactSheetSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    contactSheetCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactSheetActions: {
      gap: 10,
    },
    contactOptionPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary.main,
      padding: 14,
      borderRadius: 14,
    },
    contactOptionPrimaryTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    contactOptionPrimarySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 1,
    },
    contactOptionSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      padding: 14,
      borderRadius: 14,
    },
    contactOptionSecondaryTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    contactOptionSecondarySubtitle: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 1,
    },
  });
}
