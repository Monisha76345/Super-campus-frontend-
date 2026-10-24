import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

import { SportsBooking } from '../../sports-types';

interface CourtPassModalProps {
  visible: boolean;
  booking: SportsBooking | null;
  onClose: () => void;
  onCancelBooking?: (bookingId: string) => Promise<void>;
}

export function CourtPassModal({
  visible,
  booking,
  onClose,
  onCancelBooking,
}: CourtPassModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const qrData = JSON.stringify({
    type: 'SPORTS_COURT_ENTRY',
    bookingId: booking.id,
    courtName: booking.facilityName || 'Campus Court',
    sport: booking.sportType,
    date: booking.bookingDate,
    slot: `${booking.startTime?.slice(0, 5)} - ${booking.endTime?.slice(0, 5)}`,
    studentName: booking.userName,
    role: booking.myRole || 'PLAYER',
    token: booking.myQrToken || booking.qrToken,
  });

  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrData,
  )}`;

  const isHost = (booking.myRole || 'HOST') === 'HOST';
  const isConfirmed = booking.status === 'CONFIRMED';

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation?',
      'Are you sure you want to cancel this court reservation? This will free the slot for other students.',
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!onCancelBooking) return;
            try {
              setCancelling(true);
              await onCancelBooking(booking.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Cancellation Failed', err?.message || 'Could not cancel booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.cardContainer} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  isConfirmed ? styles.badgeConfirmed : styles.badgeCancelled,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {isConfirmed ? 'CONFIRMED PASS' : 'CANCELLED'}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {booking.myRole === 'HOST' ? 'HOST PASS' : 'TEAM PASS'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Facility Details */}
            <Text style={styles.courtTitle}>{booking.facilityName || 'Campus Court'}</Text>
            <Text style={styles.locationSubtitle}>
              <Ionicons name="location-outline" size={13} color={Colors.text.secondary} />{' '}
              {booking.location || 'Campus Sports Arena'}
            </Text>

            {/* High-Contrast Digital QR Code */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrWhiteBox}>
                <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
              </View>
              <Text style={styles.qrInstruction}>
                Scan at the Sports Complex entrance to verify your reservation
              </Text>
            </View>

            {/* Time & Date Meta Grid */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>DATE</Text>
                <Text style={styles.metaValue}>{booking.bookingDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>TIME SLOT</Text>
                <Text style={styles.metaValue}>
                  {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                </Text>
              </View>
            </View>

            {/* Invitation Code Banner */}
            <View style={styles.inviteBox}>
              <View style={styles.inviteLeft}>
                <Text style={styles.inviteLabel}>INVITE TEAMMATES</Text>
                <Text style={styles.inviteCodeText}>{booking.inviteCode}</Text>
              </View>
              <Pressable
                onPress={handleCopyCode}
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Share'}</Text>
              </Pressable>
            </View>

            {/* Teammates Roster */}
            <View style={styles.rosterSection}>
              <View style={styles.rosterHeader}>
                <Text style={styles.rosterTitle}>
                  Players ({booking.currentPlayersCount} / {booking.maxPlayers})
                </Text>
                {booking.isOpenGame ? (
                  <View style={styles.openGamePill}>
                    <Text style={styles.openGamePillText}>Open Game</Text>
                  </View>
                ) : null}
              </View>

              {booking.players && booking.players.length > 0 ? (
                booking.players.map((p, idx) => (
                  <View key={p.id || idx} style={styles.playerRow}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {p.userName?.slice(0, 2).toUpperCase() || 'PL'}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{p.userName}</Text>
                      <Text style={styles.playerRoleText}>
                        {p.role === 'HOST' ? 'Host · Organizer' : 'Teammate · Pass Verified'}
                      </Text>
                    </View>
                    <Ionicons
                      name="qr-code-outline"
                      size={16}
                      color={p.role === 'HOST' ? '#A78BFA' : isDark ? '#38BDF8' : Colors.primary.main}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {booking.userName?.slice(0, 2).toUpperCase() || 'ME'}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{booking.userName}</Text>
                    <Text style={styles.playerRoleText}>Host · Pass Verified</Text>
                  </View>
                  <Ionicons name="qr-code-outline" size={16} color="#A78BFA" />
                </View>
              )}
            </View>

            {/* Cancellation button for host */}
            {isHost && isConfirmed && onCancelBooking ? (
              <Pressable
                onPress={handleCancel}
                disabled={cancelling}
                style={styles.cancelBookingBtn}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.cancelBookingBtnText}>Cancel Reservation</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      padding: 16,
    },
    cardContainer: {
      backgroundColor: Colors.background.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      maxHeight: '90%',
      overflow: 'hidden',
      paddingTop: 16,
      paddingBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeConfirmed: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    badgeCancelled: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusBadgeText: {
      color: '#10B981',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    roleBadge: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleBadgeText: {
      color: isDark ? '#A78BFA' : Colors.primary.main,
      fontSize: 11,
      fontWeight: '700',
    },
    closeBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
    },
    scrollBody: {
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    courtTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
      marginTop: 4,
    },
    locationSubtitle: {
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 4,
      marginBottom: 16,
    },
    qrWrapper: {
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 16,
    },
    qrWhiteBox: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    qrImage: {
      width: 170,
      height: 170,
    },
    qrInstruction: {
      fontSize: 12,
      color: Colors.text.secondary,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 16,
    },
    metaGrid: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 16,
      justifyContent: 'space-around',
    },
    metaItem: {
      alignItems: 'center',
    },
    metaLabel: {
      fontSize: 10,
      color: Colors.text.tertiary,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    metaValue: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    inviteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4338CA' : '#C7D2FE',
      marginBottom: 18,
    },
    inviteLeft: {
      flex: 1,
    },
    inviteLabel: {
      fontSize: 10,
      color: isDark ? '#A5B4FC' : Colors.primary.main,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    inviteCodeText: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1E1B4B',
      letterSpacing: 1.5,
      marginTop: 2,
    },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary.main,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    copyBtnSuccess: {
      backgroundColor: '#10B981',
    },
    copyBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    rosterSection: {
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 16,
    },
    rosterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    rosterTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    openGamePill: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    openGamePillText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 11,
      fontWeight: '600',
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
    },
    playerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#312E81' : 'rgba(79, 70, 229, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    playerAvatarText: {
      color: isDark ? '#C7D2FE' : Colors.primary.main,
      fontSize: 12,
      fontWeight: '700',
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
    },
    playerRoleText: {
      fontSize: 11,
      color: Colors.text.tertiary,
    },
    cancelBookingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
      backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
      marginTop: 4,
    },
    cancelBookingBtnText: {
      color: '#EF4444',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
