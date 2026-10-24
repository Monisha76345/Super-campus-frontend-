import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';
import { CommunityPost, MySubmissionsData, PostStatus } from '../types/community-types';

interface SubmissionsModalProps {
  visible: boolean;
  data: MySubmissionsData | null;
  onClose: () => void;
}

export function SubmissionsModal({
  visible,
  data,
  onClose,
}: SubmissionsModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [filter, setFilter] = useState<'ALL' | PostStatus>('ALL');

  if (!visible) return null;

  const posts = data?.posts || [];
  const filteredPosts =
    filter === 'ALL'
      ? posts
      : posts.filter((p) => p.status === filter);

  const renderStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.statusBadge, styles.statusApproved]}>
            <Text style={styles.statusApprovedText}>Approved</Text>
          </View>
        );
      case 'PENDING_APPROVAL':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusPendingText}>Pending Review</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <Text style={styles.statusRejectedText}>Rejected</Text>
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: CommunityPost }) => (
    <View style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        {renderStatusBadge(item.status)}
        <Text style={styles.submissionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.submissionContent} numberOfLines={3}>
        {item.content}
      </Text>
      {item.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Reason: {item.rejectionReason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragPill} />
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>My Submissions</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>
          </View>

          {/* Counts Filter Bar */}
          <View style={styles.filterBar}>
            <Pressable
              onPress={() => setFilter('ALL')}
              style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
                All ({posts.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('PENDING_APPROVAL')}
              style={[styles.filterChip, filter === 'PENDING_APPROVAL' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'PENDING_APPROVAL' && styles.filterTextActive]}>
                Pending ({data?.pendingCount || 0})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('APPROVED')}
              style={[styles.filterChip, filter === 'APPROVED' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'APPROVED' && styles.filterTextActive]}>
                Approved ({data?.approvedCount || 0})
              </Text>
            </Pressable>
          </View>

          {/* Submissions List */}
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={36} color="#475569" />
                <Text style={styles.emptyTitle}>No submissions found</Text>
                <Text style={styles.emptySubtitle}>Posts you submit for campus approval will appear here.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
      minHeight: '50%',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingBottom: 20,
    },
    header: {
      alignItems: 'center',
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    dragPill: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.15)',
      marginBottom: 10,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: isDark ? '#090D16' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    filterChipActive: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(49, 52, 145, 0.1)',
      borderColor: isDark ? '#38BDF8' : Colors.primary.main,
    },
    filterText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: Colors.text.secondary,
    },
    filterTextActive: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontWeight: '700',
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    submissionCard: {
      backgroundColor: isDark ? '#090D16' : '#F8FAFC',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 14,
    },
    submissionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusApproved: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    statusApprovedText: {
      fontFamily: Typography.bold,
      fontSize: 10.5,
      color: '#4ADE80',
    },
    statusPending: {
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
    },
    statusPendingText: {
      fontFamily: Typography.bold,
      fontSize: 10.5,
      color: '#FACC15',
    },
    statusRejected: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusRejectedText: {
      fontFamily: Typography.bold,
      fontSize: 10.5,
      color: '#F87171',
    },
    submissionDate: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    submissionContent: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.primary,
      lineHeight: 18,
    },
    rejectionBox: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    rejectionLabel: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: '#FCA5A5',
    },
    emptyBox: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.primary,
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
  });
}
