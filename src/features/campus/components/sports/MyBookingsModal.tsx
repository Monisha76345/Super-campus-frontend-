import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
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

interface MyBookingsModalProps {
  visible: boolean;
  onClose: () => void;
  bookings: SportsBooking[];
  onSelectBooking: (booking: SportsBooking) => void;
}

export function MyBookingsModal({
  visible,
  onClose,
  bookings,
  onSelectBooking,
}: MyBookingsModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.topBarTitle}>My Court Bookings</Text>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyBody}>
              Book a badminton or pickleball court to get your digital gate pass.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {bookings.map((item) => {
              const isConfirmed = item.status === 'CONFIRMED';
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectBooking(item)}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.courtNameRow}>
                      <Text style={styles.courtName}>{item.facilityName || 'Campus Court'}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isConfirmed ? styles.badgeConfirmed : styles.badgeCancelled,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.courtLocation}>{item.location}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaBox}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={isDark ? '#38BDF8' : Colors.primary.main}
                      />
                      <Text style={styles.metaText}>{item.bookingDate}</Text>
                    </View>
                    <View style={styles.metaBox}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isDark ? '#A78BFA' : Colors.primary.main}
                      />
                      <Text style={styles.metaText}>
                        {item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}
                      </Text>
                    </View>
                    <View style={styles.metaBox}>
                      <Ionicons
                        name="people-outline"
                        size={14}
                        color={isDark ? '#34D399' : '#059669'}
                      />
                      <Text style={styles.metaText}>
                        {item.currentPlayersCount} / {item.maxPlayers}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>
                        {item.myRole === 'HOST' ? 'HOST' : 'TEAMMATE'}
                      </Text>
                    </View>
                    <View style={styles.viewPassBtn}>
                      <Ionicons
                        name="qr-code-outline"
                        size={14}
                        color={isDark ? '#38BDF8' : Colors.primary.main}
                      />
                      <Text style={styles.viewPassBtnText}>View QR Pass</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
      paddingTop: 54,
      paddingHorizontal: 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backBtn: {
      padding: 6,
      marginRight: 10,
    },
    topBarTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 14,
      marginBottom: 6,
    },
    emptyBody: {
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    listContent: {
      paddingBottom: 40,
      gap: 12,
    },
    card: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    cardHeader: {
      marginBottom: 12,
    },
    courtNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    courtName: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeConfirmed: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    badgeCancelled: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#10B981',
    },
    courtLocation: {
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 3,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      padding: 10,
      borderRadius: 12,
      marginBottom: 12,
    },
    metaBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 11,
      color: Colors.text.primary,
      fontWeight: '600',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
    },
    roleTag: {
      backgroundColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    roleTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: Colors.text.secondary,
    },
    viewPassBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewPassBtnText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
