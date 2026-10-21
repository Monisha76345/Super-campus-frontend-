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
import { CreateOpportunityPayload } from '../types/connect-types';
import { createOpportunityApi } from '../api/connect-api';

interface CreateOpportunityScreenProps {
  campusName: string;
  type: 'INTERNSHIP' | 'JOB';
  token: string;
  tenantId: string;
  onBack: () => void;
  onOpportunityCreated: () => void;
}

export function CreateOpportunityScreen({
  campusName,
  type,
  token,
  tenantId,
  onBack,
  onOpportunityCreated,
}: CreateOpportunityScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = createStyles(Colors, isDark);
  const insets = useSafeAreaInsets();

  const isInternship = type === 'INTERNSHIP';
  const screenTitle = isInternship ? 'Create internship' : 'Create job';

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [stipendOrSalary, setStipendOrSalary] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter position title.');
      return;
    }
    if (!company.trim()) {
      Alert.alert('Required Field', 'Please enter company or organization name.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter responsibilities and full position details.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please enter location (e.g. Bangalore, On-site, Remote).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOpportunityPayload = {
        title: title.trim(),
        company: company.trim(),
        type,
        location: location.trim(),
        description: description.trim(),
        skillsAndEligibility: skills.trim() || undefined,
        stipendOrSalary: stipendOrSalary.trim() || undefined,
        deadline: deadline.trim() || undefined,
      };

      await createOpportunityApi(token, tenantId, payload);
      Alert.alert(
        'Success',
        `${isInternship ? 'Internship' : 'Job'} published successfully!`,
        [
          {
            text: 'OK',
            onPress: onOpportunityCreated,
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Publish Error', err?.message || 'Could not publish opportunity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 1. Header: Back & Title matching Screenshot 2 & 4 */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={12}
          style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 2. Subtitle hint matching Screenshot 2 & 4 */}
        <Text style={styles.contextHint}>
          Visible to {campusName} campus members. Times use Asia/Kolkata.
        </Text>

        {/* 3. Position title */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Position title"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 4. Company / organization */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="Company / organization"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 5. Responsibilities and full position details */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Responsibilities and full position details"
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInput]}
          />
        </View>

        {/* 6. Location / remote */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location / remote"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 7. Skills, eligibility and duration */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={skills}
            onChangeText={setSkills}
            placeholder="Skills, eligibility and duration"
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInputSmall]}
          />
        </View>

        {/* 8. Salary / stipend (or explicitly unpaid) */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={stipendOrSalary}
            onChangeText={setStipendOrSalary}
            placeholder="Salary / stipend (or explicitly unpaid)"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 9. Apply before (yyyy-MM-dd HH:mm) */}
        <View style={styles.fieldContainer}>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            placeholder="Apply before (yyyy-MM-dd HH:mm)"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 10. Publish button matching Screenshot 2 & 4 */}
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
    multilineInputSmall: {
      height: 90,
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
