import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { startDirectChatApi } from '@/features/chat/chat-api';
import { useColors } from '@/theme/app-theme';
import {
  applyToProjectApi,
  fetchProjectApplicationsApi,
  fetchProjectContributionsApi,
  fundProjectApi,
} from '../../project-api';
import {
  Project,
  ProjectApplication,
  ProjectContribution,
  ProjectStatus,
  ProjectSupportItem,
} from '../../project-types';

interface ProjectDetailModalProps {
  project: Project | null;
  visible: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  onDelete?: (projectId: string) => Promise<void>;
  onProjectUpdated?: (updated: Project) => void;
}

export function ProjectDetailModal({
  project,
  visible,
  currentUserId,
  isAdmin,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
  onProjectUpdated,
}: ProjectDetailModalProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [updating, setUpdating] = useState(false);
  const [messaging, setMessaging] = useState(false);

  // Funding Modal State
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('500');
  const [fundType, setFundType] = useState<'CROWDFUNDING' | 'COLLEGE_FUNDING'>('CROWDFUNDING');
  const [fundNotes, setFundNotes] = useState('');
  const [fundingLoading, setFundingLoading] = useState(false);

  // Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSupportId, setSelectedSupportId] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyingLoading, setApplyingLoading] = useState(false);

  // Applicants & Backers view for Owner
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applicantsList, setApplicantsList] = useState<ProjectApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [showBackersModal, setShowBackersModal] = useState(false);
  const [backersList, setBackersList] = useState<ProjectContribution[]>([]);
  const [loadingBackers, setLoadingBackers] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    onPrimaryPress?: () => void;
    onSecondaryPress?: () => void;
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
    primaryButtonText = 'OK',
    onPrimaryPress?: () => void,
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      primaryButtonText,
      onPrimaryPress,
    });
  };

  if (!project) return null;

  const isOwner = project.creatorId === currentUserId;
  const canManage = isOwner || isAdmin;

  // Check support offerings
  const hireStudents = project.supportNeeds?.find((s) => s.serviceType === 'HIRE_STUDENTS');
  const hireMentor = project.supportNeeds?.find((s) => s.serviceType === 'HIRE_MENTOR');
  const collegeFunding = project.supportNeeds?.find((s) => s.serviceType === 'COLLEGE_FUNDING');
  const crowdfunding = project.supportNeeds?.find((s) => s.serviceType === 'CROWDFUNDING');
  const hasFunding = !!collegeFunding || !!crowdfunding || (project.fundingTarget && project.fundingTarget > 0);

  // Open PDF Document
  const handleOpenPdf = async () => {
    const pdfUri = project.pdfDocument?.uri;
    if (!pdfUri) {
      showModal('No Document', 'No PDF file attached to this project.', 'warning');
      return;
    }
    try {
      if (pdfUri.startsWith('http://') || pdfUri.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(pdfUri);
      } else {
        await Linking.openURL(pdfUri);
      }
    } catch {
      Linking.openURL(pdfUri).catch(() => {
        showModal('Preview Error', 'Could not open PDF viewer on your device.', 'error');
      });
    }
  };

  const handleMessageCreator = async () => {
    if (!project?.creatorId || messaging) return;
    setMessaging(true);
    try {
      if (user?.token && user?.tenantId) {
        await startDirectChatApi(user.token, user.tenantId, project.creatorId);
      }
      onClose();
      router.push({
        pathname: '/inbox',
        params: {
          recipientId: project.creatorId,
          recipientName: project.creatorName || 'Project Creator',
        },
      });
    } catch {
      onClose();
      router.push('/inbox');
    } finally {
      setMessaging(false);
    }
  };

  const handleUpdateStatus = async (status: ProjectStatus) => {
    try {
      setUpdating(true);
      await onStatusChange(project.id, status);
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    setModalConfig({
      visible: true,
      type: 'warning',
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel',
      onPrimaryPress: async () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
        if (onDelete) {
          await onDelete(project.id);
          onClose();
        }
      },
      onSecondaryPress: () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  // Funding Submission
  const handleConfirmFunding = async () => {
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) {
      showModal('Invalid Amount', 'Please enter a valid amount in ₹.', 'warning');
      return;
    }
    if (!user?.token || !user?.tenantId) {
      showModal('Sign in Required', 'Please log in to contribute funding.', 'warning');
      return;
    }

    setFundingLoading(true);
    try {
      const res = await fundProjectApi(user.token, user.tenantId, project.id, {
        amount: amt,
        fundingType: fundType,
        notes: fundNotes.trim() || undefined,
        paymentMethod: 'CAMPUS_UPI',
      });
      setShowFundModal(false);
      onProjectUpdated?.(res.project);
      showModal(
        'Payment Verified & Recorded',
        `Successfully contributed ₹${amt.toLocaleString('en-IN')} via Campus Gateway!\nTransaction ID: ${res.contribution.transactionId}`,
        'success',
      );
    } catch (err: any) {
      showModal('Funding Error', err?.message || 'Could not complete contribution.', 'error');
    } finally {
      setFundingLoading(false);
    }
  };

  // Application Submission
  const handleConfirmApply = async () => {
    if (!selectedRole.trim()) {
      showModal('Role Required', 'Please select or specify the role you are applying for.', 'warning');
      return;
    }
    if (!user?.token || !user?.tenantId) {
      showModal('Sign in Required', 'Please log in to apply.', 'warning');
      return;
    }

    setApplyingLoading(true);
    try {
      await applyToProjectApi(user.token, user.tenantId, project.id, {
        roleApplied: selectedRole.trim(),
        supportId: selectedSupportId || undefined,
        message: applyMessage.trim() || undefined,
      });
      setShowApplyModal(false);
      setApplyMessage('');
      showModal(
        'Application Sent',
        `Your application for "${selectedRole}" has been submitted to ${project.creatorName || 'the project lead'}.`,
        'success',
      );
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not submit application.', 'error');
    } finally {
      setApplyingLoading(false);
    }
  };

  // Open Applicants
  const handleViewApplicants = async () => {
    if (!user?.token || !user?.tenantId) return;
    setLoadingApplicants(true);
    setShowApplicantsModal(true);
    try {
      const apps = await fetchProjectApplicationsApi(user.token, user.tenantId, project.id);
      setApplicantsList(apps);
    } catch {
      setApplicantsList([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Open Backers
  const handleViewBackers = async () => {
    if (!user?.token || !user?.tenantId) return;
    setLoadingBackers(true);
    setShowBackersModal(true);
    try {
      const backers = await fetchProjectContributionsApi(user.token, user.tenantId, project.id);
      setBackersList(backers);
    } catch {
      setBackersList([]);
    } finally {
      setLoadingBackers(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Open', bg: 'rgba(16, 185, 129, 0.16)', color: '#10B981' };
      case 'ACTIVE':
        return { label: 'Active', bg: 'rgba(59, 130, 246, 0.16)', color: '#3B82F6' };
      case 'COMPLETED':
        return { label: 'Completed', bg: 'rgba(129, 140, 248, 0.16)', color: '#818CF8' };
      default:
        return { label: status, bg: 'rgba(148, 163, 184, 0.16)', color: '#94A3B8' };
    }
  };

  const badge = getStatusBadge(project.status);
  const target = project.fundingTarget || 0;
  const raised = project.fundingRaised || 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : raised > 0 ? 100 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgesRow}>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{project.category}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {canManage && onEdit && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit Project"
                  onPress={() => {
                    onClose();
                    onEdit(project);
                  }}
                  style={styles.headerEditBtn}
                >
                  <Ionicons name="pencil" size={16} color={Colors.primary.accent} />
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.description}>{project.shortDescription}</Text>

            {/* Creator Card */}
            <View style={styles.creatorCard}>
              <View style={styles.creatorHeader}>
                <View style={styles.creatorAvatarCircle}>
                  <Text style={styles.creatorAvatarText}>
                    {(project.creatorName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.creatorInfoCol}>
                  <View style={styles.creatorNameRow}>
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {project.creatorName || 'Campus Member'}
                    </Text>
                    {project.creatorRole === 'FACULTY' ? (
                      <View style={[styles.rolePill, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.4)' }]}>
                        <Text style={[styles.rolePillText, { color: '#F472B6' }]}>Faculty Lead</Text>
                      </View>
                    ) : project.creatorRole === 'ALUMNI' ? (
                      <View style={[styles.rolePill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                        <Text style={[styles.rolePillText, { color: '#FBBF24' }]}>Alumni</Text>
                      </View>
                    ) : (
                      <View style={[styles.rolePill, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
                        <Text style={[styles.rolePillText, { color: '#38BDF8' }]}>Student</Text>
                      </View>
                    )}
                  </View>

                  {/* Role details */}
                  {project.creatorRole === 'FACULTY' ? (
                    <View style={styles.detailChipsRow}>
                      {project.creatorDepartment ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="business-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>Dept: {project.creatorDepartment}</Text>
                        </View>
                      ) : null}
                      {project.creatorEmployeeId ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="id-card-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>ID: {project.creatorEmployeeId}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : project.creatorRole === 'ALUMNI' ? (
                    <View style={styles.detailChipsRow}>
                      {project.creatorBatch ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="school-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>Batch of {project.creatorBatch}</Text>
                        </View>
                      ) : null}
                      {project.creatorDepartment ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="business-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>{project.creatorDepartment}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.detailChipsRow}>
                      {project.creatorUsn ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="id-card-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>USN: {project.creatorUsn}</Text>
                        </View>
                      ) : null}
                      {project.creatorDepartment ? (
                        <View style={styles.chipTag}>
                          <Ionicons name="business-outline" size={12} color="#CBD5E1" />
                          <Text style={styles.chipTagText}>{project.creatorDepartment}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {/* Message Creator Button */}
              {!isOwner && (
                <Pressable
                  style={styles.messageCreatorBtn}
                  onPress={handleMessageCreator}
                  disabled={messaging}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
                  <Text style={styles.messageCreatorText}>
                    {messaging ? 'Opening chat...' : 'Message Project Lead'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* FUNDING PROGRESS CARD (Crowdfunding / College Funding) */}
            {hasFunding && (
              <View style={styles.fundingCard}>
                <View style={styles.fundingHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="wallet" size={18} color="#10B981" />
                    <Text style={styles.fundingTitle}>Project Funding & Grants</Text>
                  </View>
                  <View style={styles.verifiedGatewayBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.verifiedGatewayText}>Verified Gateway</Text>
                  </View>
                </View>

                <View style={styles.fundingMetricsRow}>
                  <View>
                    <Text style={styles.fundingRaisedAmount}>
                      ₹{raised.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.fundingTargetText}>
                      raised of ₹{target > 0 ? target.toLocaleString('en-IN') : 'Open'} goal
                    </Text>
                  </View>
                  <View style={styles.backersBadge}>
                    <Text style={styles.backersCountText}>{project.backersCount || 0}</Text>
                    <Text style={styles.backersLabelText}>Supporters</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressPercentText}>{progressPercent}% funded</Text>

                {/* Action Buttons for Funding */}
                <View style={styles.fundingActionsRow}>
                  <Pressable
                    style={styles.fundNowBtn}
                    onPress={() => {
                      setFundType(collegeFunding ? 'COLLEGE_FUNDING' : 'CROWDFUNDING');
                      setShowFundModal(true);
                    }}
                  >
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                    <Text style={styles.fundNowBtnText}>Back / Fund Project</Text>
                  </Pressable>

                  {canManage && (
                    <Pressable
                      style={styles.viewBackersBtn}
                      onPress={handleViewBackers}
                    >
                      <Ionicons name="people-outline" size={15} color={Colors.primary.accent} />
                      <Text style={styles.viewBackersText}>View Backers</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* TEAM RECRUITMENT / MENTORSHIP ACTION */}
            {(hireStudents || hireMentor) && (
              <View style={styles.recruitmentCard}>
                <View style={styles.recruitmentHeader}>
                  <Ionicons name="people" size={18} color="#3B82F6" />
                  <Text style={styles.recruitmentTitle}>Open Roles & Team Recruitment</Text>
                </View>
                {hireStudents && (
                  <View style={styles.recruitmentRow}>
                    <Text style={styles.recruitmentRoleTitle}>
                      Students Needed: {hireStudents.rolesNeeded || 'Open Contributor'}
                    </Text>
                    <Text style={styles.recruitmentRoleDesc}>
                      {hireStudents.numberOfStudents ? `Positions: ${hireStudents.numberOfStudents} • ` : ''}
                      {hireStudents.commitment || 'Part-time'}
                    </Text>
                  </View>
                )}
                {hireMentor && (
                  <View style={styles.recruitmentRow}>
                    <Text style={styles.recruitmentRoleTitle}>
                      Mentor Needed: {hireMentor.mentorDomain || hireMentor.rolesNeeded || 'Domain Advisor'}
                    </Text>
                    <Text style={styles.recruitmentRoleDesc}>
                      Commitment: {hireMentor.commitment || 'Periodic Sessions'}
                    </Text>
                  </View>
                )}

                <View style={styles.recruitmentActionsRow}>
                  {!isOwner && (
                    <Pressable
                      style={styles.applyBtn}
                      onPress={() => {
                        const defaultRole = hireStudents?.rolesNeeded || hireMentor?.rolesNeeded || 'Team Member';
                        setSelectedRole(defaultRole);
                        setSelectedSupportId(hireStudents?.id || hireMentor?.id || '');
                        setShowApplyModal(true);
                      }}
                    >
                      <Ionicons name="hand-right" size={15} color="#FFFFFF" />
                      <Text style={styles.applyBtnText}>Apply to Join</Text>
                    </Pressable>
                  )}

                  {canManage && (
                    <Pressable
                      style={styles.viewApplicantsBtn}
                      onPress={handleViewApplicants}
                    >
                      <Ionicons name="list-outline" size={15} color="#3B82F6" />
                      <Text style={styles.viewApplicantsText}>View Applicants</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Key Information Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Stage</Text>
                <Text style={styles.infoValue}>{project.stage}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{project.duration}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{project.location}</Text>
              </View>
            </View>

            {/* Full Details */}
            {project.moreDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About the Project</Text>
                <Text style={styles.bodyText}>{project.moreDetails}</Text>
              </View>
            )}

            {/* Skills */}
            {project.skills && project.skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills & Technologies</Text>
                <View style={styles.skillsRow}>
                  {project.skills.map((s, idx) => (
                    <View key={idx} style={styles.skillPill}>
                      <Text style={styles.skillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PDF Document Preview & Download Card */}
            {project.pdfDocument && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Documentation</Text>
                <Pressable
                  style={styles.pdfCard}
                  onPress={handleOpenPdf}
                  accessibilityRole="button"
                >
                  <View style={styles.pdfIconBox}>
                    <Ionicons name="document-text" size={24} color="#EF4444" />
                    <View style={styles.pdfTag}>
                      <Text style={styles.pdfTagText}>PDF</Text>
                    </View>
                  </View>
                  <View style={styles.pdfDetails}>
                    <Text style={styles.pdfName} numberOfLines={1}>
                      {project.pdfDocument.name}
                    </Text>
                    <Text style={styles.pdfSize}>Tap to preview / download PDF</Text>
                  </View>
                  <View style={styles.pdfActionPill}>
                    <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.pdfActionText}>View</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* Status Management Actions (For Owner / Admin) */}
            {canManage && (
              <View style={styles.manageBox}>
                <Text style={styles.manageTitle}>Manage Project Status</Text>
                <Text style={styles.manageSub}>
                  Transition your project status as milestones are reached.
                </Text>

                {updating ? (
                  <LogoLoader size={32} text="Updating status..." style={{ marginVertical: 8 }} />
                ) : (
                  <View style={styles.statusButtonsRow}>
                    {project.status !== 'OPEN' && (
                      <Pressable
                        onPress={() => handleUpdateStatus('OPEN')}
                        style={[styles.statusActionBtn, { borderColor: '#10B981' }]}
                      >
                        <Text style={[styles.statusActionText, { color: '#10B981' }]}>
                          Mark Open
                        </Text>
                      </Pressable>
                    )}

                    {project.status !== 'ACTIVE' && (
                      <Pressable
                        onPress={() => handleUpdateStatus('ACTIVE')}
                        style={[styles.statusActionBtn, { borderColor: '#3B82F6' }]}
                      >
                        <Text style={[styles.statusActionText, { color: '#3B82F6' }]}>
                          Mark Active
                        </Text>
                      </Pressable>
                    )}

                    {project.status !== 'COMPLETED' && (
                      <Pressable
                        onPress={() => handleUpdateStatus('COMPLETED')}
                        style={[styles.statusActionBtn, { borderColor: '#818CF8' }]}
                      >
                        <Text style={[styles.statusActionText, { color: '#818CF8' }]}>
                          Mark Completed
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {onDelete && (
                  <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete Project</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* FUNDING MODAL */}
      <Modal visible={showFundModal} animationType="slide" transparent>
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalSheet}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalTitle}>Support Project Funding</Text>
              <Pressable onPress={() => setShowFundModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.subModalSubtitle}>
              Select amount to contribute to "{project.title}". All payments are verified on the campus ledger.
            </Text>

            {/* Preset Amount Chips */}
            <View style={styles.presetAmountsRow}>
              {['200', '500', '1000', '2500'].map((amt) => (
                <Pressable
                  key={amt}
                  style={[styles.presetChip, fundAmount === amt && styles.presetChipActive]}
                  onPress={() => setFundAmount(amt)}
                >
                  <Text style={[styles.presetChipText, fundAmount === amt && styles.presetChipTextActive]}>
                    ₹{amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom Amount Input */}
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={fundAmount}
                onChangeText={setFundAmount}
                placeholder="Custom Amount"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            {/* Notes input */}
            <TextInput
              style={styles.notesInput}
              value={fundNotes}
              onChangeText={setFundNotes}
              placeholder="Add an encouraging note or specify grant allocation..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
            />

            <View style={styles.gatewayNotice}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.gatewayNoticeText}>
                Secured Campus Gateway • Instant verification
              </Text>
            </View>

            <Pressable
              style={styles.confirmFundBtn}
              onPress={handleConfirmFunding}
              disabled={fundingLoading}
            >
              {fundingLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmFundBtnText}>Pay & Contribute ₹{fundAmount}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* APPLICATION MODAL */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalSheet}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalTitle}>Apply for Project Role</Text>
              <Pressable onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <Text style={styles.subModalSubtitle}>
              Send your profile and statement of interest to {project.creatorName || 'the project lead'}.
            </Text>

            <Text style={styles.fieldLabel}>Role you are applying for</Text>
            <TextInput
              style={styles.inputField}
              value={selectedRole}
              onChangeText={setSelectedRole}
              placeholder="e.g. Frontend Developer, ML Researcher"
              placeholderTextColor={Colors.text.tertiary}
            />

            <Text style={styles.fieldLabel}>Message / Relevant Experience</Text>
            <TextInput
              style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]}
              value={applyMessage}
              onChangeText={setApplyMessage}
              placeholder="Why are you interested? Mention your relevant tech stack or experience..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
            />

            <Pressable
              style={styles.confirmApplyBtn}
              onPress={handleConfirmApply}
              disabled={applyingLoading}
            >
              {applyingLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmApplyBtnText}>Submit Application</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* VIEW APPLICANTS MODAL */}
      <Modal visible={showApplicantsModal} animationType="slide" transparent>
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalSheet}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalTitle}>Team Applicants ({applicantsList.length})</Text>
              <Pressable onPress={() => setShowApplicantsModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            {loadingApplicants ? (
              <ActivityIndicator size="small" color={Colors.primary.accent} style={{ padding: 20 }} />
            ) : applicantsList.length === 0 ? (
              <Text style={styles.emptyListText}>No applications received yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 340 }}>
                {applicantsList.map((app) => (
                  <View key={app.id} style={styles.applicantRow}>
                    <View style={styles.applicantAvatar}>
                      <Text style={styles.applicantAvatarText}>{app.applicantName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.applicantNameText}>{app.applicantName}</Text>
                      <Text style={styles.applicantRoleText}>
                        Role: {app.roleApplied} {app.applicantUsn ? `• ${app.applicantUsn}` : ''}
                      </Text>
                      {app.message ? (
                        <Text style={styles.applicantMessageText}>"{app.message}"</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* VIEW BACKERS MODAL */}
      <Modal visible={showBackersModal} animationType="slide" transparent>
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalSheet}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalTitle}>Project Backers ({backersList.length})</Text>
              <Pressable onPress={() => setShowBackersModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            {loadingBackers ? (
              <ActivityIndicator size="small" color={Colors.primary.accent} style={{ padding: 20 }} />
            ) : backersList.length === 0 ? (
              <Text style={styles.emptyListText}>No funding contributions yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 340 }}>
                {backersList.map((b) => (
                  <View key={b.id} style={styles.backerRow}>
                    <View style={styles.backerIcon}>
                      <Ionicons name="wallet-outline" size={18} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.backerNameText}>{b.contributorName}</Text>
                      <Text style={styles.backerDetailsText}>
                        {b.fundingType === 'COLLEGE_FUNDING' ? 'College Grant' : 'Crowdfunding'} • Txn: {b.transactionId}
                      </Text>
                    </View>
                    <Text style={styles.backerAmountText}>+₹{b.amount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Unified App Message Modal */}
      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryButtonText}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onPrimaryPress={modalConfig.onPrimaryPress}
        onSecondaryPress={modalConfig.onSecondaryPress}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: Colors.background.canvas,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
    },
    categoryBadge: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryBadgeText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerEditBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
      lineHeight: 28,
      marginBottom: 6,
    },
    description: {
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.secondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    // Creator Card
    creatorCard: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    creatorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    creatorAvatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.primary.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    creatorAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: '#FFFFFF',
    },
    creatorInfoCol: {
      flex: 1,
    },
    creatorNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    creatorName: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    rolePill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    rolePillText: {
      fontFamily: Typography.bold,
      fontSize: 10.5,
      fontWeight: '700',
    },
    detailChipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    chipTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.background.elevated,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    chipTagText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    messageCreatorBtn: {
      marginTop: 12,
      backgroundColor: Colors.primary.main,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 10,
    },
    messageCreatorText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Funding Card
    fundingCard: {
      backgroundColor: '#10B98115',
      borderWidth: 1,
      borderColor: '#10B98140',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    fundingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    fundingTitle: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    verifiedGatewayBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#10B98125',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    verifiedGatewayText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#10B981',
      fontWeight: '700',
    },
    fundingMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    fundingRaisedAmount: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: '#10B981',
    },
    fundingTargetText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    backersBadge: {
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    backersCountText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    backersLabelText: {
      fontFamily: Typography.medium,
      fontSize: 10.5,
      color: Colors.text.tertiary,
    },
    progressBarBg: {
      width: '100%',
      height: 8,
      backgroundColor: Colors.background.surface,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#10B981',
      borderRadius: 4,
    },
    progressPercentText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#10B981',
      textAlign: 'right',
      marginBottom: 12,
    },
    fundingActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    fundNowBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#10B981',
      paddingVertical: 10,
      borderRadius: 12,
    },
    fundNowBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    viewBackersBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    viewBackersText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: Colors.primary.accent,
    },
    // Recruitment Card
    recruitmentCard: {
      backgroundColor: '#3B82F615',
      borderWidth: 1,
      borderColor: '#3B82F640',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    recruitmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    recruitmentTitle: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    recruitmentRow: {
      marginBottom: 8,
    },
    recruitmentRoleTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: '#3B82F6',
    },
    recruitmentRoleDesc: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 1,
    },
    recruitmentActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    applyBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#3B82F6',
      paddingVertical: 10,
      borderRadius: 12,
    },
    applyBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    viewApplicantsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    viewApplicantsText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: '#3B82F6',
    },
    // Info Grid
    infoGrid: {
      flexDirection: 'row',
      backgroundColor: Colors.background.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.card,
      padding: 14,
      marginBottom: 16,
    },
    infoCol: {
      flex: 1,
      alignItems: 'center',
    },
    infoLabel: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.tertiary,
      marginBottom: 3,
    },
    infoValue: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    // Section
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 8,
    },
    bodyText: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: Colors.text.secondary,
      lineHeight: 20,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillPill: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    skillText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.primary,
    },
    // PDF Card
    pdfCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 14,
      padding: 12,
      gap: 12,
    },
    pdfIconBox: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pdfTag: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 4,
      borderRadius: 3,
      marginTop: 2,
    },
    pdfTagText: {
      fontFamily: Typography.bold,
      fontSize: 8,
      color: '#FFFFFF',
    },
    pdfDetails: {
      flex: 1,
    },
    pdfName: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      color: Colors.text.primary,
    },
    pdfSize: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    pdfActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EF4444',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    pdfActionText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // Manage Box
    manageBox: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    manageTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 3,
    },
    manageSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 12,
    },
    statusButtonsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    statusActionBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: Colors.background.canvas,
    },
    statusActionText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
      paddingVertical: 8,
    },
    deleteBtnText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: '#EF4444',
    },
    // Sub Modals (Funding, Apply, Lists)
    subModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    subModalSheet: {
      backgroundColor: Colors.background.canvas,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
    },
    subModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    subModalTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    subModalSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    presetAmountsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    presetChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    presetChipActive: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    presetChipText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.primary,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      height: 48,
    },
    currencySymbol: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      paddingVertical: 0,
    },
    notesInput: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 12,
      padding: 12,
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.primary,
      height: 70,
      textAlignVertical: 'top',
      marginBottom: 14,
    },
    gatewayNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    gatewayNoticeText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: '#10B981',
    },
    confirmFundBtn: {
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 14,
    },
    confirmFundBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    fieldLabel: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: Colors.text.secondary,
      marginBottom: 6,
    },
    inputField: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 12,
      padding: 12,
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.primary,
      marginBottom: 14,
    },
    confirmApplyBtn: {
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 14,
    },
    confirmApplyBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    applicantRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      alignItems: 'center',
    },
    applicantAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    applicantAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#FFFFFF',
    },
    applicantNameText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      color: Colors.text.primary,
    },
    applicantRoleText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    applicantMessageText: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: Colors.text.tertiary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    backerRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      alignItems: 'center',
    },
    backerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#10B98120',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backerNameText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      color: Colors.text.primary,
    },
    backerDetailsText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.tertiary,
    },
    backerAmountText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '800',
      color: '#10B981',
    },
    emptyListText: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: 24,
    },
  });
}
