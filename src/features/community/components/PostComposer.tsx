import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  onSubmit: (content: string, mediaUrls: string[], visibility: PostVisibility) => Promise<boolean>;
}

export function PostComposer({
  userInitial = 'U',
  isSubmitting = false,
  onSubmit,
}: PostComposerProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('CAMPUS');
  const [selectedMedia, setSelectedMedia] = useState<Array<{ uri: string; type: 'image' | 'video'; duration?: number }>>([]);

  const handlePickMedia = async () => {
    if (selectedMedia.length >= 4) {
      Alert.alert('Attachment Limit', 'You can attach up to 4 photos or videos per post.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow media library access to upload photos or videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - selectedMedia.length,
      videoMaxDuration: 150,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newItems: Array<{ uri: string; type: 'image' | 'video'; duration?: number }> = [];

      for (const asset of result.assets) {
        const isVideo =
          asset.type === 'video' ||
          (asset.mimeType && asset.mimeType.startsWith('video/')) ||
          /\.(mp4|mov|m4v|webm)$/i.test(asset.uri);

        if (isVideo && asset.duration) {
          const durationSec =
            asset.duration > 1000 ? Math.round(asset.duration / 1000) : Math.round(asset.duration);
          if (durationSec > 150) {
            Alert.alert(
              'Video Too Long',
              `The selected video is ${durationSec}s. Posts can only include videos up to 150 seconds (2.5 minutes).`,
            );
            continue;
          }
        }

        const durationSec = asset.duration
          ? asset.duration > 1000
            ? Math.round(asset.duration / 1000)
            : Math.round(asset.duration)
          : undefined;

        newItems.push({
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          duration: durationSec,
        });
      }

      setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 4));
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
    }
  };

  const charCount = content.length;

  return (
    <View style={styles.card}>
      {/* Top Header: Avatar + Title */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userInitial.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle}>Share with your campus</Text>
      </View>

      {/* Main Text Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Share an update, photo, or video (up to 150s)..."
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
                    {media.duration ? `${media.duration}s` : 'Video'}
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

      {/* Bottom Actions: Photo/Video + Post Button */}
      <View style={styles.bottomRow}>
        <View style={styles.mediaButtonColumn}>
          <Pressable
            onPress={handlePickMedia}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
            <Ionicons name="image-outline" size={17} color="#38BDF8" />
            <Text style={styles.photoButtonText}>Photo / Video (≤ 150s)</Text>
          </Pressable>
          <Text style={styles.attachmentMeta}>({selectedMedia.length}/4 attachments)</Text>
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
      width: 32,
      height: 32,
      borderRadius: 16,
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
      width: 60,
      height: 60,
      borderRadius: 8,
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 4,
      paddingVertical: 1,
    },
    videoBadgeDuration: {
      fontSize: 9.5,
      color: '#FFFFFF',
      fontWeight: '600',
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
  });
}
