import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { DatePickerField } from '@/components/ui';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { openTab } from '@/features/campus/navigation';
import { CsvDirectoryImportModal } from '@/features/campus/components/admin/CsvDirectoryImportModal';

import { profileApi, profilePhotoUri } from '../api/profile-api';
import { ProfileVisibility, ResidencyStatus } from '../enums';
import {
  RESIDENCY_OPTIONS,
  THEME_OPTIONS,
  VISIBILITY_OPTIONS,
  displayName,
  residencyLabel,
  themeDetail,
  themeLabel,
  visibilityLabel,
} from '../labels';
import { CampusProfile, EducationInput, ExperienceInput } from '../types';

type Sheet = 'edit' | 'theme' | 'education' | 'experience' | 'photo' | null;

const EMPTY_EDUCATION: EducationInput = { school: '', degree: '', visibility: ProfileVisibility.Campus };
const EMPTY_EXPERIENCE: ExperienceInput = { employer: '', title: '', current: false, visibility: ProfileVisibility.Public };

const DEFAULT_COVER_URI =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop';

function useProfileStyles() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  return { ...theme, Colors: theme.colors, styles };
}

export function ProfileScreen() {
  const { preference: theme, setPreference, colors: Colors, styles } = useProfileStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isReady, signOut } = useAuthSession();
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState<CampusProfile | null>(null);
  const [educationDraft, setEducationDraft] = useState<EducationInput>(EMPTY_EDUCATION);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceInput>(EMPTY_EXPERIENCE);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'campus_admin' || role === 'superadmin';

  const token = user?.token;
  const tenantId = user?.tenantId;
  const auth = token && tenantId ? { token, tenantId } : null;

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Supercampus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (err) {
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const load = useCallback(async () => {
    if (!isReady) {
      return;
    }
    if (!token || !tenantId) {
      setLoading(false);
      setError('Sign in to open your campus profile.');
      return;
    }
    setError(null);
    try {
      setProfile(await profileApi.getMine({ token, tenantId }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profile could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, isReady]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const run = async (work: () => Promise<CampusProfile>) => {
    setBusy(true);
    setError(null);
    try {
      const next = await work();
      setProfile(next);
      return next;
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Could not save';
      setError(msg);
      throw cause;
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (source: 'library' | 'camera') => {
    if (!auth) {
      return;
    }
    setSheet(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(source === 'camera' ? 'Camera access is needed to take a profile photo.' : 'Photo access is needed to choose a profile image.');
      return;
    }
    const options = { mediaTypes: ['images'] as ImagePicker.MediaType[], allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.85 };
    const picked = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) {
      return;
    }
    await run(() => profileApi.uploadPhoto(auth, asset.uri, asset.mimeType));
  };

  const saveProfile = () => {
    if (!auth || !draft) {
      return;
    }
    const year = draft.graduationYear ?? undefined;
    run(() =>
      profileApi.updateMine(auth, {
        firstName: draft.firstName ?? '',
        lastName: draft.lastName ?? '',
        handle: draft.handle ?? '',
        graduationYear: year,
        visibility: draft.visibility,
        residency: draft.residency,
        bio: draft.bio ?? '',
      }),
    ).catch(() => undefined);
  };

  const saveEducation = () => {
    if (!auth || !educationDraft.school.trim() || !educationDraft.degree.trim()) {
      Alert.alert('Required Fields', 'School and degree are required.');
      return;
    }
    const start = educationDraft.startDate?.trim();
    const end = educationDraft.endDate?.trim();
    if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      Alert.alert('Invalid Date', 'Start date must be formatted YYYY-MM-DD. Please pick it using the calendar.');
      return;
    }
    if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      Alert.alert('Invalid Date', 'End date must be formatted YYYY-MM-DD. Please pick it using the calendar.');
      return;
    }

    const payload = {
      school: educationDraft.school.trim(),
      degree: educationDraft.degree.trim(),
      visibility: educationDraft.visibility,
      ...(start ? { startDate: start } : {}),
      ...(end ? { endDate: end } : {}),
    };

    run(() =>
      editingEducationId
        ? profileApi.updateEducation(auth, editingEducationId, payload)
        : profileApi.addEducation(auth, payload),
    )
      .then(() => {
        setEditingEducationId(null);
        setEducationDraft(EMPTY_EDUCATION);
        setSheet(null);
      })
      .catch((err) => {
        Alert.alert('Could Not Save', err?.message || 'Failed to save education record.');
      });
  };

  const editEducation = (item: CampusProfile['education'][number]) => {
    setEditingEducationId(item.id);
    setEducationDraft({
      school: item.school,
      degree: item.degree,
      startDate: item.startDate ?? undefined,
      endDate: item.endDate ?? undefined,
      visibility: item.visibility,
    });
    setSheet('education');
  };

  const saveExperience = () => {
    if (!auth || !experienceDraft.employer.trim() || !experienceDraft.title.trim()) {
      Alert.alert('Required Fields', 'Employer and title are required.');
      return;
    }
    const start = experienceDraft.startDate?.trim();
    const end = experienceDraft.endDate?.trim();
    if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      Alert.alert('Invalid Date', 'Start date must be formatted YYYY-MM-DD. Please pick it using the calendar.');
      return;
    }
    if (!experienceDraft.current && end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      Alert.alert('Invalid Date', 'End date must be formatted YYYY-MM-DD. Please pick it using the calendar.');
      return;
    }

    const payload = {
      employer: experienceDraft.employer.trim(),
      title: experienceDraft.title.trim(),
      current: experienceDraft.current,
      visibility: experienceDraft.visibility,
      ...(start ? { startDate: start } : {}),
      ...(experienceDraft.current || !end ? {} : { endDate: end }),
    };

    run(() =>
      editingExperienceId
        ? profileApi.updateExperience(auth, editingExperienceId, payload)
        : profileApi.addExperience(auth, payload),
    )
      .then(() => {
        setEditingExperienceId(null);
        setExperienceDraft(EMPTY_EXPERIENCE);
        setSheet(null);
      })
      .catch((err) => {
        Alert.alert('Could Not Save', err?.message || 'Failed to save experience record.');
      });
  };

  const editExperience = (item: CampusProfile['experience'][number]) => {
    setEditingExperienceId(item.id);
    setExperienceDraft({
      employer: item.employer,
      title: item.title,
      startDate: item.startDate ?? undefined,
      endDate: item.endDate ?? undefined,
      current: item.current,
      visibility: item.visibility,
    });
    setSheet('experience');
  };

  const addSkill = (name: string) => {
    if (!auth || !name.trim()) {
      return;
    }
    run(() => profileApi.addSkill(auth, name.trim()))
      .then(() => setSkillDraft(''))
      .catch(() => undefined);
  };

  const name = displayName(profile?.firstName ?? null, profile?.lastName ?? null, user?.fullName || 'Campus member');
  const initial = (name.trim()[0] || 'S').toUpperCase();
  const photoUri = profilePhotoUri(profile?.photoKey ?? null);
  const skillReady = skillDraft.trim().length > 0;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={false}
        keyboardShouldPersistTaps="handled">
        {/* Top Photographic Hero Container (matches reference image pattern) */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: DEFAULT_COVER_URI }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {/* Tint overlay ensuring crisp contrast for white hero elements */}
          <View style={styles.heroOverlay} />

          {/* Floating Top Quick Actions Bar */}
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
            <View style={styles.topBarBrand}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text style={styles.topBarBrandText}>Supercampus</Text>
            </View>
            <View style={styles.topBarActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push('/notifications')}
                style={styles.heroActionBtn}>
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
                <View style={styles.notifBadge} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Appearance"
                onPress={() => setSheet('theme')}
                style={styles.heroActionBtn}>
                <Ionicons name="color-palette-outline" size={19} color="#FFFFFF" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh"
                onPress={() => load()}
                style={styles.heroActionBtn}>
                <Ionicons name="refresh" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Centered Avatar, Name, and Bio Quote (exact alignment to reference) */}
          <View style={styles.heroCenterContent}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              onPress={() => setSheet('photo')}
              style={styles.avatarWrap}>
              {photoUri && auth ? (
                <Image
                  source={{
                    uri: photoUri,
                    headers: {
                      Authorization: `Bearer ${auth.token}`,
                      'X-Tenant-Id': auth.tenantId,
                    },
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </Pressable>

            <Text style={styles.heroName}>{name}</Text>
            <Text style={styles.heroBio}>
              {profile?.bio?.trim() || 'Work hard in silence. Let your success be the noise.'}
            </Text>

            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaText}>
                {profile?.handle ? `@${profile.handle}` : profile?.collegeEmail || 'Campus Member'} · USN: {profile?.usn || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Body: Floating Grouped Cards */}
        <View style={styles.contentBody}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? <ActivityIndicator color={Colors.primary.light} style={styles.loader} /> : null}

          {/* Card Group 1: Address & Account (2 rows matching reference) */}
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (profile) {
                  setDraft(profile);
                  setSheet('edit');
                }
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="location-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>My Campus & Address</Text>
                <Text style={styles.menuSubtitle}>
                  {residencyLabel(profile?.residency ?? ResidencyStatus.NotSet)} · {profile?.department || 'NMIT North Campus'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (profile) {
                  setDraft(profile);
                  setSheet('edit');
                }
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="people-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Account</Text>
                <Text style={styles.menuSubtitle}>
                  {profile?.handle ? `@${profile.handle}` : 'Personal details, name & bio'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Card Group 2: Portfolio & Academic (Education, Experience, Skills, Visibility) */}
          <View style={styles.menuCard}>
            {/* Education Row */}
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setEditingEducationId(null);
                setEducationDraft(EMPTY_EDUCATION);
                setSheet('education');
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="school-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Education</Text>
                <Text style={styles.menuSubtitle}>
                  {profile?.education.length ? `${profile.education.length} record(s) listed` : 'Add your school or university'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            {profile?.education.length ? (
              <View style={styles.nestedEntryList}>
                {profile.education.map((item) => (
                  <View key={item.id} style={styles.nestedEntryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nestedEntryTitle}>{item.school}</Text>
                      <Text style={styles.nestedEntrySubtitle}>{item.degree} · {visibilityLabel(item.visibility)}</Text>
                    </View>
                    <View style={styles.entryActionRow}>
                      <Pressable
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Edit education"
                        onPress={() => editEducation(item)}
                        style={styles.entryEditBtn}>
                        <Ionicons name="pencil" size={14} color={Colors.primary.light} />
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Remove education"
                        onPress={() => auth && run(() => profileApi.removeEducation(auth, item.id))}>
                        <Ionicons name="close-circle" size={18} color={Colors.status.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.menuDivider} />

            {/* Experience Row */}
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setEditingExperienceId(null);
                setExperienceDraft(EMPTY_EXPERIENCE);
                setSheet('experience');
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="briefcase-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Experience</Text>
                <Text style={styles.menuSubtitle}>
                  {profile?.experience.length ? `${profile.experience.length} position(s) listed` : 'Add past internships & roles'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            {profile?.experience.length ? (
              <View style={styles.nestedEntryList}>
                {profile.experience.map((item) => (
                  <View key={item.id} style={styles.nestedEntryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nestedEntryTitle}>{item.title} @ {item.employer}</Text>
                      <Text style={styles.nestedEntrySubtitle}>{item.current ? 'Current position' : visibilityLabel(item.visibility)}</Text>
                    </View>
                    <View style={styles.entryActionRow}>
                      <Pressable
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Edit experience"
                        onPress={() => editExperience(item)}
                        style={styles.entryEditBtn}>
                        <Ionicons name="pencil" size={14} color={Colors.primary.light} />
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Remove experience"
                        onPress={() => auth && run(() => profileApi.removeExperience(auth, item.id))}>
                        <Ionicons name="close-circle" size={18} color={Colors.status.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.menuDivider} />

            {/* Skills Row */}
            <View style={styles.menuRowStatic}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="sparkles-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Skills & Badges</Text>
                <Text style={styles.menuSubtitle}>
                  {profile?.skills.length ? `${profile.skills.length} skills verified` : 'Add technical and soft skills'}
                </Text>
              </View>
            </View>

            {profile?.skills.length ? (
              <View style={styles.skillPillWrap}>
                {profile.skills.map((skill) => (
                  <View key={skill.id} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{skill.name}</Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => auth && run(() => profileApi.removeSkill(auth, skill.id))}>
                      <Ionicons name="close" size={13} color={Colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.skillComposerRow}>
              <TextInput
                value={skillDraft}
                onChangeText={setSkillDraft}
                onSubmitEditing={() => addSkill(skillDraft)}
                placeholder="Add skill (e.g. React, Python)"
                placeholderTextColor={Colors.text.tertiary}
                style={styles.skillComposerInput}
              />
              <Pressable
                disabled={!skillReady}
                onPress={() => addSkill(skillDraft)}
                style={[styles.skillComposerBtn, skillReady && styles.skillComposerBtnActive]}>
                <Text style={[styles.skillComposerBtnText, skillReady && styles.skillComposerBtnTextActive]}>
                  Add
                </Text>
              </Pressable>
            </View>

            <View style={styles.menuDivider} />

            {/* Directory Visibility Row */}
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (profile) {
                  setDraft(profile);
                  setSheet('edit');
                }
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="eye-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Directory Visibility</Text>
                <Text style={styles.menuSubtitle}>
                  {visibilityLabel(profile?.visibility ?? ProfileVisibility.Campus)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Card Group 3: Settings & Preferences (Notifications, Devices, Passwords, Language) */}
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push('/notifications')}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="notifications-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>Campus alerts & updates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuRow}
              onPress={() => setSheet('theme')}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="phone-portrait-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Devices & Theme</Text>
                <Text style={styles.menuSubtitle}>Theme · {themeLabel(theme)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (profile) {
                  setDraft(profile);
                  setSheet('edit');
                }
              }}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="key-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Passwords & Security</Text>
                <Text style={styles.menuSubtitle}>Campus authentication</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </Pressable>

            <View style={styles.menuDivider} />

            <View style={styles.menuRow}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="chatbox-ellipses-outline" size={21} color={Colors.text.secondary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Language</Text>
                <Text style={styles.menuSubtitle}>English (US)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </View>
          </View>

          {/* Card Group: Campus Administration */}
          {isAdmin ? (
            <View style={styles.menuCard}>
              <Pressable style={styles.menuRow} onPress={() => setShowCsvModal(true)}>
                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={21} color="#38BDF8" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Student Directory CSV Import</Text>
                  <Text style={styles.menuSubtitle}>Upload student, faculty & hostel roster</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
              </Pressable>
            </View>
          ) : null}

          {/* Card Group 4: Log out */}
          {auth ? (
            <View style={styles.menuCard}>
              <Pressable style={styles.menuRow} onPress={handleLogout}>
                <View style={[styles.menuIconWrap, styles.logoutIconWrap]}>
                  <Ionicons name="log-out-outline" size={21} color={Colors.status.error} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={[styles.menuTitle, { color: Colors.status.error }]}>Log out</Text>
                  <Text style={styles.menuSubtitle}>Sign out from your campus account</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
              </Pressable>
            </View>
          ) : null}

          {!auth && !loading ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}>
              <Ionicons name="log-in-outline" size={18} color={Colors.text.onBrand} />
              <Text style={styles.signInButtonText}>Sign in to Supercampus</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <HomeBottomTabs activeTab="profile" onTabChange={(tab) => openTab(router, tab)} onCenterActionPress={() => router.push('/scan')} />
      {busy ? <ActivityIndicator color={Colors.primary.light} style={styles.busy} /> : null}

      <Modal visible={sheet === 'edit'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
            <Text style={styles.sheetTitle}>Profile details</Text>
            <Field label="First name" value={draft?.firstName ?? ''} onChangeText={(firstName) => draft && setDraft({ ...draft, firstName })} />
            <Field label="Last name" value={draft?.lastName ?? ''} onChangeText={(lastName) => draft && setDraft({ ...draft, lastName })} />
            <Field label="USN" value={draft?.usn ?? ''} editable={false} />
            <Field label="Handle" value={draft?.handle ?? ''} autoCapitalize="none" onChangeText={(handle) => draft && setDraft({ ...draft, handle })} />
            <Field
              label="Graduation year"
              value={draft?.graduationYear ? String(draft.graduationYear) : ''}
              keyboardType="number-pad"
              onChangeText={(value) => draft && setDraft({ ...draft, graduationYear: Number(value.replace(/\D/g, '').slice(0, 4)) || null })}
            />
            <Text style={styles.groupLabel}>Directory visibility</Text>
            <ChipRow
              options={VISIBILITY_OPTIONS}
              value={draft?.visibility ?? ProfileVisibility.Campus}
              label={visibilityLabel}
              onChange={(visibility) => draft && setDraft({ ...draft, visibility })}
            />
            <Text style={styles.groupLabel}>Residency status</Text>
            <ChipRow
              options={RESIDENCY_OPTIONS}
              value={draft?.residency ?? ResidencyStatus.NotSet}
              label={residencyLabel}
              onChange={(residency) => draft && setDraft({ ...draft, residency })}
            />
            <Field
              label="Bio"
              value={draft?.bio ?? ''}
              multiline
              maxLength={500}
              onChangeText={(bio) => draft && setDraft({ ...draft, bio })}
            />
            <Text style={styles.counter}>{(draft?.bio ?? '').length}/500</Text>
            <View style={styles.sheetActions}>
              <Pressable accessibilityRole="button" onPress={saveProfile} style={styles.saveButton}>
                <Text style={styles.saveText}>Save changes</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setSheet(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'photo'} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <Pressable accessibilityRole="button" onPress={() => pickPhoto('library')} style={styles.photoChoice}>
              <Ionicons name="images-outline" size={20} color={Colors.primary.cyan} />
              <Text style={styles.rowTitle}>Choose from gallery</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => pickPhoto('camera')} style={styles.photoChoice}>
              <Ionicons name="camera-outline" size={20} color={Colors.primary.cyan} />
              <Text style={styles.rowTitle}>Take a photo</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSheet(null)} style={styles.doneButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'theme'} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.sheetTitle}>Theme</Text>
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setPreference(option)}
                  style={styles.themeRow}>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? Colors.primary.light : Colors.text.secondary} />
                  <View>
                    <Text style={styles.rowTitle}>{themeLabel(option)}</Text>
                    <Text style={styles.rowMeta}>{themeDetail(option)}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={() => setSheet(null)} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'education'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.sheetTitle}>{editingEducationId ? 'Edit education' : 'Add education'}</Text>
            <Field label="School" value={educationDraft.school} onChangeText={(school) => setEducationDraft({ ...educationDraft, school })} />
            <Field label="Degree" value={educationDraft.degree} onChangeText={(degree) => setEducationDraft({ ...educationDraft, degree })} />
            <DatePickerField
              label="Start date"
              value={educationDraft.startDate}
              placeholder="YYYY-MM-DD"
              onChangeDate={(startDate) => setEducationDraft({ ...educationDraft, startDate })}
            />
            <DatePickerField
              label="End date"
              value={educationDraft.endDate}
              placeholder="YYYY-MM-DD"
              onChangeDate={(endDate) => setEducationDraft({ ...educationDraft, endDate })}
            />
            <Text style={styles.groupLabel}>Visibility</Text>
            <ChipRow
              options={VISIBILITY_OPTIONS}
              value={educationDraft.visibility ?? ProfileVisibility.Campus}
              label={visibilityLabel}
              onChange={(visibility) => setEducationDraft({ ...educationDraft, visibility })}
            />
            <View style={styles.sheetActions}>
              <Pressable accessibilityRole="button" onPress={() => setSheet(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveEducation}
                style={[styles.saveButton, (!educationDraft.school.trim() || !educationDraft.degree.trim()) && styles.saveDisabled]}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'experience'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{editingExperienceId ? 'Edit experience' : 'Add experience'}</Text>
            <Field label="Employer" value={experienceDraft.employer} onChangeText={(employer) => setExperienceDraft({ ...experienceDraft, employer })} />
            <Field label="Title" value={experienceDraft.title} onChangeText={(title) => setExperienceDraft({ ...experienceDraft, title })} />
            <DatePickerField
              label="Start date"
              value={experienceDraft.startDate}
              placeholder="YYYY-MM-DD"
              onChangeDate={(startDate) => setExperienceDraft({ ...experienceDraft, startDate })}
            />
            <DatePickerField
              label="End date"
              value={experienceDraft.endDate}
              disabled={Boolean(experienceDraft.current)}
              placeholder="YYYY-MM-DD"
              onChangeDate={(endDate) => setExperienceDraft({ ...experienceDraft, endDate })}
            />
            <View style={styles.switchRow}>
              <Text style={styles.rowTitle}>I currently work here</Text>
              <Switch
                value={Boolean(experienceDraft.current)}
                onValueChange={(current) => setExperienceDraft({ ...experienceDraft, current, endDate: current ? undefined : experienceDraft.endDate })}
                trackColor={{ false: Colors.background.input, true: Colors.primary.main }}
                thumbColor={Colors.background.canvas}
              />
            </View>
            <Text style={styles.groupLabel}>Visibility</Text>
            <ChipRow
              options={VISIBILITY_OPTIONS}
              value={experienceDraft.visibility ?? ProfileVisibility.Public}
              label={visibilityLabel}
              onChange={(visibility) => setExperienceDraft({ ...experienceDraft, visibility })}
            />
            <View style={styles.sheetActions}>
              <Pressable accessibilityRole="button" onPress={() => setSheet(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveExperience}
                style={[styles.saveButton, (!experienceDraft.employer.trim() || !experienceDraft.title.trim()) && styles.saveDisabled]}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
          </View>
        </View>
      </Modal>
      <CsvDirectoryImportModal visible={showCsvModal} onClose={() => setShowCsvModal(false)} />
    </View>
  );
}

function Field({
  label,
  ...props
}: { label: string } & ComponentProps<typeof TextInput>) {
  const { Colors, styles } = useProfileStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={Colors.text.tertiary} style={[styles.fieldInput, props.multiline && styles.fieldMultiline]} {...props} />
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  label,
  onChange,
}: {
  options: readonly T[];
  value: T;
  label: (option: T) => string;
  onChange: (option: T) => void;
}) {
  const { styles } = useProfileStyles();
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable key={option} accessibilityRole="button" onPress={() => onChange(option)} style={[styles.skillChip, selected && styles.skillFilled]}>
            <Text style={selected ? styles.skillFilledText : styles.skillChipText}>{label(option)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  const light = Colors.background.canvas === '#F4F6FB';
  const cardShadow = light ? '0px 4px 18px rgba(15, 23, 42, 0.06)' : '0px 10px 24px rgba(0, 0, 0, 0.35)';
  const cardBorder = light ? 'rgba(49, 52, 145, 0.08)' : Colors.border.card;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    scroll: {
      flexGrow: 1,
      paddingBottom: 110,
    },

    // Photographic Hero
    heroContainer: {
      height: 330,
      width: '100%',
      position: 'relative',
      justifyContent: 'space-between',
      paddingBottom: 32,
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(9, 13, 22, 0.46)',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      zIndex: 2,
    },
    topBarBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    topBarBrandText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroActionBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0, 0, 0, 0.36)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    notifBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },

    // Hero Center Content
    heroCenterContent: {
      alignItems: 'center',
      paddingHorizontal: 20,
      zIndex: 2,
    },
    avatarWrap: {
      width: 90,
      height: 90,
      borderRadius: 45,
      marginBottom: 10,
      borderWidth: 3.5,
      borderColor: '#FFFFFF',
      position: 'relative',
      boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.4)',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 45,
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      borderRadius: 45,
      backgroundColor: Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: Typography.bold,
      fontSize: 34,
      color: '#FFFFFF',
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: Colors.primary.main,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroName: {
      fontFamily: Typography.bold,
      fontSize: 24,
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: -0.2,
      textShadowColor: 'rgba(0, 0, 0, 0.55)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroBio: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: 'rgba(255, 255, 255, 0.92)',
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 19,
      maxWidth: 320,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    heroMetaPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.28)',
    },
    heroMetaText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: '#FFFFFF',
    },

    // Content Body & Menu Cards (Floating white/elevated cards)
    contentBody: {
      marginTop: -22,
      paddingTop: 16,
      paddingHorizontal: 16,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      backgroundColor: Colors.background.canvas,
    },
    error: {
      color: Colors.status.error,
      fontFamily: Typography.regular,
      marginBottom: 10,
      textAlign: 'center',
    },
    loader: {
      marginVertical: 12,
    },
    menuCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: cardBorder,
      marginBottom: 14,
      paddingVertical: 4,
      boxShadow: cardShadow,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuRowStatic: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 14,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    menuIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: light ? 'rgba(49, 52, 145, 0.07)' : Colors.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    logoutIconWrap: {
      backgroundColor: light ? 'rgba(220, 38, 38, 0.08)' : 'rgba(239, 68, 68, 0.15)',
    },
    menuTextWrap: {
      flex: 1,
    },
    menuTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 16,
      color: Colors.text.primary,
    },
    menuSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border.subtle,
      marginLeft: 68,
      marginRight: 16,
    },

    // Nested entry list (education & experience)
    nestedEntryList: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      gap: 8,
    },
    nestedEntryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    nestedEntryTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      color: Colors.text.primary,
    },
    nestedEntrySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    entryActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 10,
    },
    entryEditBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: light ? 'rgba(49, 52, 145, 0.08)' : 'rgba(129, 140, 248, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Skills
    skillPillWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    skillPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary.main,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    skillPillText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.onBrand,
    },
    skillComposerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    skillComposerInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: Colors.text.primary,
      fontFamily: Typography.regular,
      fontSize: 13.5,
    },
    skillComposerBtn: {
      backgroundColor: Colors.background.elevated,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    skillComposerBtnActive: {
      backgroundColor: Colors.primary.main,
      borderColor: Colors.primary.main,
    },
    skillComposerBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    skillComposerBtnTextActive: {
      color: Colors.text.onBrand,
    },

    // Common / Buttons
    signInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.primary.main,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: light ? 'rgba(255, 255, 255, 0.35)' : Colors.border.glow,
    },
    signInButtonText: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontSize: 16,
    },
    pressed: { opacity: 0.75 },
    busy: { position: 'absolute', top: 18, alignSelf: 'center' },

    // Modals
    modalBackdrop: {
      flex: 1,
      width: '100%',
      backgroundColor: 'rgba(7, 9, 15, 0.72)',
      justifyContent: 'flex-end',
      alignItems: 'stretch',
    },
    sheet: {
      width: '100%',
      maxHeight: '92%',
      backgroundColor: Colors.background.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1.5,
      borderColor: cardBorder,
      boxShadow: '0px -8px 28px rgba(15, 23, 42, 0.16)',
    },
    sheetBody: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 },
    dialog: {
      alignSelf: 'stretch',
      maxHeight: '88%',
      backgroundColor: Colors.background.elevated,
      borderRadius: 24,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 18,
      borderWidth: 1.5,
      borderColor: cardBorder,
      boxShadow: cardShadow,
    },
    sheetTitle: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 22, marginBottom: 12 },
    field: { marginBottom: 12 },
    fieldLabel: { fontFamily: Typography.semiBold, color: Colors.text.secondary, fontSize: 12, marginBottom: 6 },
    fieldInput: {
      borderWidth: 1.5,
      borderColor: cardBorder,
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: Colors.text.primary,
      fontFamily: Typography.regular,
      fontSize: 16,
    },
    fieldMultiline: { minHeight: 96, textAlignVertical: 'top' },
    groupLabel: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 15, marginTop: 4 },
    counter: { fontFamily: Typography.regular, color: Colors.text.tertiary, fontSize: 12, marginTop: -6, marginBottom: 8 },
    sheetActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 8, marginBottom: 18 },
    saveButton: {
      backgroundColor: Colors.primary.main,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: light ? 'rgba(255, 255, 255, 0.35)' : Colors.border.glow,
      boxShadow: '0px 6px 14px rgba(49, 52, 145, 0.28)',
    },
    saveDisabled: { opacity: 0.45 },
    saveText: { fontFamily: Typography.bold, color: Colors.text.onBrand, fontSize: 15 },
    cancelText: { fontFamily: Typography.semiBold, color: Colors.primary.cyan, fontSize: 15 },
    photoChoice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.background.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 10,
    },
    themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    doneButton: {
      alignSelf: 'flex-end',
      marginTop: 8,
      backgroundColor: Colors.primary.main,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    doneText: { fontFamily: Typography.bold, color: Colors.text.onBrand, fontSize: 15 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
    rowTitle: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 16 },
    rowMeta: { fontFamily: Typography.regular, color: Colors.text.secondary, fontSize: 13, marginTop: 2 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    skillChip: {
      borderWidth: 1.5,
      borderColor: Colors.border.glow,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: Colors.background.surface,
    },
    skillChipText: { fontFamily: Typography.semiBold, color: Colors.text.primary, fontSize: 14 },
    skillFilled: {
      backgroundColor: Colors.primary.main,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1.5,
      borderColor: light ? 'rgba(255, 255, 255, 0.35)' : Colors.border.glow,
      boxShadow: '0px 6px 14px rgba(49, 52, 145, 0.28)',
    },
    skillFilledText: { fontFamily: Typography.semiBold, color: Colors.text.onBrand, fontSize: 14 },
  });
}
