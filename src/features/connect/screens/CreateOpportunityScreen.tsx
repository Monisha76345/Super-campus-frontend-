import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
  const { user } = useAuthSession();

  const isInternship = type === 'INTERNSHIP';
  const screenTitle = isInternship ? 'Create internship' : 'Create job';

  const roleNorm = (user?.role || '').toLowerCase().replace(/[-_]/g, '');
  const canPostJob =
    roleNorm === 'alumni' ||
    roleNorm === 'faculty' ||
    roleNorm === 'admin' ||
    roleNorm === 'superadmin' ||
    roleNorm === 'campusadmin';

  // Role restriction for jobs: only alumni, admin, and faculty can post
  useEffect(() => {
    if (type === 'JOB' && !canPostJob) {
      Alert.alert(
        'Posting Restricted 🔒',
        'Only Alumni, Faculty, and Campus Administrators are authorized to post job openings. Students can browse and apply directly.',
        [{ text: 'Understood', onPress: onBack }],
      );
    }
  }, [type, canPostJob, onBack]);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [stipendOrSalary, setStipendOrSalary] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachedDoc, setAttachedDoc] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        setAttachedDoc({
          uri: file.uri,
          name: file.name,
          size: file.size,
        });
      }
    } catch (err: any) {
      Alert.alert('File Selection', err?.message || 'Could not pick document.');
    }
  };

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
        documentUrl: attachedDoc?.uri,
        documentName: attachedDoc?.name,
      };

      const effectiveToken = token || user?.token || '';
      await createOpportunityApi(effectiveToken, tenantId, payload);
      Alert.alert(
        'Success 🎉',
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
      {/* 1. Header */}
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
        {/* Context Hint */}
        <Text style={styles.contextHint}>
          Visible to {campusName} campus members. Times use Asia/Kolkata.
        </Text>

        {/* 2. Position title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Position Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isInternship ? 'e.g. Frontend Engineering Intern' : 'e.g. Junior Software Engineer'}
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 3. Company / organization */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Company / Organization</Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Acme Tech Labs / Alumni Venture"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 4. Responsibilities and full position details */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Role Description & Responsibilities</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter responsibilities, tasks, perks, and expectations..."
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInput]}
          />
        </View>

        {/* 5. Document Upload Section (PDF / Doc criteria) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Attach Document / JD (PDF, Word, or Image)</Text>
          {attachedDoc ? (
            <View style={styles.docAttachedCard}>
              <View style={styles.docIconWrap}>
                <Ionicons name="document-text" size={20} color="#38BDF8" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>
                  {attachedDoc.name}
                </Text>
                {attachedDoc.size ? (
                  <Text style={styles.docSize}>
                    {(attachedDoc.size / 1024).toFixed(1)} KB
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => setAttachedDoc(null)}
                hitSlop={8}
                style={styles.docRemoveBtn}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickDocument}
              style={({ pressed }) => [styles.docUploadBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name="cloud-upload-outline" size={20} color="#38BDF8" />
              <Text style={styles.docUploadText}>Upload Job Description / Criteria Document</Text>
            </Pressable>
          )}
        </View>

        {/* 6. Location / remote */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Bangalore (Hybrid), Remote, On-site"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 7. Skills, eligibility and duration */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Skills & Eligibility</Text>
          <TextInput
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. React Native, TypeScript, 6th-8th sem students"
            placeholderTextColor={Colors.text.secondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInputSmall]}
          />
        </View>

        {/* 8. Salary / stipend */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Salary / Stipend</Text>
          <TextInput
            value={stipendOrSalary}
            onChangeText={setStipendOrSalary}
            placeholder={isInternship ? 'e.g. ₹25,000 / month' : 'e.g. ₹8 - 12 LPA'}
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 9. Apply before (deadline) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Application Deadline</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            placeholder="e.g. 2026-12-15 or Rolling Basis"
            placeholderTextColor={Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* 10. Publish button */}
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handlePublish}
          style={({ pressed }) => [styles.publishBtn, pressed && styles.btnPressed]}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishText}>Publish Opportunity</Text>
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
      marginBottom: 16,
    },
    fieldContainer: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: Colors.text.primary,
      fontWeight: '600',
      marginBottom: 6,
    },
    inputField: {
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      borderWidth: 1.2,
      borderColor: Colors.border.card,
      paddingHorizontal: 16,
      height: 50,
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    multilineInput: {
      height: 110,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    multilineInputSmall: {
      height: 80,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    docUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: 14,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
      borderStyle: 'dashed',
    },
    docUploadText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: '#38BDF8',
      fontWeight: '600',
    },
    docAttachedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1.2,
      borderColor: '#38BDF8',
      gap: 10,
    },
    docIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    docInfo: {
      flex: 1,
    },
    docName: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.primary,
      fontWeight: '600',
    },
    docSize: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    docRemoveBtn: {
      padding: 4,
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
