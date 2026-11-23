import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { apiRequest } from '@/lib/api/api-client';
import { useColors } from '@/theme/app-theme';

export interface PendingAlumnus {
  id: string;
  usn: string;
  fullName: string;
  collegeEmail?: string;
  department?: string;
  batch?: string;
  mobile?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface AlumniApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function AlumniApprovalModal({
  visible,
  onClose,
  onApproved,
}: AlumniApprovalModalProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const { user } = useAuthSession();

  const [items, setItems] = useState<PendingAlumnus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingUsn, setProcessingUsn] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    const activeToken = user?.token;
    const activeTenant = user?.tenantId && user.tenantId !== 'all' ? user.tenantId : 'nmit';
    if (!activeToken) return;

    setErrorMessage(null);
    try {
      const res = await apiRequest<any>('/users/alumni/pending?page=1&limit=50', {
        method: 'GET',
        token: activeToken,
        tenantId: activeTenant,
      });

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
            ? res.items
            : [];
      setItems(list);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect to campus alumni server.');
    }
  }, [user?.token, user?.tenantId]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchPending().finally(() => setLoading(false));
    }
  }, [visible, fetchPending]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  };

  const handleApprove = async (alumnus: PendingAlumnus) => {
    const activeToken = user?.token;
    const activeTenant = user?.tenantId && user.tenantId !== 'all' ? user.tenantId : 'nmit';
    if (!activeToken || processingUsn) return;

    setProcessingUsn(alumnus.usn);
    try {
      await apiRequest(`/users/directory/${encodeURIComponent(alumnus.usn)}/alumni/approve`, {
        method: 'POST',
        token: activeToken,
        tenantId: activeTenant,
      });

      Alert.alert(
        'Alumni Approved 🎉',
        `${alumnus.fullName} (${alumnus.usn}) has been approved. They can now sign in using their registered mobile number.`,
      );

      setItems((prev) => prev.filter((item) => item.usn !== alumnus.usn));
      onApproved?.();
    } catch (err: any) {
      Alert.alert('Approval Failed', err?.message || 'Could not approve alumni. Please try again.');
    } finally {
      setProcessingUsn(null);
    }
  };

  const handleReject = (alumnus: PendingAlumnus) => {
    Alert.alert(
      'Reject Alumni Claim',
      `Are you sure you want to reject the mobile claim for ${alumnus.fullName} (${alumnus.usn})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Claim',
          style: 'destructive',
          onPress: async () => {
            const activeToken = user?.token;
            const activeTenant = user?.tenantId && user.tenantId !== 'all' ? user.tenantId : 'nmit';
            if (!activeToken || processingUsn) return;

            setProcessingUsn(alumnus.usn);
            try {
              await apiRequest(`/users/directory/${encodeURIComponent(alumnus.usn)}/alumni/reject`, {
                method: 'POST',
                token: activeToken,
                tenantId: activeTenant,
              });

              setItems((prev) => prev.filter((item) => item.usn !== alumnus.usn));
              Alert.alert('Claim Rejected', `Mobile claim for ${alumnus.usn} has been cleared.`);
              onApproved?.();
            } catch (err: any) {
              Alert.alert('Reject Failed', err?.message || 'Could not reject alumni claim.');
            } finally {
              setProcessingUsn(null);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.shieldIconWrap}>
              <Ionicons name="school-outline" size={18} color="#38BDF8" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Alumni Approvals</Text>
              <Text style={styles.headerSub}>Verify pending alumni mobile claims</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </Pressable>
        </View>

        {/* Status Banner */}
        <View style={styles.countBanner}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{items.length} Pending</Text>
          </View>
          <Text style={styles.countBannerText}>
            Alumni waiting for admin approval to log into Supercampus
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Loading pending alumni requests...</Text>
          </View>
        ) : errorMessage && items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Ionicons name="alert-circle" size={42} color="#EF4444" />
            </View>
            <Text style={styles.emptyTitle}>Notice</Text>
            <Text style={styles.emptyDesc}>{errorMessage}</Text>
            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.refreshBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done-circle" size={42} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyDesc}>
              There are no alumni claims waiting for approval right now.
            </Text>
            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.refreshBtnText}>Check Again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.listArea}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#38BDF8"
                colors={['#38BDF8']}
              />
            }>
            {items.map((alumnus) => {
              const isProcessing = processingUsn === alumnus.usn;
              return (
                <View key={alumnus.id || alumnus.usn} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {alumnus.fullName?.charAt(0)?.toUpperCase() || 'A'}
                      </Text>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.alumniName}>{alumnus.fullName}</Text>
                      <View style={styles.usnRow}>
                        <Text style={styles.usnText}>{alumnus.usn}</Text>
                        {alumnus.batch ? (
                          <Text style={styles.batchText}>· Batch of {alumnus.batch}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.pendingTag}>
                      <Text style={styles.pendingTagText}>PENDING</Text>
                    </View>
                  </View>

                  <View style={styles.detailBox}>
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={14} color="#38BDF8" />
                      <Text style={styles.detailLabel}>Claimed Mobile:</Text>
                      <Text style={styles.detailValueBold}>{alumnus.mobile || '—'}</Text>
                    </View>
                    {alumnus.department ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={14} color={Colors.text.tertiary} />
                        <Text style={styles.detailLabel}>Department:</Text>
                        <Text style={styles.detailValue}>{alumnus.department}</Text>
                      </View>
                    ) : null}
                    {alumnus.collegeEmail ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={14} color={Colors.text.tertiary} />
                        <Text style={styles.detailLabel}>College Email:</Text>
                        <Text style={styles.detailValue}>{alumnus.collegeEmail}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <Pressable
                      disabled={isProcessing}
                      onPress={() => handleReject(alumnus)}
                      style={[styles.rejectBtn, isProcessing && { opacity: 0.5 }]}>
                      <Ionicons name="close-circle-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </Pressable>

                    <Pressable
                      disabled={isProcessing}
                      onPress={() => handleApprove(alumnus)}
                      style={[styles.approveBtn, isProcessing && { opacity: 0.5 }]}>
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
                          <Text style={styles.approveBtnText}>Approve Alumni</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(Colors: any) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: Colors.background.canvas || '#080B11',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle || '#1E293B',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    shieldIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: Colors.text.primary || '#F8FAFC',
    },
    headerSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary || '#94A3B8',
      marginTop: 1,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: Colors.background.surface || '#1E293B',
    },
    countBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(56, 189, 248, 0.15)',
    },
    badgePill: {
      backgroundColor: '#38BDF8',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgePillText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#080B11',
    },
    countBannerText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary || '#94A3B8',
      flex: 1,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    loadingText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.secondary || '#94A3B8',
      marginTop: 12,
    },
    emptyBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary || '#F8FAFC',
      marginBottom: 6,
    },
    emptyDesc: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary || '#94A3B8',
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 280,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
    },
    refreshBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#38BDF8',
    },
    listArea: {
      flex: 1,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    card: {
      backgroundColor: Colors.background.surface || '#0F172A',
      borderWidth: 1,
      borderColor: Colors.border.subtle || '#1E293B',
      borderRadius: 14,
      padding: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    cardHeaderInfo: {
      flex: 1,
    },
    alumniName: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      color: Colors.text.primary || '#F8FAFC',
    },
    usnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    usnText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#38BDF8',
    },
    batchText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary || '#94A3B8',
      marginLeft: 4,
    },
    pendingTag: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pendingTagText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#F59E0B',
    },
    detailBox: {
      backgroundColor: Colors.background.canvas || '#080B11',
      borderRadius: 8,
      padding: 10,
      gap: 6,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailLabel: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary || '#94A3B8',
    },
    detailValue: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.primary || '#F8FAFC',
      flex: 1,
    },
    detailValueBold: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#38BDF8',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rejectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    rejectBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#EF4444',
    },
    approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#10B981',
    },
    approveBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
    },
  });
}
