import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
import {
  CreateMarketplaceItemPayload,
  MarketplaceCategory,
  MarketplaceCondition,
} from '../../marketplace-types';

interface CreateListingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMarketplaceItemPayload) => Promise<void>;
  isAdmin: boolean;
}

const CONDITIONS: MarketplaceCondition[] = ['new', 'like new', 'good', 'fair', 'poor'];

const CATEGORIES: MarketplaceCategory[] = [
  'Uncategorized',
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

export function CreateListingModal({
  visible,
  onClose,
  onSubmit,
  isAdmin,
}: CreateListingModalProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<MarketplaceCondition>('good');
  const [category, setCategory] = useState<MarketplaceCategory>('Uncategorized');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  if (!visible) return null;

  const handlePickPhotos = async () => {
    if (photos.length >= 4) {
      showModal('Photo Limit', 'You can upload a maximum of 4 photos.', 'warning');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showModal(
        'Permission Denied',
        'Camera roll permissions are required to select photos.',
        'error',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...newUris].slice(0, 4));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showModal('Missing Field', 'Please enter a title for your listing.', 'warning');
      return;
    }
    const parsedPrice = parseFloat(price.trim());
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      showModal('Invalid Price', 'Please enter a valid price in ₹.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || 'No description provided',
        price: parsedPrice,
        condition,
        category,
        images: photos,
      });
      // reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCondition('good');
      setCategory('Uncategorized');
      setPhotos([]);
      onClose();
    } catch (err: any) {
      showModal(
        'Submission Error',
        err?.message || 'Could not create listing. Please try again.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>List an item</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Share something useful with your campus.</Text>

        {/* Title */}
        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor={Colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor={Colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price */}
        <TextInput
          style={styles.input}
          placeholder="Price (₹)"
          placeholderTextColor={Colors.text.tertiary}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Condition Section */}
        <Text style={styles.sectionLabel}>Condition</Text>
        <View style={styles.pillsRow}>
          {CONDITIONS.map((c) => {
            const isSelected = condition === c;
            return (
              <Pressable
                key={c}
                style={[
                  styles.pill,
                  isSelected && styles.pillActive,
                ]}
                onPress={() => setCondition(c)}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextActive,
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Category Section */}
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.pillsRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <Pressable
                key={cat}
                style={[
                  styles.pill,
                  isSelected && styles.pillActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Product Photos Section */}
        <Text style={styles.sectionLabel}>Product photos *</Text>
        <Text style={styles.photoHint}>
          Add 1–4 photos. JPEG, PNG or WebP; up to 10 MB each.
        </Text>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbContainer}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  style={styles.removePhotoBtn}
                  onPress={() => removePhoto(idx)}
                  hitSlop={6}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.status.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={styles.choosePhotosBtn}
          onPress={handlePickPhotos}
        >
          <Ionicons name="images-outline" size={18} color={Colors.primary.accent} style={{ marginRight: 6 }} />
          <Text style={styles.choosePhotosText}>
            {photos.length === 0 ? 'Choose product photos' : `Add more (${photos.length}/4)`}
          </Text>
        </Pressable>

        {/* Role moderation notice */}
        <View style={styles.noticeBox}>
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : 'time-outline'}
            size={18}
            color={isAdmin ? Colors.status.success : Colors.status.warning}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text style={styles.noticeText}>
            {isAdmin
              ? 'Admin Mode: Your listing will be published immediately without review.'
              : 'Student Listing: Your item will be reviewed and approved by Campus Admin before appearing publicly.'}
          </Text>
        </View>

        {/* Bottom Publish Button */}
        <Pressable
          style={[styles.publishBtn, submitting && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.text.onBrand} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>Publish listing</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

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

      {submitting && <LogoLoader overlay text="Publishing listing..." />}
    </KeyboardAvoidingView>
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
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 14 : 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
    },
    backBtn: {
      marginRight: 14,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    subtitle: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
      marginBottom: 18,
    },
    input: {
      fontFamily: Typography.regular,
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: Colors.text.primary,
      fontSize: 15,
      marginBottom: 16,
    },
    textArea: {
      minHeight: 100,
    },
    sectionLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 15,
      fontWeight: '600',
      color: Colors.text.primary,
      marginTop: 6,
      marginBottom: 10,
    },
    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 18,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      backgroundColor: Colors.background.surface,
    },
    pillActive: {
      backgroundColor: Colors.primary.cyan,
      borderColor: Colors.primary.light,
    },
    pillText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '500',
      color: Colors.text.secondary,
    },
    pillTextActive: {
      color: Colors.text.onBrand,
      fontWeight: '600',
    },
    photoHint: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 12,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12,
    },
    photoThumbContainer: {
      position: 'relative',
      width: 70,
      height: 70,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    photoThumb: {
      width: '100%',
      height: '100%',
    },
    removePhotoBtn: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 10,
    },
    choosePhotosBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.primary.accent,
      borderRadius: 22,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
      backgroundColor: Colors.background.surface,
      marginBottom: 20,
    },
    choosePhotosText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary.accent,
    },
    noticeBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 24,
    },
    noticeText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      lineHeight: 18,
      color: Colors.text.secondary,
      flex: 1,
    },
    publishBtn: {
      backgroundColor: Colors.primary.accent,
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Colors.primary.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    publishBtnDisabled: {
      opacity: 0.6,
    },
    publishBtnText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
  });
}
