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
import * as DocumentPicker from 'expo-document-picker';

import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType } from '@/components/ui';
import { useColors } from '@/theme/app-theme';
import {
  CreateProjectPayload,
  Project,
  ProjectCategory,
  ProjectStage,
  ProjectSupportItem,
  ProjectSupportType,
  ProjectVisibility,
} from '../../project-types';

interface CreateProjectWizardProps {
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
  initialProject?: Project | null;
}

const CATEGORIES: ProjectCategory[] = [
  'Academic',
  'Hackathon',
  'Startup',
  'Research',
  'Social impact',
  'Open source',
];

const STAGES: ProjectStage[] = [
  'Idea',
  'Planning',
  'Prototype',
  'In Progress',
  'Completed',
];

const EXPECTED_DURATIONS = [
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '12+ months',
];

const STUDENT_COUNT_OPTIONS = ['1', '2-4', '5-8', '8+'];
const COMMITMENT_OPTIONS = ['One-time', 'Part-time', 'Full-time'];
const MENTOR_ENGAGEMENT_OPTIONS = [
  'One session',
  'Monthly guidance',
  'Project advisor',
];

const SUPPORT_SERVICES: {
  type: ProjectSupportType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    type: 'HIRE_STUDENTS',
    title: 'Hire students',
    description: 'Find talented students to join your project',
    icon: 'people',
  },
  {
    type: 'HIRE_MENTOR',
    title: 'Hire a mentor',
    description: 'Get guidance from faculty, alumni or industry experts',
    icon: 'school',
  },
  {
    type: 'COLLEGE_FUNDING',
    title: 'College funding',
    description: 'Apply for internal college grants and support',
    icon: 'business',
  },
  {
    type: 'CROWDFUNDING',
    title: 'Crowdfunding',
    description: 'Request community support; payments are not enabled',
    icon: 'wallet',
  },
];

export function CreateProjectWizard({
  onClose,
  onSubmit,
  initialProject,
}: CreateProjectWizardProps) {
  const isEditing = !!initialProject;
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Project Details
  const [title, setTitle] = useState(initialProject?.title || '');
  const [shortDesc, setShortDesc] = useState(initialProject?.shortDescription || '');
  const [moreDetails, setMoreDetails] = useState(initialProject?.moreDetails || '');
  const [category, setCategory] = useState<ProjectCategory>(initialProject?.category || 'Academic');
  const [stage, setStage] = useState<ProjectStage>(initialProject?.stage || 'Idea');
  const [expectedDuration, setExpectedDuration] = useState(initialProject?.duration || '1-3 months');
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(initialProject?.skills || []);

  // Step 2: Support Needed
  const [selectedServices, setSelectedServices] = useState<ProjectSupportType[]>(
    initialProject?.supportNeeds?.map((s) => s.serviceType) || [],
  );

  // 1. Hire Students
  const initialStudents = initialProject?.supportNeeds?.find((s) => s.serviceType === 'HIRE_STUDENTS');
  const [rolesNeeded, setRolesNeeded] = useState(initialStudents?.rolesNeeded || '');
  const [numberOfStudents, setNumberOfStudents] = useState(initialStudents?.numberOfStudents || '1');
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const [commitment, setCommitment] = useState(initialStudents?.commitment || 'One-time');
  const [commitmentDropdownOpen, setCommitmentDropdownOpen] = useState(false);
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [prefSkills, setPrefSkills] = useState<string[]>(
    initialStudents?.preferredSkills ? initialStudents.preferredSkills.split(', ') : [],
  );

  // 2. Hire a Mentor
  const initialMentor = initialProject?.supportNeeds?.find((s) => s.serviceType === 'HIRE_MENTOR');
  const [mentorExpertise, setMentorExpertise] = useState(initialMentor?.rolesNeeded || '');
  const [mentorEngagement, setMentorEngagement] = useState(initialMentor?.commitment || 'One session');
  const [mentorEngagementDropdownOpen, setMentorEngagementDropdownOpen] = useState(false);

  // 3. College Funding
  const initialFunding = initialProject?.supportNeeds?.find((s) => s.serviceType === 'COLLEGE_FUNDING');
  const [collegeFundingAmount, setCollegeFundingAmount] = useState('');
  const [collegeFundingPurpose, setCollegeFundingPurpose] = useState(initialFunding?.fundingDetails || '');

  // 4. Crowdfunding
  const initialCrowd = initialProject?.supportNeeds?.find((s) => s.serviceType === 'CROWDFUNDING');
  const [crowdfundingAmount, setCrowdfundingAmount] = useState('');
  const [crowdfundingReason, setCrowdfundingReason] = useState(initialCrowd?.fundingDetails || '');

  // Step 3: Review & Publish
  const [visibility, setVisibility] = useState<ProjectVisibility>(initialProject?.visibility || 'CAMPUS_ONLY');
  const [pdfFile, setPdfFile] = useState<{
    name: string;
    size?: number;
    uri: string;
  } | null>(initialProject?.pdfDocument || null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
    onConfirm?: () => void;
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
    onConfirm?: () => void,
  ) => {
    setModalConfig({ visible: true, title, message, type, onConfirm });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isPdf =
          asset.mimeType?.toLowerCase().includes('pdf') ||
          asset.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          showModal('Invalid File', 'Please select a PDF document only.', 'warning');
          return;
        }
        setPdfFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not select document', 'error');
    }
  };

  const addPrefSkill = () => {
    const trimmed = prefSkillInput.trim();
    if (!trimmed) return;
    if (!prefSkills.includes(trimmed)) {
      setPrefSkills([...prefSkills, trimmed]);
    }
    setPrefSkillInput('');
  };

  const removePrefSkill = (skillToRemove: string) => {
    setPrefSkills(prefSkills.filter((s) => s !== skillToRemove));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const toggleService = (type: ProjectSupportType) => {
    if (selectedServices.includes(type)) {
      setSelectedServices(selectedServices.filter((s) => s !== type));
    } else {
      setSelectedServices([...selectedServices, type]);
    }
  };

  const handleNextStep1 = () => {
    if (!title.trim()) {
      showModal('Required Field', 'Please enter a project title', 'warning');
      return;
    }
    if (!shortDesc.trim()) {
      showModal('Required Field', 'Please provide a short description', 'warning');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);
      const supportNeedsPayload: ProjectSupportItem[] = selectedServices.map((srv) => {
        if (srv === 'HIRE_STUDENTS') {
          return {
            serviceType: srv,
            rolesNeeded: rolesNeeded.trim() || null,
            numberOfStudents: numberOfStudents || null,
            commitment: commitment || null,
            preferredSkills: prefSkills.length > 0 ? prefSkills.join(', ') : null,
          };
        }
        if (srv === 'HIRE_MENTOR') {
          return {
            serviceType: srv,
            rolesNeeded: mentorExpertise.trim() || null,
            commitment: mentorEngagement || null,
            mentorDomain: mentorEngagement
              ? `${mentorExpertise.trim()} (${mentorEngagement})`
              : mentorExpertise.trim() || null,
          };
        }
        if (srv === 'COLLEGE_FUNDING') {
          const details = [
            collegeFundingAmount ? `Amount: ₹${collegeFundingAmount.trim()}` : '',
            collegeFundingPurpose ? `Purpose: ${collegeFundingPurpose.trim()}` : '',
          ]
            .filter(Boolean)
            .join(' | ');
          return {
            serviceType: srv,
            fundingDetails: details || null,
          };
        }
        if (srv === 'CROWDFUNDING') {
          const details = [
            crowdfundingAmount ? `Target: ₹${crowdfundingAmount.trim()}` : '',
            crowdfundingReason ? `Why: ${crowdfundingReason.trim()}` : '',
          ]
            .filter(Boolean)
            .join(' | ');
          return {
            serviceType: srv,
            fundingDetails: details || null,
          };
        }
        return { serviceType: srv };
      });

      await onSubmit({
        title: title.trim(),
        shortDescription: shortDesc.trim(),
        moreDetails: moreDetails.trim() || undefined,
        category,
        stage,
        duration: expectedDuration,
        location: 'NMIT North Campus',
        visibility,
        skills,
        supportNeeds: supportNeedsPayload,
        pdfDocument: pdfFile,
      });
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not publish project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else onClose();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Project' : 'Create Project'}</Text>
          <Text style={styles.headerSubtitle}>
            {step === 1 && (isEditing ? 'Update project details.' : 'Turn your idea into impact.')}
            {step === 2 && 'Get the right support to make it happen.'}
            {step === 3 && (isEditing ? 'Review and save changes.' : 'Review and publish your project.')}
          </Text>
        </View>
      </View>

      {/* Stepper Indicator */}
      <View style={styles.stepperContainer}>
        {/* Step 1 */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
            {step > 1 ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumber}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>
            Project Details
          </Text>
        </View>

        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

        {/* Step 2 */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
            {step > 2 ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepNumber}>2</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>
            Support Needed
          </Text>
        </View>

        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

        {/* Step 3 */}
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step === 3 && styles.stepCircleActive]}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>Review</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Project Details */}
        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={styles.sectionHeading}>Project Details</Text>
            <Text style={styles.sectionSubheading}>Tell us about your project.</Text>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Title *</Text>
              <TextInput
                value={title}
                onChangeText={(text) => {
                  if (text.length <= 140) setTitle(text);
                }}
                placeholder="e.g. Campus Navigator"
                placeholderTextColor="#64748B"
                style={styles.textInput}
                maxLength={140}
              />
              <Text style={styles.counter}>{title.length}/140</Text>
            </View>

            {/* Short Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Short Description *</Text>
              <TextInput
                value={shortDesc}
                onChangeText={(text) => {
                  if (text.length <= 200) setShortDesc(text);
                }}
                placeholder="Give a quick 1-2 sentence pitch of your project..."
                placeholderTextColor="#64748B"
                style={[styles.textInput, styles.textAreaShort]}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.counter}>{shortDesc.length}/200</Text>
            </View>

            {/* More Details */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>More details (optional)</Text>
              <TextInput
                value={moreDetails}
                onChangeText={setMoreDetails}
                placeholder="Share deeper objectives, target outcomes, or roadmap..."
                placeholderTextColor="#64748B"
                style={[styles.textInput, styles.textAreaLong]}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Required Skills */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Required Skills / Technologies *</Text>
              <View style={styles.skillInputRow}>
                <TextInput
                  value={skillInput}
                  onChangeText={setSkillInput}
                  onSubmitEditing={addSkill}
                  placeholder="Add a skill"
                  placeholderTextColor="#64748B"
                  style={[styles.textInput, styles.skillInputField]}
                />
                <Pressable onPress={addSkill} style={styles.addSkillBtn}>
                  <Ionicons name="add" size={24} color="#CBD5E1" />
                </Pressable>
              </View>

              {skills.length > 0 && (
                <View style={styles.skillTagsWrap}>
                  {skills.map((skill) => (
                    <View key={skill} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                      <Pressable onPress={() => removeSkill(skill)}>
                        <Ionicons name="close" size={14} color="#CBD5E1" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Project Stage */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Stage *</Text>
              <View style={styles.chipsRow}>
                {STAGES.map((stg) => {
                  const active = stage === stg;
                  return (
                    <Pressable
                      key={stg}
                      onPress={() => setStage(stg)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{stg}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Expected Duration */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Expected Duration *</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDurationDropdownOpen((prev) => !prev)}
                style={[
                  styles.dropdownTrigger,
                  durationDropdownOpen && styles.dropdownTriggerOpen,
                ]}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons name="time-outline" size={18} color="#A78BFA" />
                  <Text style={styles.dropdownSelectedText}>{expectedDuration}</Text>
                </View>
                <Ionicons
                  name={durationDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>

              {durationDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {EXPECTED_DURATIONS.map((dur, index) => {
                    const isSelected = expectedDuration === dur;
                    const isLast = index === EXPECTED_DURATIONS.length - 1;
                    return (
                      <Pressable
                        key={dur}
                        onPress={() => {
                          setExpectedDuration(dur);
                          setDurationDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                          !isLast && styles.dropdownItemBorder,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {dur}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color="#A78BFA" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Next Button */}
            <Pressable onPress={handleNextStep1} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#080B11" />
            </Pressable>
          </View>
        )}

        {/* STEP 2: Support Needed */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={styles.sectionHeading}>What support do you need?</Text>
            <Text style={styles.sectionSubheading}>
              Select one or more services. You can choose multiple.
            </Text>

            {/* 4 Cards Grid */}
            <View style={styles.serviceGrid}>
              {SUPPORT_SERVICES.map((srv) => {
                const isSelected = selectedServices.includes(srv.type);
                return (
                  <Pressable
                    key={srv.type}
                    onPress={() => toggleService(srv.type)}
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                  >
                    <View style={styles.serviceCardTop}>
                      <View style={styles.serviceIconWrap}>
                        <Ionicons name={srv.icon} size={20} color="#C4B5FD" />
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </View>
                    <Text style={styles.serviceTitle}>{srv.title}</Text>
                    <Text style={styles.serviceDesc}>{srv.description}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Additional Details */}
            {selectedServices.length > 0 && (
              <View style={styles.additionalDetailsSection}>
                <Text style={styles.additionalHeading}>Additional Details</Text>
                <Text style={styles.additionalSub}>
                  Provide information based on the support you selected.
                </Text>

                {/* 1. Hire Students Card */}
                {selectedServices.includes('HIRE_STUDENTS') && (
                  <View style={styles.subServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.subServiceHeaderLeft}>
                        <Ionicons name="people" size={20} color="#A78BFA" />
                        <Text style={styles.subServiceTitle}>Hire Students</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleService('HIRE_STUDENTS')}
                        hitSlop={8}
                        accessibilityLabel="Remove Hire Students"
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Roles needed *</Text>
                      <TextInput
                        value={rolesNeeded}
                        onChangeText={setRolesNeeded}
                        placeholder="e.g. Frontend Developer, UI/UX Designer"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Number of Students</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setCommitmentDropdownOpen(false);
                          setStudentsDropdownOpen((prev) => !prev);
                        }}
                        style={[
                          styles.dropdownTrigger,
                          studentsDropdownOpen && styles.dropdownTriggerOpen,
                        ]}
                      >
                        <Text style={styles.dropdownSelectedText}>{numberOfStudents}</Text>
                        <Ionicons
                          name={studentsDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#94A3B8"
                        />
                      </Pressable>

                      {studentsDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {STUDENT_COUNT_OPTIONS.map((count, index) => {
                            const isSelected = numberOfStudents === count;
                            const isLast = index === STUDENT_COUNT_OPTIONS.length - 1;
                            return (
                              <Pressable
                                key={count}
                                onPress={() => {
                                  setNumberOfStudents(count);
                                  setStudentsDropdownOpen(false);
                                }}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected,
                                  !isLast && styles.dropdownItemBorder,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isSelected && styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {count}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-circle" size={18} color="#A78BFA" />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Commitment</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setStudentsDropdownOpen(false);
                          setCommitmentDropdownOpen((prev) => !prev);
                        }}
                        style={[
                          styles.dropdownTrigger,
                          commitmentDropdownOpen && styles.dropdownTriggerOpen,
                        ]}
                      >
                        <Text style={styles.dropdownSelectedText}>{commitment}</Text>
                        <Ionicons
                          name={commitmentDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#94A3B8"
                        />
                      </Pressable>

                      {commitmentDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {COMMITMENT_OPTIONS.map((com, index) => {
                            const isSelected = commitment === com;
                            const isLast = index === COMMITMENT_OPTIONS.length - 1;
                            return (
                              <Pressable
                                key={com}
                                onPress={() => {
                                  setCommitment(com);
                                  setCommitmentDropdownOpen(false);
                                }}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected,
                                  !isLast && styles.dropdownItemBorder,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isSelected && styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {com}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-circle" size={18} color="#A78BFA" />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Preferred Skills</Text>
                      <View style={styles.skillInputRow}>
                        <TextInput
                          value={prefSkillInput}
                          onChangeText={setPrefSkillInput}
                          onSubmitEditing={addPrefSkill}
                          placeholder="Add a skill"
                          placeholderTextColor="#64748B"
                          style={[styles.textInput, styles.skillInputField]}
                        />
                        <Pressable onPress={addPrefSkill} style={styles.addSkillCircleBtn}>
                          <Ionicons name="add" size={22} color="#CBD5E1" />
                        </Pressable>
                      </View>

                      {prefSkills.length > 0 && (
                        <View style={styles.skillTagsWrap}>
                          {prefSkills.map((sk) => (
                            <View key={sk} style={styles.skillTag}>
                              <Text style={styles.skillTagText}>{sk}</Text>
                              <Pressable onPress={() => removePrefSkill(sk)}>
                                <Ionicons name="close" size={14} color="#CBD5E1" />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 2. Hire a Mentor Card */}
                {selectedServices.includes('HIRE_MENTOR') && (
                  <View style={styles.subServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.subServiceHeaderLeft}>
                        <Ionicons name="school" size={20} color="#A78BFA" />
                        <Text style={styles.subServiceTitle}>Hire a Mentor</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleService('HIRE_MENTOR')}
                        hitSlop={8}
                        accessibilityLabel="Remove Hire Mentor"
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Expertise needed *</Text>
                      <TextInput
                        value={mentorExpertise}
                        onChangeText={setMentorExpertise}
                        placeholder="e.g. AI / Machine Learning, Cloud Architecture"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Engagement</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setMentorEngagementDropdownOpen((prev) => !prev)}
                        style={[
                          styles.dropdownTrigger,
                          mentorEngagementDropdownOpen && styles.dropdownTriggerOpen,
                        ]}
                      >
                        <Text style={styles.dropdownSelectedText}>{mentorEngagement}</Text>
                        <Ionicons
                          name={mentorEngagementDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#94A3B8"
                        />
                      </Pressable>

                      {mentorEngagementDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {MENTOR_ENGAGEMENT_OPTIONS.map((eng, index) => {
                            const isSelected = mentorEngagement === eng;
                            const isLast = index === MENTOR_ENGAGEMENT_OPTIONS.length - 1;
                            return (
                              <Pressable
                                key={eng}
                                onPress={() => {
                                  setMentorEngagement(eng);
                                  setMentorEngagementDropdownOpen(false);
                                }}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected,
                                  !isLast && styles.dropdownItemBorder,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    isSelected && styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {eng}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-circle" size={18} color="#A78BFA" />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 3. College Funding Card */}
                {selectedServices.includes('COLLEGE_FUNDING') && (
                  <View style={styles.subServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.subServiceHeaderLeft}>
                        <Ionicons name="business" size={20} color="#A78BFA" />
                        <Text style={styles.subServiceTitle}>College Funding</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleService('COLLEGE_FUNDING')}
                        hitSlop={8}
                        accessibilityLabel="Remove College Funding"
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Estimated Amount (₹)</Text>
                      <TextInput
                        value={collegeFundingAmount}
                        onChangeText={(text) =>
                          setCollegeFundingAmount(text.replace(/[^0-9]/g, ''))
                        }
                        placeholder="e.g. 25000"
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        style={styles.textInput}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Funding purpose *</Text>
                      <TextInput
                        value={collegeFundingPurpose}
                        onChangeText={setCollegeFundingPurpose}
                        placeholder="Describe what the funding will be used for..."
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={3}
                        style={[styles.textInput, styles.textAreaShort]}
                      />
                    </View>
                  </View>
                )}

                {/* 4. Crowdfunding Card */}
                {selectedServices.includes('CROWDFUNDING') && (
                  <View style={styles.subServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.subServiceHeaderLeft}>
                        <Ionicons name="wallet" size={20} color="#A78BFA" />
                        <Text style={styles.subServiceTitle}>Crowdfunding</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleService('CROWDFUNDING')}
                        hitSlop={8}
                        accessibilityLabel="Remove Crowdfunding"
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <Text style={styles.crowdfundNotice}>
                      This records community-support interest only. Payments are not enabled.
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Target Amount (₹)</Text>
                      <TextInput
                        value={crowdfundingAmount}
                        onChangeText={(text) =>
                          setCrowdfundingAmount(text.replace(/[^0-9]/g, ''))
                        }
                        placeholder="e.g. 50000"
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        style={[styles.textInput, styles.targetAmountInput]}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Why should the community support it? *</Text>
                      <TextInput
                        value={crowdfundingReason}
                        onChangeText={setCrowdfundingReason}
                        placeholder="Explain project impact and why funds are needed..."
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={3}
                        style={[styles.textInput, styles.textAreaShort]}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Next Button */}
            <Pressable onPress={handleNextStep2} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#080B11" />
            </Pressable>
          </View>
        )}

        {/* STEP 3: Review & Publish */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <Text style={styles.sectionHeading}>Project Preview</Text>
            <Text style={styles.sectionSubheading}>Here's how your project will appear.</Text>

            {/* Preview Card */}
            <View style={styles.previewCard}>
              <View style={styles.previewGradientHeader}>
                <View style={styles.previewCategoryChip}>
                  <Text style={styles.previewCategoryText}>{category}</Text>
                </View>
              </View>
              <View style={styles.previewCardBody}>
                <Text style={styles.previewTitle}>{title || 'Project Title'}</Text>
                <Text style={styles.previewDesc}>
                  {shortDesc || 'Project short description preview...'}
                </Text>

                <View style={styles.previewMetaRow}>
                  <View style={styles.previewMetaItem}>
                    <Ionicons name="location-outline" size={14} color="#94A3B8" />
                    <Text style={styles.previewMetaText}>NMIT North Campus</Text>
                  </View>
                  <View style={styles.previewMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.previewMetaText}>{expectedDuration}</Text>
                  </View>
                </View>

                {skills.length > 0 && (
                  <View style={styles.previewSkillsRow}>
                    {skills.map((skill) => (
                      <View key={skill} style={styles.previewSkillPill}>
                        <Text style={styles.previewSkillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Support Required Section */}
            {selectedServices.length > 0 && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Support Required</Text>
                <View style={styles.supportChipsRow}>
                  {selectedServices.map((srv) => (
                    <View key={srv} style={styles.supportBadge}>
                      <Ionicons name="people-outline" size={14} color="#C4B5FD" />
                      <Text style={styles.supportBadgeText}>
                        {srv === 'HIRE_STUDENTS'
                          ? 'Hire students'
                          : srv === 'HIRE_MENTOR'
                          ? 'Hire a mentor'
                          : srv === 'COLLEGE_FUNDING'
                          ? 'College funding'
                          : 'Crowdfunding'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Project Document (PDF Only) */}
            <View style={styles.reviewSection}>
              <View style={styles.pdfHeaderRow}>
                <Text style={styles.reviewSectionTitle}>Project Document</Text>
                <View style={styles.pdfOnlyBadge}>
                  <Text style={styles.pdfOnlyBadgeText}>PDF only</Text>
                </View>
              </View>
              <Text style={styles.reviewSectionSub}>
                Attach your project proposal, presentation, or deck (optional)
              </Text>

              {pdfFile ? (
                <View style={styles.pdfCard}>
                  <View style={styles.pdfIconBox}>
                    <Ionicons name="document-text" size={24} color="#EF4444" />
                    <View style={styles.pdfTag}>
                      <Text style={styles.pdfTagText}>PDF</Text>
                    </View>
                  </View>
                  <View style={styles.pdfDetails}>
                    <Text style={styles.pdfName} numberOfLines={1}>
                      {pdfFile.name}
                    </Text>
                    {pdfFile.size ? (
                      <Text style={styles.pdfSize}>{formatFileSize(pdfFile.size)}</Text>
                    ) : null}
                  </View>
                  <View style={styles.pdfActions}>
                    <Pressable
                      onPress={handlePickPdf}
                      style={styles.pdfActionBtn}
                      accessibilityLabel="Change PDF"
                    >
                      <Ionicons name="swap-horizontal" size={18} color="#A78BFA" />
                    </Pressable>
                    <Pressable
                      onPress={() => setPdfFile(null)}
                      style={[styles.pdfActionBtn, styles.pdfRemoveBtn]}
                      accessibilityLabel="Remove PDF"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={handlePickPdf}
                  style={styles.uploadPdfCard}
                >
                  <View style={styles.uploadPdfIconBox}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#A78BFA" />
                  </View>
                  <View style={styles.uploadPdfCopy}>
                    <Text style={styles.uploadPdfTitle}>Upload PDF Document</Text>
                    <Text style={styles.uploadPdfHint}>Tap to choose a .pdf file (max 10MB)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>

            {/* Visibility */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Visibility *</Text>

              {/* Option 1: Campus Only */}
              <Pressable
                onPress={() => setVisibility('CAMPUS_ONLY')}
                style={styles.visibilityOption}
              >
                <View
                  style={[
                    styles.radioOuter,
                    visibility === 'CAMPUS_ONLY' && styles.radioOuterSelected,
                  ]}
                >
                  {visibility === 'CAMPUS_ONLY' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.visibilityCopy}>
                  <Text style={styles.visibilityLabel}>NMIT only</Text>
                  <Text style={styles.visibilitySub}>Visible to every active campus role</Text>
                </View>
              </Pressable>

              {/* Option 2: Public */}
              <View style={[styles.visibilityOption, { opacity: 0.6 }]}>
                <View style={styles.radioOuter}>
                  {visibility === 'PUBLIC' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.visibilityCopy}>
                  <Text style={styles.visibilityLabel}>Public (Coming Soon)</Text>
                  <Text style={styles.visibilitySub}>Public discovery is not enabled yet</Text>
                </View>
              </View>
            </View>

            {/* Publish Button */}
            <Pressable
              onPress={handlePublish}
              disabled={submitting}
              style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#080B11" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isEditing ? 'Save Changes' : 'Publish Project 🚀'}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Unified App Message Modal */}
      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => {
          modalConfig.onConfirm?.();
          setModalConfig((prev) => ({ ...prev, visible: false }));
        }}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(Colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#080B11',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitles: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    headerSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: '#94A3B8',
      marginTop: 2,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    stepItem: {
      alignItems: 'center',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepCircleActive: {
      backgroundColor: '#8B5CF6',
    },
    stepNumber: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    stepLabel: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#64748B',
    },
    stepLabelActive: {
      color: '#A78BFA',
      fontWeight: '600',
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: '#1E293B',
      marginHorizontal: 8,
      marginBottom: 16,
    },
    stepLineActive: {
      backgroundColor: '#8B5CF6',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    stepBody: {
      marginTop: 18,
    },
    sectionHeading: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 4,
    },
    sectionSubheading: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: '#94A3B8',
      marginBottom: 20,
    },
    fieldGroup: {
      marginBottom: 18,
    },
    fieldLabel: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '600',
      color: '#E2E8F0',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: '#F8FAFC',
      fontFamily: Typography.regular,
      fontSize: 14,
    },
    textAreaShort: {
      height: 80,
      textAlignVertical: 'top',
    },
    textAreaLong: {
      height: 120,
      textAlignVertical: 'top',
    },
    counter: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#64748B',
      marginTop: 4,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#1E293B',
    },
    chipActive: {
      backgroundColor: 'rgba(13, 148, 136, 0.25)',
      borderColor: '#14B8A6',
    },
    chipText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#94A3B8',
    },
    chipTextActive: {
      color: '#2DD4BF',
      fontWeight: '600',
    },
    skillInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    skillInputField: {
      flex: 1,
    },
    addSkillBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    skillTagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    skillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#1E293B',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
    },
    skillTagText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#E2E8F0',
    },
    serviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    serviceCard: {
      width: '48%',
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 16,
      padding: 14,
      justifyContent: 'space-between',
    },
    serviceCardSelected: {
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    serviceCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    serviceIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#64748B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      borderColor: '#8B5CF6',
      backgroundColor: '#8B5CF6',
    },
    serviceTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 4,
    },
    serviceDesc: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      lineHeight: 16,
    },
    additionalDetailsSection: {
      marginBottom: 20,
    },
    additionalHeading: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 2,
    },
    additionalSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      marginBottom: 16,
    },
    subServiceCard: {
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    subServiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    subServiceHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    subServiceTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    crowdfundNotice: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      marginBottom: 14,
      lineHeight: 16,
    },
    targetAmountInput: {
      borderColor: '#8B5CF6',
    },
    addSkillCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#A78BFA',
      borderRadius: 24,
      paddingVertical: 14,
      gap: 8,
      marginTop: 10,
    },
    primaryBtnText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: '#080B11',
    },
    previewCard: {
      backgroundColor: '#0F172A',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#1E293B',
      overflow: 'hidden',
      marginBottom: 20,
    },
    previewGradientHeader: {
      height: 120,
      backgroundColor: '#1E1B4B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCategoryChip: {
      backgroundColor: 'rgba(16, 185, 129, 0.25)',
      borderColor: '#10B981',
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    previewCategoryText: {
      color: '#34D399',
      fontSize: 12,
      fontWeight: '600',
    },
    previewCardBody: {
      padding: 16,
    },
    previewTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 4,
    },
    previewDesc: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: '#94A3B8',
      marginBottom: 12,
    },
    previewMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 10,
    },
    previewMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    previewMetaText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
    },
    previewSkillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    previewSkillPill: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    previewSkillText: {
      fontSize: 11,
      color: '#CBD5E1',
    },
    reviewSection: {
      marginBottom: 20,
    },
    reviewSectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 4,
    },
    reviewSectionSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      marginBottom: 10,
    },
    supportChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    supportBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    supportBadgeText: {
      color: '#E2E8F0',
      fontSize: 12,
      fontWeight: '500',
    },
    pdfHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pdfOnlyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    pdfOnlyBadgeText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: '#F87171',
      fontWeight: '600',
    },
    uploadPdfCard: {
      backgroundColor: '#111827',
      borderWidth: 1.5,
      borderColor: '#334155',
      borderStyle: 'dashed',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    uploadPdfIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(167, 139, 250, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadPdfCopy: {
      flex: 1,
    },
    uploadPdfTitle: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: '#F8FAFC',
    },
    uploadPdfHint: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#64748B',
      marginTop: 2,
    },
    pdfCard: {
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pdfIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    pdfTag: {
      position: 'absolute',
      bottom: -3,
      backgroundColor: '#EF4444',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
    },
    pdfTagText: {
      fontSize: 8,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pdfDetails: {
      flex: 1,
    },
    pdfName: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#F8FAFC',
    },
    pdfSize: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#94A3B8',
      marginTop: 2,
    },
    pdfActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pdfActionBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pdfRemoveBtn: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    visibilityOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#64748B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterSelected: {
      borderColor: '#8B5CF6',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#8B5CF6',
    },
    visibilityCopy: {
      flex: 1,
    },
    visibilityLabel: {
      fontFamily: Typography.medium,
      fontSize: 14,
      fontWeight: '600',
      color: '#F8FAFC',
    },
    visibilitySub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#64748B',
    },
    dropdownTrigger: {
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownTriggerOpen: {
      borderColor: '#8B5CF6',
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },
    dropdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dropdownSelectedText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: '#F8FAFC',
    },
    dropdownMenu: {
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#8B5CF6',
      borderTopWidth: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      overflow: 'hidden',
      marginTop: -2,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownItemSelected: {
      backgroundColor: 'rgba(139, 92, 246, 0.16)',
    },
    dropdownItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#1E293B',
    },
    dropdownItemText: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: '#CBD5E1',
    },
    dropdownItemTextSelected: {
      fontFamily: Typography.medium,
      color: '#C4B5FD',
      fontWeight: '600',
    },
  });
}
