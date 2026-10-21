import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { CreateEventPayload } from '../types/connect-types';
import { createEventApi } from '../api/connect-api';

interface CreateEventScreenProps {
  campusName: string;
  token: string;
  tenantId: string;
  onBack: () => void;
  onEventCreated: () => void;
}

export function CreateEventScreen({
  campusName,
  token,
  tenantId,
  onBack,
  onEventCreated,
}: CreateEventScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = createStyles(Colors, isDark);
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an event title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter event description and participation details.');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Required Field', 'Please enter the venue.');
      return;
    }
    if (!startsAt.trim()) {
      Alert.alert('Required Field', 'Please enter event start time (yyyy-MM-dd HH:mm).');
      return;
    }
    if (!endsAt.trim()) {
      Alert.alert('Required Field', 'Please enter event end time (yyyy-MM-dd HH:mm).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        startsAt: startsAt.trim(),
        endsAt: endsAt.trim(),
        capacity: capacity.trim() ? parseInt(capacity.trim(), 10) : undefined,
      };

      await createEventApi(token, tenantId, payload);
      Alert.alert('Success', 'Campus event published successfully!', [
        {
          text: 'OK',
          onPress: onEventCreated,
        },
      ]);
    } catch (err: any) {
      Alert.alert('Publish Error', err?.message || 'Could not publish event. Please check date format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 1. Header matching Image 5: "Back" & "Create event" */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={12}
          style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create event</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 2. Subtitle hint matching Image 5 */}
        <Text style={styles.contextHint}>
          Visible to {campusName} campus members. Times use Asia/Kolkata.
        </Text>

        {/* 3. Event title */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 4. Description and participation details */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description and participation details"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInput]}
          />
        </View>

        {/* 5. Venue */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="Venue"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 6. Starts (yyyy-MM-dd HH:mm) */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="Starts (yyyy-MM-dd HH:mm)"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 7. Ends (yyyy-MM-dd HH:mm) */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={endsAt}
            onChangeText={setEndsAt}
            placeholder="Ends (yyyy-MM-dd HH:mm)"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 8. Capacity (optional) */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Capacity (optional)"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            keyboardType="numeric"
            style={styles.inputField}
          />
        </View>

        {/* 9. Publish button matching Image 5 */}
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handlePublish}
          style={({ pressed }) => [styles.publishBtn, pressed && styles.btnPressed]}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishText}>Publish</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    backBtn: {
      padding: 6,
    },
    backBtnText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 40,
    },
    contextHint: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.secondary,
      marginBottom: 18,
    },
    fieldContainer: {
      marginBottom: 14,
    },
    inputField: {
      backgroundColor: Colors.background.input,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: Colors.border.card,
      paddingHorizontal: 16,
      height: 52,
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.primary,
    },
    multilineInput: {
      height: 120,
      paddingTop: 14,
    },
    publishBtn: {
      backgroundColor: Colors.primary.main,
      borderRadius: 22,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.2)',
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.45 : 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    publishText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
