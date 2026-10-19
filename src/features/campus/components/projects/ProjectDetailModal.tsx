import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType } from '@/components/ui';
import { useColors } from '@/theme/app-theme';
import { Project, ProjectStatus } from '../../project-types';

interface ProjectDetailModalProps {
  project: Project | null;
  visible: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  onDelete?: (projectId: string) => Promise<void>;
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
}: ProjectDetailModalProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const [updating, setUpdating] = useState(false);
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

  if (!project) return null;

  const isOwner = project.creatorId === currentUserId;
  const canManage = isOwner || isAdmin;

  const handleUpdateStatus = async (status: ProjectStatus) => {
    try {
      setUpdating(true);
      await onStatusChange(project.id, status);
    } catch (err: any) {
      setModalConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: err?.message || 'Could not update status',
      });
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
                  <Ionicons name="pencil" size={16} color="#A78BFA" />
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.description}>{project.shortDescription}</Text>

            {project.moreDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About this project</Text>
                <Text style={styles.sectionBody}>{project.moreDetails}</Text>
              </View>
            )}

            {/* Metadata */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="compass-outline" size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{project.stage}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{project.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{project.location}</Text>
              </View>
            </View>

            {/* Skills */}
            {project.skills && project.skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills Needed</Text>
                <View style={styles.chipsRow}>
                  {project.skills.map((skill) => (
                    <View key={skill} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Support Needed */}
            {project.supportNeeds && project.supportNeeds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support Requested</Text>
                {project.supportNeeds.map((s, idx) => (
                  <View key={idx} style={styles.supportCard}>
                    <Text style={styles.supportType}>
                      {s.serviceType === 'HIRE_STUDENTS'
                        ? '👥 Hire Students'
                        : s.serviceType === 'HIRE_MENTOR'
                        ? '🎓 Hire a Mentor'
                        : s.serviceType === 'COLLEGE_FUNDING'
                        ? '🏛️ College Funding'
                        : '💰 Crowdfunding'}
                    </Text>
                    {s.rolesNeeded && (
                      <Text style={styles.supportDetail}>Roles: {s.rolesNeeded}</Text>
                    )}
                    {s.numberOfStudents && (
                      <Text style={styles.supportDetail}>Count: {s.numberOfStudents}</Text>
                    )}
                    {s.commitment && (
                      <Text style={styles.supportDetail}>Commitment: {s.commitment}</Text>
                    )}
                    {s.mentorDomain && (
                      <Text style={styles.supportDetail}>Domain: {s.mentorDomain}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Attached PDF Document */}
            {project.pdfDocument && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Document</Text>
                <View style={styles.pdfCard}>
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
                    {project.pdfDocument.size ? (
                      <Text style={styles.pdfSize}>
                        {project.pdfDocument.size < 1024 * 1024
                          ? `${(project.pdfDocument.size / 1024).toFixed(1)} KB`
                          : `${(project.pdfDocument.size / (1024 * 1024)).toFixed(1)} MB`}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>Attached</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Status Management Actions (For Owner / Admin) */}
            {canManage && (
              <View style={styles.manageBox}>
                <Text style={styles.manageTitle}>Manage Project Status</Text>
                <Text style={styles.manageSub}>
                  Change the project status as your team and milestones progress.
                </Text>

                {updating ? (
                  <ActivityIndicator color="#A78BFA" style={{ marginVertical: 12 }} />
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

function createStyles(Colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: '#0F172A',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    categoryBadgeText: {
      fontSize: 12,
      color: '#CBD5E1',
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerEditBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(167, 139, 250, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(167, 139, 250, 0.28)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      padding: 20,
      paddingBottom: 36,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 8,
    },
    description: {
      fontFamily: Typography.regular,
      fontSize: 15,
      lineHeight: 22,
      color: '#94A3B8',
      marginBottom: 16,
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '600',
      color: '#E2E8F0',
      marginBottom: 6,
    },
    sectionBody: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: '#94A3B8',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      marginBottom: 18,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: '#CBD5E1',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillPill: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    skillPillText: {
      color: '#818CF8',
      fontSize: 13,
      fontWeight: '500',
    },
    supportCard: {
      backgroundColor: '#111827',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#1E293B',
    },
    supportType: {
      color: '#F8FAFC',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    supportDetail: {
      color: '#94A3B8',
      fontSize: 13,
      marginTop: 2,
    },
    manageBox: {
      backgroundColor: '#080B11',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 18,
      padding: 16,
      marginTop: 10,
    },
    manageTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#F8FAFC',
      marginBottom: 2,
    },
    manageSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      marginBottom: 14,
    },
    statusButtonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    statusActionBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    statusActionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      marginTop: 4,
    },
    deleteBtnText: {
      color: '#EF4444',
      fontSize: 13,
      fontWeight: '600',
    },
    pdfCard: {
      backgroundColor: '#080B11',
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
    pdfBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    pdfBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#10B981',
    },
  });
}
