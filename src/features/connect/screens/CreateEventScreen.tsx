import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { CreateEventPayload } from '../types/connect-types';
import { createEventApi } from '../api/connect-api';

interface CreateEventScreenProps {
  campusName: string;
  token: string;
  tenantId: string;
  onBack: () => void;
  onEventCreated: () => void;
}

export function CreateEventScreen({
  campusName,
  token,
  tenantId,
  onBack,
  onEventCreated,
}: CreateEventScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = createStyles(Colors, isDark);
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calendar / Date-Time Picker Modal State
  const [activeDatePicker, setActiveDatePicker] = useState<'starts' | 'ends' | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const handleOpenDatePicker = (field: 'starts' | 'ends') => {
    setActiveDatePicker(field);
    const now = new Date();
    setSelectedYear(2026);
    setSelectedMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
    setSelectedHour(field === 'starts' ? '10' : '17');
    setSelectedMinute('00');
    setSelectedAmPm(field === 'starts' ? 'AM' : 'PM');
  };

  const handleConfirmDate = () => {
    let hour24 = parseInt(selectedHour, 10);
    if (selectedAmPm === 'PM' && hour24 < 12) hour24 += 12;
    if (selectedAmPm === 'AM' && hour24 === 12) hour24 = 0;

    const formattedMonth = String(selectedMonth).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    const formattedHour = String(hour24).padStart(2, '0');
    const formattedMinute = String(selectedMinute).padStart(2, '0');

    const formatted = `${selectedYear}-${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMinute}`;
    if (activeDatePicker === 'starts') {
      setStartsAt(formatted);
    } else if (activeDatePicker === 'ends') {
      setEndsAt(formatted);
    }
    setActiveDatePicker(null);
  };

  const handlePickBanner = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Allow gallery access to choose an event poster.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setBannerUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an event title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter event description and participation details.');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Required Field', 'Please enter the venue.');
      return;
    }
    if (!startsAt.trim()) {
      Alert.alert('Required Field', 'Please select event start date & time.');
      return;
    }
    if (!endsAt.trim()) {
      Alert.alert('Required Field', 'Please select event end date & time.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        startsAt: startsAt.trim(),
        endsAt: endsAt.trim(),
        capacity: capacity.trim() ? parseInt(capacity.trim(), 10) : undefined,
        bannerUrl: bannerUri || undefined,
      };

      await createEventApi(token, tenantId, payload);
      Alert.alert('Success', 'Campus event published successfully!', [
        {
          text: 'OK',
          onPress: onEventCreated,
        },
      ]);
    } catch (err: any) {
      Alert.alert('Publish Error', err?.message || 'Could not publish event. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={12}
          style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create event</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Context Hint */}
        <Text style={styles.contextHint}>
          Visible to {campusName} campus members. Times use Asia/Kolkata.
        </Text>

        {/* Photo Upload Column / Event Poster Banner */}
        <View style={styles.photoUploadSection}>
          <Text style={styles.fieldLabel}>Event Poster / Banner (Photo)</Text>
          {bannerUri ? (
            <View style={styles.bannerPreviewContainer}>
              <Image source={{ uri: bannerUri }} style={styles.bannerPreviewImage} />
              <Pressable
                onPress={() => setBannerUri(null)}
                style={styles.removeBannerBtn}
                hitSlop={6}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickBanner}
              style={({ pressed }) => [styles.bannerPlaceholder, pressed && { opacity: 0.8 }]}>
              <Ionicons name="image-outline" size={32} color="#38BDF8" />
              <Text style={styles.bannerPlaceholderText}>Tap to upload event poster / photo</Text>
              <Text style={styles.bannerPlaceholderSub}>Supports PNG, JPG (16:9 recommended)</Text>
            </Pressable>
          )}
        </View>

        {/* Event Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Event Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Annual Tech Symposium 2026"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description & Guidelines</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the event, agenda, eligibility, prizes, and instructions..."
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.inputField, styles.multilineInput]}
          />
        </View>

        {/* Venue */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Venue / Room</Text>
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g. NMIT Main Auditorium, North Campus"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            autoCorrect={false}
            style={styles.inputField}
          />
        </View>

        {/* Calendar Date Picker: Starts At */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Starts At (Tap Calendar to Select)</Text>
          <Pressable
            onPress={() => handleOpenDatePicker('starts')}
            style={styles.datePickerTrigger}>
            <Ionicons name="calendar" size={18} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={startsAt ? styles.datePickerValueText : styles.datePickerPlaceholderText}>
              {startsAt || 'Select start date & time from calendar'}
            </Text>
          </Pressable>
        </View>

        {/* Calendar Date Picker: Ends At */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Ends At (Tap Calendar to Select)</Text>
          <Pressable
            onPress={() => handleOpenDatePicker('ends')}
            style={styles.datePickerTrigger}>
            <Ionicons name="calendar-outline" size={18} color="#A78BFA" style={{ marginRight: 8 }} />
            <Text style={endsAt ? styles.datePickerValueText : styles.datePickerPlaceholderText}>
              {endsAt || 'Select end date & time from calendar'}
            </Text>
          </Pressable>
        </View>

        {/* Capacity */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Capacity / Total Seats (optional)</Text>
          <TextInput
            value={capacity}
            onChangeText={setCapacity}
            placeholder="e.g. 250"
            placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
            keyboardType="numeric"
            style={styles.inputField}
          />
        </View>

        {/* Publish Button */}
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handlePublish}
          style={({ pressed }) => [styles.publishBtn, pressed && styles.btnPressed]}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishText}>Publish Campus Event</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Interactive Calendar Date Picker Modal */}
      <Modal
        visible={activeDatePicker !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveDatePicker(null)}>
        <Pressable
          style={styles.calendarModalBackdrop}
          onPress={() => setActiveDatePicker(null)}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeaderRow}>
              <Ionicons name="calendar" size={20} color="#38BDF8" />
              <Text style={styles.calendarModalTitle}>
                {activeDatePicker === 'starts' ? 'Select Start Date & Time' : 'Select End Date & Time'}
              </Text>
            </View>

            {/* Month & Year Selectors */}
            <View style={styles.monthHeaderRow}>
              <Pressable
                onPress={() => setSelectedMonth((m) => (m === 1 ? 12 : m - 1))}
                hitSlop={8}
                style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })}{' '}
                {selectedYear}
              </Text>
              <Pressable
                onPress={() => setSelectedMonth((m) => (m === 12 ? 1 : m + 1))}
                hitSlop={8}
                style={styles.monthNavBtn}>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.primary} />
              </Pressable>
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isSelected = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}>
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Time Picker Row */}
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Select Time:</Text>
              <View style={styles.timeRow}>
                {/* Hour */}
                <TextInput
                  value={selectedHour}
                  onChangeText={(val) => setSelectedHour(val.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  style={styles.timeInput}
                  maxLength={2}
                />
                <Text style={styles.timeColon}>:</Text>
                {/* Minute */}
                <TextInput
                  value={selectedMinute}
                  onChangeText={(val) => setSelectedMinute(val.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  style={styles.timeInput}
                  maxLength={2}
                />
                {/* AM / PM Toggle */}
                <Pressable
                  onPress={() => setSelectedAmPm((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
                  style={styles.amPmBtn}>
                  <Text style={styles.amPmText}>{selectedAmPm}</Text>
                </Pressable>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setActiveDatePicker(null)}
                style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDate}
                style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Set Date & Time</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    backBtn: {
      padding: 6,
    },
    backBtnText: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 48,
    },
    contextHint: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: isDark ? '#94A3B8' : Colors.text.secondary,
      marginTop: 4,
      marginBottom: 16,
    },
    photoUploadSection: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: Colors.text.primary,
      fontWeight: '600',
      marginBottom: 6,
    },
    bannerPlaceholder: {
      height: 140,
      borderRadius: 14,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    bannerPlaceholderText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#38BDF8',
      fontWeight: '700',
    },
    bannerPlaceholderSub: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: isDark ? '#64748B' : Colors.text.secondary,
    },
    bannerPreviewContainer: {
      position: 'relative',
      height: 160,
      borderRadius: 14,
      overflow: 'hidden',
    },
    bannerPreviewImage: {
      width: '100%',
      height: '100%',
    },
    removeBannerBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
    },
    fieldContainer: {
      marginBottom: 14,
    },
    inputField: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.primary,
    },
    multilineInput: {
      height: 100,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    datePickerTrigger: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      flexDirection: 'row',
      alignItems: 'center',
    },
    datePickerPlaceholderText: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: isDark ? '#64748B' : Colors.text.secondary,
    },
    datePickerValueText: {
      fontFamily: Typography.semiBold,
      fontSize: 13.5,
      color: isDark ? '#F8FAFC' : Colors.text.primary,
      fontWeight: '600',
    },
    publishBtn: {
      marginTop: 10,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDark ? Colors.primary.cyan : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    publishText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    btnPressed: {
      opacity: 0.8,
    },
    calendarModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    calendarCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1.2,
      borderColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.1)',
    },
    calendarHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    calendarModalTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    monthHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 6,
    },
    monthTitle: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.primary,
    },
    monthNavBtn: {
      padding: 6,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
    },
    dayCell: {
      width: 40,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    dayCellSelected: {
      backgroundColor: '#2563EB',
    },
    dayCellText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.primary,
    },
    dayCellTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    timeSection: {
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.08)',
      marginBottom: 16,
    },
    timeLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
      marginBottom: 8,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeInput: {
      width: 50,
      height: 38,
      borderRadius: 8,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      textAlign: 'center',
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
    },
    timeColon: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    amPmBtn: {
      paddingHorizontal: 14,
      height: 38,
      borderRadius: 8,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    amPmText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modalActionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    modalCancelText: {
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.secondary,
    },
    modalConfirmBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#2563EB',
    },
    modalConfirmText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
