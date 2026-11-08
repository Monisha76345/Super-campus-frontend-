import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { CampusEvent } from '../types/connect-types';

interface EventDetailModalProps {
  visible: boolean;
  event: CampusEvent | null;
  onClose: () => void;
  onRegister?: (event: CampusEvent) => void;
}

export function EventDetailModal({
  visible,
  event,
  onClose,
  onRegister,
}: EventDetailModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = createStyles(Colors, isDark);
  const insets = useSafeAreaInsets();

  const [isRegistered, setIsRegistered] = useState(false);

  if (!event) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Join me at ${event.title} happening on ${event.formattedDate} at ${event.venue}!\n\n${event.description}\n\nRSVP on Supercampus!`,
      });
    } catch {
      // dismissed
    }
  };

  const handleToggleRegister = () => {
    setIsRegistered((prev) => !prev);
    if (!isRegistered) {
      Alert.alert(
        'RSVP Confirmed! 🎉',
        `You have successfully registered for "${event.title}". A pass has been added to your campus calendar.`,
      );
      onRegister?.(event);
    } else {
      Alert.alert('RSVP Cancelled', `You have unregistered from "${event.title}".`);
    }
  };

  const bannerSource = event.bannerUrl || (event.bannerKey ? { uri: event.bannerKey } : null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Event Details
          </Text>
          <Pressable onPress={handleShare} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="share-social-outline" size={22} color={isDark ? '#38BDF8' : Colors.primary.main} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}>
          {/* Hero Banner / Poster */}
          {bannerSource ? (
            <Image
              source={typeof bannerSource === 'string' ? { uri: bannerSource } : bannerSource}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBanner}>
              <Ionicons name="calendar" size={54} color="#38BDF8" />
              <Text style={styles.placeholderBannerText}>{event.formattedDate}</Text>
            </View>
          )}

          <View style={styles.contentPadding}>
            {/* Status & Category Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{event.status || 'UPCOMING EVENT'}</Text>
              </View>
              {event.capacity ? (
                <View style={styles.capacityBadge}>
                  <Ionicons name="people-outline" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
                  <Text style={styles.capacityBadgeText}>
                    {event.registeredCount}/{event.capacity} spots filled
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Event Title */}
            <Text style={styles.eventTitle}>{event.title}</Text>

            {/* Event Info Highlights */}
            <View style={styles.infoCard}>
              {/* Date */}
              <View style={styles.infoRow}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {event.formattedDate} · {event.formattedTime || 'Full Day'}
                  </Text>
                </View>
              </View>

              {/* Venue */}
              <View style={styles.infoRow}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Ionicons name="location-outline" size={18} color="#EC4899" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Location / Venue</Text>
                  <Text style={styles.infoValue}>{event.venue}</Text>
                </View>
              </View>

              {/* Host/College */}
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="school-outline" size={18} color="#10B981" />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Host</Text>
                  <Text style={styles.infoValue}>Nitte Meenakshi Institute of Technology (NMIT)</Text>
                </View>
              </View>
            </View>

            {/* Full Event Description Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>About this Event</Text>
              <Text style={styles.descriptionBody}>{event.description}</Text>
            </View>

            {/* Participation Guidelines */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Participation & Entry</Text>
              <View style={styles.guidelineRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.guidelineText}>Open to all registered NMIT students, faculty, and alumni.</Text>
              </View>
              <View style={styles.guidelineRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.guidelineText}>Carry college ID card for physical gate verification.</Text>
              </View>
              <View style={styles.guidelineRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.guidelineText}>Certificate of participation awarded upon attendance sign-in.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating RSVP Button Footer */}
        <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleToggleRegister}
            style={[
              styles.rsvpBtn,
              isRegistered ? styles.rsvpBtnRegistered : styles.rsvpBtnPrimary,
            ]}>
            <Ionicons
              name={isRegistered ? 'checkmark-circle' : 'ticket-outline'}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.rsvpBtnText}>
              {isRegistered ? 'Registered (Tap to Cancel)' : 'RSVP & Register Now'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    headerBar: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
    },
    headerBtn: {
      padding: 6,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    bannerImage: {
      width: '100%',
      height: 230,
    },
    placeholderBanner: {
      width: '100%',
      height: 180,
      backgroundColor: isDark ? '#082F49' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    placeholderBannerText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#38BDF8',
      fontWeight: '700',
    },
    contentPadding: {
      padding: 18,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.2)',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    statusText: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#38BDF8',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    capacityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    capacityBadgeText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    eventTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
      lineHeight: 28,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 14,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.05)',
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoCol: {
      flex: 1,
    },
    infoLabel: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    infoValue: {
      fontFamily: Typography.semiBold,
      fontSize: 13.5,
      fontWeight: '600',
      color: Colors.text.primary,
      marginTop: 1,
    },
    sectionCard: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      marginBottom: 16,
    },
    sectionHeading: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 10,
    },
    descriptionBody: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 22,
      color: isDark ? '#CBD5E1' : '#334155',
    },
    guidelineRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    guidelineText: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 12.5,
      lineHeight: 18,
      color: isDark ? '#94A3B8' : '#475569',
    },
    footerBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    rsvpBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: 24,
    },
    rsvpBtnPrimary: {
      backgroundColor: '#2563EB',
    },
    rsvpBtnRegistered: {
      backgroundColor: '#10B981',
    },
    rsvpBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}

