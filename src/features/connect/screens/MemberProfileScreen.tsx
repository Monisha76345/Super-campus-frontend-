import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { startDirectChatApi } from '@/features/chat/chat-api';
import {
  fetchMemberProfileApi,
  sendConnectionRequestApi,
  respondConnectionRequestApi,
} from '../api/connect-api';
import { ConnectMember } from '../types/connect-types';

interface MemberProfileScreenProps {
  member: ConnectMember;
  token: string;
  tenantId: string;
  onBack: () => void;
  onStartChat?: (recipient: {
    userId: string;
    fullName: string;
    initials: string;
    department?: string | null;
  }) => void;
}

export function MemberProfileScreen({
  member: initialMember,
  token,
  tenantId,
  onBack,
  onStartChat,
}: MemberProfileScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [member, setMember] = useState<ConnectMember>(initialMember);
  const [connectionStatus, setConnectionStatus] = useState<
    'NONE' | 'PENDING' | 'INCOMING_REQUEST' | 'ACCEPTED'
  >(initialMember.connectionStatus || 'NONE');
  const [connecting, setConnecting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load fresh dynamic details for this member
  const loadDynamicProfile = useCallback(async () => {
    if (!token || !tenantId || !member.userId) return;
    setRefreshing(true);
    try {
      const data = await fetchMemberProfileApi(token, tenantId, member.userId);
      setMember(data);
      if (data.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
      }
    } catch {
      // Fallback silently to initialMember props
    } finally {
      setRefreshing(false);
    }
  }, [token, tenantId, member.userId]);

  useEffect(() => {
    loadDynamicProfile();
  }, [loadDynamicProfile]);

  const handleSendConnect = async () => {
    if (connecting || connectionStatus !== 'NONE') return;
    setConnecting(true);
    try {
      await sendConnectionRequestApi(token, tenantId, member.userId);
      setConnectionStatus('PENDING');
    } catch (err) {
      console.error('Failed to send connection request:', err);
      setConnectionStatus('NONE');
    } finally {
      setConnecting(false);
    }
  };

  const handleRespondRequest = async (action: 'ACCEPT' | 'DECLINE') => {
    if (responding) return;
    setResponding(true);
    const targetConnId = member.connectionId;
    try {
      if (targetConnId) {
        await respondConnectionRequestApi(token, tenantId, targetConnId, action);
      }
      setConnectionStatus(action === 'ACCEPT' ? 'ACCEPTED' : 'NONE');
    } catch (err) {
      console.warn('Failed to respond to connection request:', err);
    } finally {
      setResponding(false);
    }
  };

  const handleOpenChat = async () => {
    if (messaging) return;
    setMessaging(true);
    try {
      if (token && tenantId) {
        await startDirectChatApi(token, tenantId, member.userId);
      }
      if (onStartChat) {
        onStartChat({
          userId: member.userId,
          fullName: member.fullName,
          initials: member.initials,
          department: member.department,
        });
      } else {
        router.push({
          pathname: '/inbox',
          params: {
            recipientId: member.userId,
            recipientName: member.fullName,
          },
        });
      }
    } catch {
      router.push('/inbox');
    } finally {
      setMessaging(false);
    }
  };

  const graduationYear = useMemo(() => {
    if (member.batch) {
      return member.batch.replace(/Batch\s*/i, '').trim();
    }
    return '2026';
  }, [member.batch]);

  const displayHandle = useMemo(() => {
    if (member.handle) return member.handle;
    if (member.email) return `@${member.email.split('@')[0]}`;
    if (member.usn) return `@${member.usn.toLowerCase()}`;
    return `@${member.fullName.toLowerCase().replace(/\s+/g, '_')}`;
  }, [member.handle, member.email, member.usn, member.fullName]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Member profile</Text>

        <Pressable
          onPress={loadDynamicProfile}
          hitSlop={12}
          disabled={refreshing}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityLabel="Refresh profile"
          accessibilityRole="button"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary.accent} />
          ) : (
            <Ionicons name="refresh-outline" size={23} color={Colors.text.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Profile Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{member.initials || 'TT'}</Text>
          </View>

          <Text style={styles.memberName}>{member.fullName}</Text>
          <Text style={styles.memberHandle}>{displayHandle}</Text>
        </View>

        {/* 2. Connection Section Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardSectionTitle}>Connection</Text>

          {connectionStatus === 'INCOMING_REQUEST' ? (
            <View style={styles.incomingRequestCard}>
              <View style={styles.incomingHeader}>
                <View style={styles.incomingIconBox}>
                  <Ionicons name="mail-unread" size={20} color="#38BDF8" />
                </View>
                <View style={styles.incomingTextCol}>
                  <Text style={styles.incomingTitle}>Connection request received</Text>
                  <Text style={styles.incomingSub}>
                    {member.fullName} wants to connect with you.
                  </Text>
                </View>
              </View>
              <View style={styles.actionButtonsRow}>
                <Pressable
                  onPress={() => handleRespondRequest('ACCEPT')}
                  disabled={responding}
                  style={({ pressed }) => [
                    styles.acceptBtn,
                    responding && { opacity: 0.8 },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Accept connection"
                >
                  {responding ? (
                    <ActivityIndicator size="small" color="#080B11" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="#080B11" />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleRespondRequest('DECLINE')}
                  disabled={responding}
                  style={({ pressed }) => [
                    styles.declineBtn,
                    responding && { opacity: 0.8 },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Decline connection"
                >
                  <Ionicons name="close" size={16} color={Colors.text.secondary} />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ) : connectionStatus === 'PENDING' ? (
            <View style={styles.requestSentCard}>
              <View style={styles.requestSentIconBox}>
                <Ionicons name="person-add" size={22} color="#38BDF8" />
              </View>
              <View style={styles.requestSentTextCol}>
                <Text style={styles.requestSentTitle}>Request sent</Text>
                <Text style={styles.requestSentSub}>We'll let you know when they respond.</Text>
              </View>
            </View>
          ) : connectionStatus === 'ACCEPTED' ? (
            <View style={styles.connectedCard}>
              <Ionicons name="checkmark-circle" size={22} color="#34D399" />
              <View style={styles.requestSentTextCol}>
                <Text style={styles.connectedTitle}>Connected</Text>
                <Text style={styles.connectedSub}>You are connected with this campus member.</Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handleSendConnect}
              disabled={connecting}
              style={({ pressed }) => [
                styles.connectBtn,
                connecting && { opacity: 0.8 },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Connect with member"
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#080B11" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#080B11" />
                  <Text style={styles.connectBtnText}>+ Connect</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* 3. Message Button */}
        <Pressable
          onPress={handleOpenChat}
          disabled={messaging}
          style={({ pressed }) => [
            styles.messageBtn,
            messaging && { opacity: 0.8 },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Message member"
        >
          {messaging ? (
            <ActivityIndicator size="small" color="#C4B5FD" />
          ) : (
            <Text style={styles.messageBtnText}>Message</Text>
          )}
        </Pressable>

        {/* 4. Academic Identity Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardSectionTitle}>Academic identity</Text>

          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Program</Text>
            <Text style={styles.identityValue}>{member.program || 'Bachelor of Technology'}</Text>
          </View>

          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Department</Text>
            <Text style={styles.identityValue}>{member.department || 'AI & Data Science'}</Text>
          </View>

          <View style={styles.identityRowNoBorder}>
            <Text style={styles.identityLabel}>Graduation year</Text>
            <Text style={styles.identityValue}>{graduationYear}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: isDark ? '#2D1F5B' : '#4338CA',
      borderRadius: 24,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(99, 102, 241, 0.3)',
      shadowColor: '#4338CA',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 14,
      elevation: 6,
    },
    avatarCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#134E5E',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      borderWidth: 1.5,
      borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    avatarText: {
      fontFamily: Typography.black,
      fontSize: 26,
      fontWeight: '900',
      color: '#38BDF8',
      letterSpacing: 1,
    },
    memberName: {
      fontFamily: Typography.black,
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    memberHandle: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: '#C4B5FD',
      fontWeight: '500',
    },
    cardContainer: {
      backgroundColor: isDark ? '#101626' : Colors.background.surface,
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#E0E7FF',
      padding: 18,
      marginBottom: 14,
      shadowColor: isDark ? '#000' : '#4338CA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    cardSectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 14,
    },
    connectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#A78BFA',
      borderRadius: 24,
      paddingVertical: 14,
      shadowColor: '#A78BFA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    connectBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '800',
      color: '#080B11',
    },
    incomingRequestCard: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#BAE6FD',
      gap: 14,
    },
    incomingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    incomingIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    incomingTextCol: {
      flex: 1,
    },
    incomingTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : '#0369A1',
      marginBottom: 2,
    },
    incomingSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#0284C7',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    acceptBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#38BDF8',
      borderRadius: 20,
      paddingVertical: 10,
      shadowColor: '#38BDF8',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    acceptBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: '#080B11',
    },
    declineBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
      borderRadius: 20,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
    },
    declineBtnText: {
      fontFamily: Typography.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    requestSentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0E3B46' : '#E0F2FE',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.4)',
      gap: 12,
    },
    requestSentIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestSentTextCol: {
      flex: 1,
    },
    requestSentTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : '#0369A1',
      marginBottom: 2,
    },
    requestSentSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#0284C7',
    },
    connectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#A7F3D0',
      gap: 12,
    },
    connectedTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#34D399' : '#047857',
      marginBottom: 2,
    },
    connectedSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#059669',
    },
    messageBtn: {
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(167, 139, 250, 0.45)' : '#818CF8',
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      backgroundColor: isDark ? 'rgba(167, 139, 250, 0.04)' : '#EEF2FF',
    },
    messageBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#4338CA',
    },
    identityRow: {
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    },
    identityRowNoBorder: {
      marginBottom: 0,
    },
    identityLabel: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 3,
    },
    identityValue: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
}
