import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { CreateClubAchievementPayload, CreateClubPayload } from '../types/connect-types';
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

  const roleNorm = (user?.role || '').toLowerCase().replace(/[-_]/g, '');
  const canCreateClub =
    roleNorm === 'admin' ||
    roleNorm === 'superadmin' ||
    roleNorm === 'campusadmin' ||
    roleNorm === 'faculty';

  // Role restriction notice for club registration
  useEffect(() => {
    if (!canCreateClub) {
      Alert.alert(
        'Club Registration Restricted 🔒',
        'Official Club Registration is managed by Campus Administrators & Faculty Coordinators. To propose a new student club, please consult your Faculty Advisor or Student Affairs office.',
        [{ text: 'Understood', onPress: onBack }],
      );
    }
  }, [canCreateClub, onBack]);

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Technical');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [overview, setOverview] = useState('');
  const [leadName, setLeadName] = useState(user?.fullName || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [roomOrVenue, setRoomOrVenue] = useState('');
  const [loading, setLoading] = useState(false);

  // Achievements text state
  const [achievements, setAchievements] = useState('');

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
      const achievementsPayload = achievements.trim()
        ? achievements
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => ({
              title: line.replace(/^[•\-\*]\s*/, ''),
              badgeText: 'Milestone 🏆',
              date: '2026',
            }))
        : undefined;

      const payload: CreateClubPayload = {
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        overview: overview.trim() || undefined,
        achievements: achievementsPayload,
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
          <View style={styles.introBadgeRow}>
            <Ionicons name="shield-checkmark" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.introBadgeText}>Official Club Portal</Text>
          </View>
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

        {/* Short Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Short Summary <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="Describe your club's core purpose in 2-3 lines..."
            placeholderTextColor={Colors.text.tertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, styles.textArea, { minHeight: 75 }]}
          />
        </View>

        {/* Overview Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Overview</Text>
          <TextInput
            placeholder="Enter club overview..."
            placeholderTextColor={Colors.text.tertiary}
            value={overview}
            onChangeText={setOverview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.textArea, { minHeight: 85 }]}
          />
        </View>

        {/* Achievements Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Achievements</Text>
          <TextInput
            placeholder="Enter club achievements..."
            placeholderTextColor={Colors.text.tertiary}
            value={achievements}
            onChangeText={setAchievements}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.textArea, { minHeight: 85 }]}
          />
        </View>

        {/* Lead Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Lead / Coordinator Name</Text>
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
          <Text style={styles.fieldLabel}>Official Contact Email</Text>
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
    introBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    introBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 11.5,
      color: '#38BDF8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
      marginBottom: 18,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    fieldLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    fieldSubLabel: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 8,
      lineHeight: 16,
    },
    subFieldLabel: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 8,
      marginBottom: 4,
    },
    required: {
      color: '#EF4444',
    },
    optional: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.tertiary,
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
    subInput: {
      paddingVertical: 9,
      fontSize: 13.5,
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
    addAchieveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.2)',
    },
    addAchieveBtnText: {
      fontFamily: Typography.bold,
      fontSize: 11.5,
      color: '#38BDF8',
    },
    achievementCard: {
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.08)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    achievementHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    achievementBadgePill: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    achievementBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#38BDF8',
    },
    achievementDateText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
      flex: 1,
      marginLeft: 8,
    },
    removeAchieveBtn: {
      padding: 4,
    },
    achievementTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.primary,
      marginBottom: 2,
    },
    achievementDesc: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      lineHeight: 16,
    },
    addAchieveForm: {
      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.2)',
      borderRadius: 12,
      padding: 14,
      marginTop: 6,
      marginBottom: 10,
    },
    formSectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#38BDF8',
      marginBottom: 4,
    },
    badgePillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
    },
    badgeOptionPill: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgeOptionPillActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      borderColor: '#38BDF8',
    },
    badgeOptionText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    badgeOptionTextActive: {
      color: '#38BDF8',
      fontFamily: Typography.bold,
    },
    addAchieveActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 12,
    },
    cancelAchieveBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    cancelAchieveText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.secondary,
    },
    saveAchieveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveAchieveText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: '#FFFFFF',
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
