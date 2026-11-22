import { Ionicons } from '@expo/vector-icons';
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
import { useAuthSession } from '@/features/auth';
import { CreateClubPayload } from '../types/connect-types';
import { createClubApi } from '../api/connect-api';

interface CreateClubScreenProps {
  campusName: string;
  token: string;
  tenantId: string;
  onBack: () => void;
  onClubCreated: () => void;
}

const CATEGORIES = [
  'Technical',
  'Coding',
  'Cultural & Arts',
  'Robotics & IoT',
  'Professional',
  'Social & Leadership',
  'Sports & Fitness',
];

export function CreateClubScreen({
  campusName,
  token,
  tenantId,
  onBack,
  onClubCreated,
}: CreateClubScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = createStyles(Colors, isDark);
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Technical');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [leadName, setLeadName] = useState(user?.fullName || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [roomOrVenue, setRoomOrVenue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for the club.');
      return;
    }
    const finalCategory = customCategory.trim() || selectedCategory;
    if (!finalCategory) {
      Alert.alert('Required', 'Please select or enter a club category.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a short description of the club.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateClubPayload = {
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        leadName: leadName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        meetingSchedule: meetingSchedule.trim() || undefined,
        roomOrVenue: roomOrVenue.trim() || undefined,
      };

      await createClubApi(token, tenantId, payload);
      Alert.alert(
        'Club Registered! 🎉',
        `"${name.trim()}" is now active in ${campusName} Connect. Students can now discover and join your club!`,
        [{ text: 'Great!', onPress: onClubCreated }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create club. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* 1. Header Navigation */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={styles.backRow}>
          <Ionicons
            name="arrow-back"
            size={18}
            color={isDark ? Colors.primary.cyan : Colors.primary.main}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.backText}>Back to Clubs</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Register New Club</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Intro Banner */}
        <View style={styles.introCard}>
          <Ionicons name="people" size={24} color="#38BDF8" style={{ marginBottom: 6 }} />
          <Text style={styles.introTitle}>Launch a Campus Club</Text>
          <Text style={styles.introSubtitle}>
            Bring students, tech enthusiasts, and creators together at {campusName}.
          </Text>
        </View>

        {/* Club Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Club Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="e.g. Google Developer Student Club (GDSC)"
            placeholderTextColor={Colors.text.tertiary}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryPillsWrap}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCustomCategory('');
                  }}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}>
                  <Text
                    style={[
                      styles.categoryPillText,
                      active && styles.categoryPillTextActive,
                    ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            About the Club <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Describe your club's vision, weekly activities, hackathons, and benefits for students..."
            placeholderTextColor={Colors.text.tertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Lead Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Lead / President Name</Text>
          <TextInput
            placeholder="e.g. Aryan Deshmukh"
            placeholderTextColor={Colors.text.tertiary}
            value={leadName}
            onChangeText={setLeadName}
            style={styles.input}
          />
        </View>

        {/* Official Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Contact Email</Text>
          <TextInput
            placeholder="e.g. club.gdsc@nmit.ac.in"
            placeholderTextColor={Colors.text.tertiary}
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Meeting Schedule */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Meeting Schedule</Text>
          <TextInput
            placeholder="e.g. Wednesdays & Saturdays · 4:30 PM"
            placeholderTextColor={Colors.text.tertiary}
            value={meetingSchedule}
            onChangeText={setMeetingSchedule}
            style={styles.input}
          />
        </View>

        {/* Venue / Room */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Room / Venue</Text>
          <TextInput
            placeholder="e.g. CS Seminar Hall 2, Academic Block 2"
            placeholderTextColor={Colors.text.tertiary}
            value={roomOrVenue}
            onChangeText={setRoomOrVenue}
            style={styles.input}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Publish Club</Text>
            </>
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
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    backText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
      fontWeight: '500',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    introCard: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.06)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.2)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
    },
    introTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginBottom: 3,
    },
    introSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      lineHeight: 18,
    },
    fieldGroup: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: 7,
    },
    required: {
      color: '#EF4444',
    },
    input: {
      backgroundColor: Colors.background.elevated,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    textArea: {
      minHeight: 90,
      paddingTop: 12,
    },
    categoryPillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      backgroundColor: Colors.background.elevated,
    },
    categoryPillActive: {
      backgroundColor: Colors.primary.main,
      borderColor: Colors.primary.main,
    },
    categoryPillText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
      fontWeight: '500',
    },
    categoryPillTextActive: {
      color: '#FFFFFF',
      fontFamily: Typography.bold,
      fontWeight: '700',
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary.main,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 10,
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    btnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.99 }],
    },
  });
}
