import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { openTab } from '@/features/campus/navigation';

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

function useProfileStyles() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  return { ...theme, Colors: theme.colors, styles };
}

export function ProfileScreen() {
  const { preference: theme, setPreference, colors: Colors, styles } = useProfileStyles();
  const router = useRouter();
  const { user, isReady } = useAuthSession();
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState<CampusProfile | null>(null);
  const [educationDraft, setEducationDraft] = useState<EducationInput>(EMPTY_EDUCATION);
  const [experienceDraft, setExperienceDraft] = useState<ExperienceInput>(EMPTY_EXPERIENCE);
  const [skillDraft, setSkillDraft] = useState('');

  const token = user?.token;
  const tenantId = user?.tenantId;
  const auth = token && tenantId ? { token, tenantId } : null;

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
      setProfile(await work());
      setSheet(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save');
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
    const asset = picked.assets[0];
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

  const addEducation = () => {
    if (!auth || !educationDraft.school.trim() || !educationDraft.degree.trim()) {
      return;
    }
    run(() =>
      profileApi.addEducation(auth, {
        school: educationDraft.school.trim(),
        degree: educationDraft.degree.trim(),
        visibility: educationDraft.visibility,
        ...(educationDraft.startDate?.trim() ? { startDate: educationDraft.startDate.trim() } : {}),
        ...(educationDraft.endDate?.trim() ? { endDate: educationDraft.endDate.trim() } : {}),
      }),
    ).catch(() => undefined);
  };

  const addExperience = () => {
    if (!auth || !experienceDraft.employer.trim() || !experienceDraft.title.trim()) {
      return;
    }
    run(() =>
      profileApi.addExperience(auth, {
        employer: experienceDraft.employer.trim(),
        title: experienceDraft.title.trim(),
        current: experienceDraft.current,
        visibility: experienceDraft.visibility,
        ...(experienceDraft.startDate?.trim() ? { startDate: experienceDraft.startDate.trim() } : {}),
        ...(experienceDraft.current || !experienceDraft.endDate?.trim() ? {} : { endDate: experienceDraft.endDate.trim() }),
      }),
    ).catch(() => undefined);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Appearance" onPress={() => setSheet('theme')} style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color={Colors.text.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={() => load()} style={styles.iconButton}>
              <Ionicons name="refresh" size={22} color={Colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={Colors.primary.light} style={styles.loader} /> : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Change photo" onPress={() => setSheet('photo')} style={styles.avatarWrap}>
              {photoUri && auth ? (
                <Image
                  source={{ uri: photoUri, headers: { Authorization: `Bearer ${auth.token}`, 'X-Tenant-Id': auth.tenantId } }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color={Colors.text.primary} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => {
                if (profile) {
                  setDraft(profile);
                  setSheet('edit');
                }
              }}>
              <Ionicons name="pencil" size={20} color={Colors.text.onBrandMuted} />
            </Pressable>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>{profile?.handle ? `@${profile.handle}` : profile?.collegeEmail}</Text>
          <View style={styles.usnPill}>
            <Text style={styles.usnLabel}>USN</Text>
            <Text style={styles.usnValue}>{profile?.usn || '—'}</Text>
          </View>
          <Text style={styles.metaLine}>
            {[profile?.department, profile?.batch, profile?.graduationYear ? `Class of ${profile.graduationYear}` : null]
              .filter(Boolean)
              .join(' · ') || 'Campus profile'}
          </Text>
          {profile?.bio?.trim() ? (
            <View style={styles.heroBioBox}>
              <Text style={styles.heroBio}>{profile.bio.trim()}</Text>
            </View>
          ) : null}
          {profile ? (
            <View style={styles.factRow}>
              <View style={styles.factPill}>
                <Text style={styles.factText}>{visibilityLabel(profile.visibility)}</Text>
              </View>
              <View style={styles.factPill}>
                <Text style={styles.factText}>{residencyLabel(profile.residency)}</Text>
              </View>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (profile) {
                setDraft(profile);
                setSheet('edit');
              }
            }}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => setSheet('theme')} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}>
          <View style={styles.paletteIcon}>
            <Ionicons name="color-palette" size={18} color={Colors.text.onBrand} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Appearance</Text>
            <Text style={styles.rowMeta}>Theme · {themeLabel(theme)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.secondary} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEducationDraft(EMPTY_EDUCATION);
                setSheet('education');
              }}
              style={styles.addPill}>
              <Text style={styles.addPillText}>+ Add</Text>
            </Pressable>
          </View>
          {profile?.education.length ? (
            profile.education.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryTitle}>{item.school}</Text>
                  <Text style={styles.entryMeta}>{item.degree}</Text>
                  <Text style={styles.entryMeta}>{visibilityLabel(item.visibility)}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove education" onPress={() => auth && run(() => profileApi.removeEducation(auth, item.id))}>
                  <Ionicons name="close" size={18} color={Colors.text.secondary} />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>No education added yet. Add your school or university to stand out.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setExperienceDraft(EMPTY_EXPERIENCE);
                setSheet('experience');
              }}
              style={styles.addPill}>
              <Text style={styles.addPillText}>+ Add</Text>
            </Pressable>
          </View>
          {profile?.experience.length ? (
            profile.experience.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryTitle}>{item.title}</Text>
                  <Text style={styles.entryMeta}>{item.employer}</Text>
                  <Text style={styles.entryMeta}>{item.current ? 'Current' : visibilityLabel(item.visibility)}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove experience" onPress={() => auth && run(() => profileApi.removeExperience(auth, item.id))}>
                  <Ionicons name="close" size={18} color={Colors.text.secondary} />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>No work experience added yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {profile?.skills.length ? (
            <View style={styles.skillWrap}>
              {profile.skills.map((skill) => (
                <Pressable key={skill.id} accessibilityRole="button" onPress={() => auth && run(() => profileApi.removeSkill(auth, skill.id))} style={styles.skillFilled}>
                  <Text style={styles.skillFilledText}>{skill.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              value={skillDraft}
              onChangeText={setSkillDraft}
              onSubmitEditing={() => addSkill(skillDraft)}
              placeholder="e.g. React, Python, Design"
              placeholderTextColor={Colors.text.tertiary}
              style={styles.composerInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !skillReady }}
              disabled={!skillReady}
              onPress={() => addSkill(skillDraft)}
              style={[styles.skillAdd, skillReady && styles.skillAddReady]}>
              <Text style={[styles.skillAddText, skillReady && styles.skillAddTextReady]}>Add</Text>
            </Pressable>
          </View>
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
            <Text style={styles.sheetTitle}>Add education</Text>
            <Field label="School" value={educationDraft.school} onChangeText={(school) => setEducationDraft({ ...educationDraft, school })} />
            <Field label="Degree" value={educationDraft.degree} onChangeText={(degree) => setEducationDraft({ ...educationDraft, degree })} />
            <Field label="Start date" value={educationDraft.startDate ?? ''} placeholder="2022-08-01" onChangeText={(startDate) => setEducationDraft({ ...educationDraft, startDate })} />
            <Field label="End date" value={educationDraft.endDate ?? ''} placeholder="2026-06-01" onChangeText={(endDate) => setEducationDraft({ ...educationDraft, endDate })} />
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
                onPress={addEducation}
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
            <Text style={styles.sheetTitle}>Add experience</Text>
            <Field label="Employer" value={experienceDraft.employer} onChangeText={(employer) => setExperienceDraft({ ...experienceDraft, employer })} />
            <Field label="Title" value={experienceDraft.title} onChangeText={(title) => setExperienceDraft({ ...experienceDraft, title })} />
            <Field label="Start date" value={experienceDraft.startDate ?? ''} placeholder="2025-06-01" onChangeText={(startDate) => setExperienceDraft({ ...experienceDraft, startDate })} />
            <Field
              label="End date"
              value={experienceDraft.endDate ?? ''}
              editable={!experienceDraft.current}
              placeholder="2025-08-01"
              onChangeText={(endDate) => setExperienceDraft({ ...experienceDraft, endDate })}
            />
            <View style={styles.switchRow}>
              <Text style={styles.rowTitle}>I currently work here</Text>
              <Switch
                value={Boolean(experienceDraft.current)}
                onValueChange={(current) => setExperienceDraft({ ...experienceDraft, current, endDate: current ? undefined : experienceDraft.endDate })}
                trackColor={{ true: Colors.primary.light, false: Colors.border.subtle }}
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
                onPress={addExperience}
                style={[styles.saveButton, (!experienceDraft.employer.trim() || !experienceDraft.title.trim()) && styles.saveDisabled]}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
          </View>
        </View>
      </Modal>
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
    <View style={styles.skillWrap}>
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
  const cardShadow = light ? '0px 8px 22px rgba(15, 23, 42, 0.08)' : '0px 12px 28px rgba(0, 0, 0, 0.38)';
  const cardBorder = light ? 'rgba(49, 52, 145, 0.16)' : Colors.border.card;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.canvas },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 128 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 28 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: cardBorder,
    boxShadow: cardShadow,
  },
  error: { color: Colors.status.error, fontFamily: Typography.regular, marginBottom: 10 },
  loader: { marginVertical: 12 },
  hero: {
    backgroundColor: Colors.primary.main,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: light ? 'rgba(255, 255, 255, 0.35)' : Colors.border.glow,
    boxShadow: light ? '0px 14px 28px rgba(49, 52, 145, 0.28)' : '0px 16px 32px rgba(0, 0, 0, 0.45)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarWrap: { width: 78, height: 78, marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.55)' },
  avatarText: { fontFamily: Typography.bold, color: Colors.text.onBrand, fontSize: 28 },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background.elevated,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: Typography.bold, color: Colors.text.onBrand, fontSize: 28 },
  handle: { fontFamily: Typography.regular, color: Colors.text.onBrandMuted, fontSize: 14, marginTop: 2 },
  usnPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: Colors.background.canvas,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: light ? 'rgba(255, 255, 255, 0.7)' : Colors.border.glow,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.12)',
  },
  usnLabel: { fontFamily: Typography.bold, color: Colors.primary.cyan, fontSize: 11, letterSpacing: 0.6 },
  usnValue: { fontFamily: Typography.semiBold, color: Colors.text.primary, fontSize: 14 },
  metaLine: { fontFamily: Typography.regular, color: Colors.text.onBrandMuted, fontSize: 13, marginTop: 10 },
  heroBioBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroBio: { fontFamily: Typography.regular, color: Colors.text.onBrand, fontSize: 15, lineHeight: 22 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 14 },
  factPill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  factText: { fontFamily: Typography.semiBold, color: Colors.text.onBrand, fontSize: 13 },
  editButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  editButtonText: { fontFamily: Typography.semiBold, color: Colors.text.onBrandMuted, fontSize: 15 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: cardBorder,
    padding: 14,
    marginBottom: 14,
    boxShadow: cardShadow,
  },
  paletteIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: light ? 'rgba(255, 255, 255, 0.4)' : Colors.border.glow,
    boxShadow: '0px 6px 14px rgba(49, 52, 145, 0.28)',
  },
  rowCopy: { flex: 1 },
  rowTitle: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 16 },
  rowMeta: { fontFamily: Typography.regular, color: Colors.text.secondary, fontSize: 13, marginTop: 2 },
  section: {
    backgroundColor: Colors.background.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: cardBorder,
    padding: 16,
    marginBottom: 14,
    boxShadow: cardShadow,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: Typography.bold, color: Colors.text.primary, fontSize: 22, marginBottom: 8 },
  addPill: {
    borderWidth: 1.5,
    borderColor: Colors.border.glow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
    backgroundColor: light ? 'rgba(49, 52, 145, 0.06)' : Colors.background.elevated,
  },
  addPillText: { fontFamily: Typography.semiBold, color: Colors.text.accent, fontSize: 14 },
  emptyBox: {
    marginTop: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cardBorder,
    borderRadius: 16,
    backgroundColor: Colors.background.input,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  empty: { fontFamily: Typography.regular, color: Colors.text.secondary, fontSize: 15, lineHeight: 22 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: cardBorder,
    backgroundColor: Colors.background.input,
    boxShadow: light ? '0px 4px 10px rgba(15, 23, 42, 0.05)' : '0px 6px 14px rgba(0, 0, 0, 0.25)',
  },
  entryCopy: { flex: 1 },
  entryTitle: { fontFamily: Typography.semiBold, color: Colors.text.primary, fontSize: 15 },
  entryMeta: { fontFamily: Typography.regular, color: Colors.text.secondary, fontSize: 13, marginTop: 2 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  skillChip: {
    borderWidth: 1.5,
    borderColor: Colors.border.glow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.background.surface,
    boxShadow: light ? '0px 3px 8px rgba(15, 23, 42, 0.06)' : '0px 4px 10px rgba(0, 0, 0, 0.25)',
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
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  composerInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: cardBorder,
    backgroundColor: Colors.background.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text.primary,
    fontFamily: Typography.regular,
    fontSize: 15,
    boxShadow: light ? '0px 3px 8px rgba(15, 23, 42, 0.04)' : '0px 4px 10px rgba(0, 0, 0, 0.2)',
  },
  skillAdd: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: cardBorder,
  },
  skillAddReady: { backgroundColor: Colors.primary.main, borderColor: Colors.primary.main, boxShadow: '0px 6px 14px rgba(49, 52, 145, 0.28)' },
  skillAddText: { fontFamily: Typography.semiBold, color: Colors.text.secondary, fontSize: 14 },
  skillAddTextReady: { color: Colors.text.onBrand },
  pressed: { opacity: 0.75 },
  busy: { position: 'absolute', top: 18, alignSelf: 'center' },
  modalBackdrop: { flex: 1, width: '100%', backgroundColor: 'rgba(7, 9, 15, 0.72)', justifyContent: 'flex-end', alignItems: 'stretch' },
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
    boxShadow: light ? '0px 3px 8px rgba(15, 23, 42, 0.05)' : '0px 4px 10px rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  doneButton: { alignSelf: 'flex-end', marginTop: 8, backgroundColor: Colors.primary.main, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12 },
  doneText: { fontFamily: Typography.bold, color: Colors.text.onBrand, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
});
}
