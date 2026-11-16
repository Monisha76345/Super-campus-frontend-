import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { PostVisibility } from '../types/community-types';

interface PostComposerProps {
  userInitial?: string;
  isSubmitting?: boolean;
  onClose?: () => void;
  onSubmit: (content: string, mediaUrls: string[], visibility: PostVisibility) => Promise<boolean>;
}

export function PostComposer({
  userInitial = 'U',
  isSubmitting = false,
  onClose,
  onSubmit,
}: PostComposerProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('CAMPUS');
  const [selectedMedia, setSelectedMedia] = useState<Array<{ uri: string; type: 'image' | 'video'; duration?: number }>>([]);
  const [showMediaChoiceModal, setShowMediaChoiceModal] = useState(false);

  const processPickedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const isVideo =
      asset.type === 'video' ||
      (asset.mimeType && asset.mimeType.startsWith('video/')) ||
      /\.(mp4|mov|m4v|webm)$/i.test(asset.uri);

    let durationSec: number | undefined;
    if (asset.duration) {
      durationSec =
        asset.duration > 1000 ? Math.round(asset.duration / 1000) : Math.round(asset.duration);
      if (isVideo && durationSec > 150) {
        Alert.alert(
          'Video Too Long',
          `Selected video is ${durationSec}s. Supercampus allows videos up to 150 seconds (2.5 mins).`,
        );
        return null;
      }
    }

    return {
      uri: asset.uri,
      type: (isVideo ? 'video' : 'image') as 'image' | 'video',
      duration: durationSec,
    };
  };

  const handlePickFromGallery = async (mediaType: 'image' | 'video') => {
    setShowMediaChoiceModal(false);
    if (selectedMedia.length >= 4) {
      Alert.alert('Limit Reached', 'You can attach up to 4 photos or videos.');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow photo/video access in device settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ['videos'] : ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - selectedMedia.length,
      videoMaxDuration: 150,
      quality: 0.85,
    });

    if (!result.canceled && result.assets) {
      const items: Array<{ uri: string; type: 'image' | 'video'; duration?: number }> = [];
      for (const asset of result.assets) {
        const processed = processPickedAsset(asset);
        if (processed) items.push(processed);
      }
      setSelectedMedia((prev) => [...prev, ...items].slice(0, 4));
    }
  };

  const handleCaptureCamera = async (mediaType: 'image' | 'video') => {
    setShowMediaChoiceModal(false);
    if (selectedMedia.length >= 4) {
      Alert.alert('Limit Reached', 'You can attach up to 4 photos or videos.');
      return;
    }

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow camera access in device settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mediaType === 'video' ? ['videos'] : ['images'],
      videoMaxDuration: 150,
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const processed = processPickedAsset(result.assets[0]);
      if (processed) {
        setSelectedMedia((prev) => [...prev, processed].slice(0, 4));
      }
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && selectedMedia.length === 0) {
      Alert.alert('Empty Post', 'Please write a message or select a photo/video to share.');
      return;
    }

    const success = await onSubmit(
      content,
      selectedMedia.map((m) => m.uri),
      visibility,
    );
    if (success) {
      setContent('');
      setSelectedMedia([]);
      setVisibility('CAMPUS');
      onClose?.();
    }
  };

  const charCount = content.length;

  return (
    <View style={styles.card}>
      {/* Top Header: Avatar + Title + Optional Close */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userInitial.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle}>Share with your campus</Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : Colors.text.secondary} />
          </Pressable>
        )}
      </View>

      {/* Main Text Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Share an update, question, photo, or video (up to 150s)..."
          placeholderTextColor="#64748B"
          multiline
          maxLength={2000}
          style={styles.textInput}
        />
        <Text style={styles.charCounter}>{charCount}/2000</Text>
      </View>

      {/* Media Preview Row if photos/videos picked */}
      {selectedMedia.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
          {selectedMedia.map((media, idx) => (
            <View key={media.uri + idx} style={styles.previewWrapper}>
              <Image source={{ uri: media.uri }} style={styles.previewImage} />
              {media.type === 'video' && (
                <View style={styles.videoBadgeOverlay}>
                  <Ionicons name="videocam" size={12} color="#FFFFFF" />
                  <Text style={styles.videoBadgeDuration}>
                    {media.duration ? `${media.duration}s` : 'Video ≤ 150s'}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => handleRemoveMedia(idx)}
                style={styles.removePhotoBadge}
                hitSlop={4}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Visibility Selectors: Only me, Campus, Public */}
      <View style={styles.visibilityRow}>
        <Pressable
          onPress={() => setVisibility('ONLY_ME')}
          style={[
            styles.visibilityPill,
            visibility === 'ONLY_ME' && styles.visibilityPillActive,
          ]}>
          <Text
            style={[
              styles.visibilityText,
              visibility === 'ONLY_ME' && styles.visibilityTextActive,
            ]}>
            Only me
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setVisibility('CAMPUS')}
          style={[
            styles.visibilityPill,
            visibility === 'CAMPUS' && styles.visibilityPillActive,
          ]}>
          <Text
            style={[
              styles.visibilityText,
              visibility === 'CAMPUS' && styles.visibilityTextActive,
            ]}>
            Campus
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setVisibility('PUBLIC')}
          style={[
            styles.visibilityPill,
            visibility === 'PUBLIC' && styles.visibilityPillActive,
          ]}>
          <Text
            style={[
              styles.visibilityText,
              visibility === 'PUBLIC' && styles.visibilityTextActive,
            ]}>
            Public
          </Text>
        </Pressable>
      </View>

      {/* Bottom Actions: Photo/Video Choice Trigger + Post Button */}
      <View style={styles.bottomRow}>
        <View style={styles.mediaButtonColumn}>
          <Pressable
            onPress={() => setShowMediaChoiceModal(true)}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
            <Ionicons name="camera" size={16} color="#38BDF8" />
            <Text style={styles.photoButtonText}>Add Photo / Video</Text>
          </Pressable>
          <Text style={styles.attachmentMeta}>({selectedMedia.length}/4 attachments · Videos ≤ 150s)</Text>
        </View>

        <Pressable
          onPress={handlePost}
          disabled={isSubmitting || (!content.trim() && selectedMedia.length === 0)}
          style={({ pressed }) => [
            styles.postButton,
            (!content.trim() && selectedMedia.length === 0) && styles.postButtonDisabled,
            pressed && styles.pressed,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>

      {/* Media Type & Source Selection Modal */}
      <Modal
        visible={showMediaChoiceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMediaChoiceModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowMediaChoiceModal(false)}>
          <View style={styles.choiceCard}>
            <Text style={styles.choiceTitle}>Select Media to Attach</Text>
            <Text style={styles.choiceSubtitle}>Upload photos or videos up to 150 seconds</Text>

            <View style={styles.choiceOptionsGrid}>
              {/* Option 1: Capture Photo */}
              <Pressable
                onPress={() => handleCaptureCamera('image')}
                style={styles.choiceOptionItem}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="camera" size={22} color="#38BDF8" />
                </View>
                <Text style={styles.choiceOptionLabel}>Take Photo</Text>
              </Pressable>

              {/* Option 2: Record Video (150s) */}
              <Pressable
                onPress={() => handleCaptureCamera('video')}
                style={styles.choiceOptionItem}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Ionicons name="videocam" size={22} color="#EC4899" />
                </View>
                <Text style={styles.choiceOptionLabel}>Record Video</Text>
                <Text style={styles.choiceBadge}>≤ 150s</Text>
              </Pressable>

              {/* Option 3: Choose Photo from Gallery */}
              <Pressable
                onPress={() => handlePickFromGallery('image')}
                style={styles.choiceOptionItem}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
                  <Ionicons name="images" size={22} color="#818CF8" />
                </View>
                <Text style={styles.choiceOptionLabel}>Photo Gallery</Text>
              </Pressable>

              {/* Option 4: Choose Video from Gallery (150s) */}
              <Pressable
                onPress={() => handlePickFromGallery('video')}
                style={styles.choiceOptionItem}>
                <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="film" size={22} color="#10B981" />
                </View>
                <Text style={styles.choiceOptionLabel}>Video Gallery</Text>
                <Text style={styles.choiceBadge}>≤ 150s</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowMediaChoiceModal(false)}
              style={styles.cancelChoiceBtn}>
              <Text style={styles.cancelChoiceText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    avatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? '#0E7490' : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      flex: 1,
    },
    closeBtn: {
      padding: 4,
    },
    inputContainer: {
      backgroundColor: isDark ? '#090D16' : '#F8FAFC',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 12,
      minHeight: 90,
      justifyContent: 'space-between',
    },
    textInput: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
      textAlignVertical: 'top',
      minHeight: 60,
    },
    charCounter: {
      fontFamily: Typography.medium,
      fontSize: 10.5,
      color: Colors.text.secondary,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    previewScroll: {
      flexDirection: 'row',
      marginTop: 10,
    },
    previewWrapper: {
      position: 'relative',
      marginRight: 10,
    },
    previewImage: {
      width: 65,
      height: 65,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.1)',
    },
    removePhotoBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 10,
    },
    videoBadgeOverlay: {
      position: 'absolute',
      bottom: 2,
      left: 2,
      right: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderRadius: 4,
      paddingVertical: 1,
    },
    videoBadgeDuration: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    visibilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      marginBottom: 14,
    },
    visibilityPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: isDark ? '#090D16' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    visibilityPillActive: {
      backgroundColor: isDark ? '#0369A1' : Colors.primary.main,
      borderColor: isDark ? '#38BDF8' : Colors.primary.main,
    },
    visibilityText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    visibilityTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    mediaButtonColumn: {
      alignItems: 'flex-start',
    },
    photoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(49, 52, 145, 0.15)',
    },
    photoButtonText: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#F8FAFC' : Colors.text.primary,
    },
    attachmentMeta: {
      fontFamily: Typography.regular,
      fontSize: 10,
      color: Colors.text.secondary,
      marginTop: 4,
    },
    postButton: {
      paddingHorizontal: 22,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: isDark ? '#2563EB' : Colors.primary.main,
      minWidth: 70,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postButtonDisabled: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      opacity: 0.6,
    },
    postButtonText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.7,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    choiceCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 22,
      padding: 20,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
    },
    choiceTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      textAlign: 'center',
    },
    choiceSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      textAlign: 'center',
      marginTop: 3,
      marginBottom: 16,
    },
    choiceOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    choiceOptionItem: {
      width: '48%',
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.08)',
    },
    choiceIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    choiceOptionLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.primary,
      fontWeight: '600',
    },
    choiceBadge: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#38BDF8',
      marginTop: 2,
    },
    cancelChoiceBtn: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    cancelChoiceText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      color: Colors.text.secondary,
    },
  });
}
