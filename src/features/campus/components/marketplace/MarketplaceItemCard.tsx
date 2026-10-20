import { Ionicons } from '@expo/vector-icons';
import React, { memo, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { MarketplaceItem } from '../../marketplace-types';

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  onPress: () => void;
  onLikeToggle?: () => void;
  showStatusBadge?: boolean;
}

export const MarketplaceItemCard = memo(function MarketplaceItemCard({
  item,
  onPress,
  onLikeToggle,
  showStatusBadge = false,
}: MarketplaceItemCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const hasImage = Array.isArray(item.images) && item.images.length > 0 && !!item.images[0];

  const renderStatusBadge = () => {
    if (!showStatusBadge && item.status === 'APPROVED') return null;

    if (item.status === 'PENDING_APPROVAL') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: Colors.status.warning + '33', borderColor: Colors.status.warning }]}>
          <Text style={[styles.statusBadgeText, { color: Colors.status.warning }]}>Review Pending</Text>
        </View>
      );
    }
    if (item.status === 'REJECTED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: Colors.status.errorBackground, borderColor: Colors.status.error }]}>
          <Text style={[styles.statusBadgeText, { color: Colors.status.error }]}>Rejected</Text>
        </View>
      );
    }
    if (item.status === 'SOLD') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: Colors.background.elevated, borderColor: Colors.border.subtle }]}>
          <Text style={[styles.statusBadgeText, { color: Colors.text.tertiary }]}>Sold</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {/* Top Image or Storefront Placeholder */}
      <View style={styles.imageContainer}>
        {hasImage ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="storefront-outline" size={42} color={Colors.text.tertiary} />
          </View>
        )}

        {renderStatusBadge()}
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Price */}
        <Text style={styles.priceText}>
          ₹{Number(item.price).toFixed(2)}
        </Text>

        {/* Title */}
        <Text style={styles.titleText} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Condition Badge */}
        <View style={styles.conditionRow}>
          <View style={styles.conditionPill}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>

        {/* Description Snippet */}
        <Text style={styles.descText} numberOfLines={1}>
          {item.description}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer: User Avatar + Name & Heart Like */}
        <View style={styles.footerRow}>
          <View style={styles.sellerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(item.sellerName)}</Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.sellerName}
            </Text>
          </View>

          <Pressable
            style={styles.likeBtn}
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              onLikeToggle?.();
            }}
            accessibilityLabel={`Like item, currently ${item.likeCount} likes`}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={item.isLiked ? Colors.status.error : Colors.text.tertiary}
            />
            <Text style={[styles.likeCount, item.isLiked && { color: Colors.status.error }]}>
              {item.likeCount}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: Colors.border.card,
      overflow: 'hidden',
      marginBottom: 12,
    },
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    imageContainer: {
      width: '100%',
      height: 120,
      backgroundColor: Colors.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.background.elevated,
    },
    statusBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    content: {
      padding: 10,
    },
    priceText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.primary.accent,
      marginBottom: 3,
    },
    titleText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    conditionRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    conditionPill: {
      backgroundColor: Colors.primary.glow,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: Colors.border.subtle,
    },
    conditionText: {
      fontFamily: Typography.semiBold,
      fontSize: 11,
      fontWeight: '600',
      color: Colors.primary.lavender,
      textTransform: 'capitalize',
    },
    descText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 8,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border.subtle,
      marginBottom: 8,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sellerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 6,
    },
    avatarCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: Colors.primary.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 5,
    },
    avatarText: {
      fontFamily: Typography.bold,
      fontSize: 9,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
    sellerName: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
      flex: 1,
    },
    likeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    likeCount: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
      fontWeight: '500',
    },
  });
}
