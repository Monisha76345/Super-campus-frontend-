import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { Project, ProjectStatus } from '../../project-types';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onEdit?: () => void;
}

export function ProjectCard({ project, onPress, onEdit }: ProjectCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Open',
          bg: 'rgba(16, 185, 129, 0.16)',
          color: '#10B981',
          border: 'rgba(16, 185, 129, 0.35)',
        };
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: 'rgba(59, 130, 246, 0.16)',
          color: '#3B82F6',
          border: 'rgba(59, 130, 246, 0.35)',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'rgba(129, 140, 248, 0.16)',
          color: '#818CF8',
          border: 'rgba(129, 140, 248, 0.35)',
        };
      default:
        return {
          label: status,
          bg: 'rgba(148, 163, 184, 0.16)',
          color: '#94A3B8',
          border: 'rgba(148, 163, 184, 0.35)',
        };
    }
  };

  const statusBadge = getStatusBadge(project.status);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgesWrap}>
          <View
            style={[
              styles.badge,
              { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{project.category}</Text>
          </View>
        </View>

        {onEdit && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit Project"
            hitSlop={10}
            onPress={(e) => {
              e?.stopPropagation?.();
              onEdit();
            }}
            style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
          >
            <Ionicons name="pencil" size={14} color={Colors.primary.accent} />
          </Pressable>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {project.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {project.shortDescription}
      </Text>

      {/* Creator Info Box (Visible to All Users) */}
      <View style={styles.creatorRow}>
        <View style={styles.creatorAvatarCircle}>
          <Text style={styles.creatorAvatarText}>
            {(project.creatorName || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.creatorMetaCol}>
          <View style={styles.creatorNameRow}>
            <Text style={styles.creatorName} numberOfLines={1}>
              {project.creatorName || 'Campus Member'}
            </Text>
            {project.creatorRole === 'FACULTY' ? (
              <View style={[styles.rolePill, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.4)' }]}>
                <Text style={[styles.rolePillText, { color: '#F472B6' }]}>Faculty</Text>
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

          {/* Detailed identity lines requested by user */}
          {project.creatorRole === 'FACULTY' ? (
            <Text style={styles.creatorSubText} numberOfLines={1}>
              {project.creatorDepartment ? `Dept: ${project.creatorDepartment}` : 'Faculty Member'}
              {project.creatorEmployeeId ? ` · ID: ${project.creatorEmployeeId}` : project.creatorUsn ? ` · ID: ${project.creatorUsn}` : ''}
            </Text>
          ) : project.creatorRole === 'ALUMNI' ? (
            <Text style={styles.creatorSubText} numberOfLines={1}>
              Batch of {project.creatorBatch || 'Alumni'}
            </Text>
          ) : (
            <Text style={styles.creatorSubText} numberOfLines={1}>
              USN: {project.creatorUsn || 'Campus Student'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>{project.stage}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>{project.duration || '3 – 6 Months'}</Text>
        </View>
        {project.fundingTarget && project.fundingTarget > 0 ? (
          <View style={[styles.metaItem, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={[styles.metaText, { color: '#10B981', fontWeight: '700' }]}>
              ₹{(project.fundingRaised || 0).toLocaleString('en-IN')} / ₹{project.fundingTarget.toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}
        {project.skills && project.skills.length > 0 ? (
          <View style={styles.skillSnippet}>
            <Text style={styles.skillSnippetText} numberOfLines={1}>
              {project.skills.slice(0, 2).join(' · ')}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: Colors.background.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    badgesWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.background.pillInactive,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBtnPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.92 }],
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: 1,
    },
    badgeText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      fontWeight: '600',
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: Colors.background.pillInactive,
    },
    categoryText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 19,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    description: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.secondary,
      marginBottom: 12,
    },
    creatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 41, 59, 0.45)',
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: 'rgba(148, 163, 184, 0.15)',
    },
    creatorAvatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    creatorAvatarText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: '#38BDF8',
    },
    creatorMetaCol: {
      flex: 1,
      justifyContent: 'center',
    },
    creatorNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    creatorName: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
      flexShrink: 1,
    },
    rolePill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    rolePillText: {
      fontFamily: Typography.medium,
      fontSize: 10,
      fontWeight: '600',
    },
    creatorSubText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.tertiary,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '500',
      color: Colors.text.tertiary,
    },
    skillSnippet: {
      marginLeft: 'auto',
      maxWidth: '40%',
    },
    skillSnippetText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.accent,
    },
  });
}
