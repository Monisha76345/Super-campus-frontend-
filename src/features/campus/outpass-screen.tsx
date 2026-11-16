import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { Typography } from '@/constants/fonts';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { useAuthSession } from '@/features/auth';
import { outpassApi } from './api/outpass-api';
import { OutpassItem, OutpassStatus, PassType } from './types/outpass.types';

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export function OutpassScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const isAdmin = user?.role === 'warden' || user?.role === 'superadmin' || user?.role === 'admin';
  const isHostelite = !!user?.hostelite;
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  // Form states
  const [passType, setPassType] = useState<PassType>('OUTPASS');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [parentPhone, setParentPhone] = useState('+91 98765 43210');
  const [departureTime, setDepartureTime] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState<Date | null>(null);

  // Screen states: strictly loaded from DB via API
  const [requests, setRequests] = useState<OutpassItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeQrPass, setActiveQrPass] = useState<OutpassItem | null>(null);
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [rejectionModalItem, setRejectionModalItem] = useState<OutpassItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Date picker modal state
  const [pickerTarget, setPickerTarget] = useState<'departure' | 'return' | null>(null);
  const [pickerMode, setPickerMode] = useState<'calendar' | 'quick'>('calendar');
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calDay, setCalDay] = useState<number>(new Date().getDate());
  const [calHour, setCalHour] = useState<number>(9);
  const [calMinute, setCalMinute] = useState<number>(0);

  const fetchRequests = useCallback(async () => {
    if (!user?.token || !user?.tenantId) {
      return;
    }
    try {
      setRefreshing(true);
      const data = isAdmin
        ? await outpassApi.getAdminRequests({ token: user.token, tenantId: user.tenantId })
        : await outpassApi.getMyRequests({ token: user.token, tenantId: user.tenantId });
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch {
      // Keep existing list on network issue
    } finally {
      setRefreshing(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    if (!user?.token || !user?.tenantId) return;
    try {
      setActionBusyId(id);
      const updated = await outpassApi.reviewRequest(
        { token: user.token, tenantId: user.tenantId },
        id,
        { status, rejectionReason: note }
      );
      setRequests((prev) => prev.map((item) => (item.id === id ? updated : item)));
      Alert.alert('Outpass Updated', `Outpass marked as ${status.toLowerCase()} successfully.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not review outpass';
      Alert.alert('Review Failed', message);
    } finally {
      setActionBusyId(null);
      setRejectionModalItem(null);
      setRejectionReasonInput('');
    }
  };

  const handleCancel = async (id: string) => {
    if (!user?.token || !user?.tenantId) return;
    Alert.alert(
      'Cancel Outpass',
      'Are you sure you want to cancel this pending outpass request?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Outpass',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionBusyId(id);
              const cancelled = await outpassApi.cancelRequest(
                { token: user.token, tenantId: user.tenantId },
                id
              );
              setRequests((prev) => prev.map((item) => (item.id === id ? cancelled : item)));
              Alert.alert('Cancelled', 'Your outpass request has been cancelled.');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Could not cancel request';
              Alert.alert('Failed', msg);
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleGateScan = async (item: OutpassItem, explicitAction?: 'EXIT' | 'ENTRY') => {
    if (!user?.token || !user?.tenantId) return;
    try {
      setActionBusyId(item.id);
      const res = await outpassApi.gateScan(
        { token: user.token, tenantId: user.tenantId },
        { qrToken: item.qrToken || item.id, scanType: explicitAction }
      );
      setRequests((prev) => prev.map((r) => (r.id === item.id ? res.outpass : r)));
      if (activeQrPass?.id === item.id) {
        setActiveQrPass(res.outpass);
      }
      const title = res.actionTaken === 'EXIT' ? 'Gate Exit Verified!' : 'Gate Entry Verified!';
      const parentAlert = res.parentPhone
        ? `\n\nAutomated SMS Sent to Parent (${res.parentPhone}):\n"${res.messageText}"`
        : '\n\n(No parent phone registered for SMS)';
      Alert.alert(title, `Pass status is now '${res.outpass.status}'.${parentAlert}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gate scan failed';
      Alert.alert('Scan Failed', msg);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSetPassType = (type: PassType) => {
    if (type === 'OUTPASS') {
      if (departureTime && returnTime) {
        const isSameDay =
          departureTime.getFullYear() === returnTime.getFullYear() &&
          departureTime.getMonth() === returnTime.getMonth() &&
          departureTime.getDate() === returnTime.getDate();
        const isPast10Pm =
          returnTime.getHours() > 22 ||
          (returnTime.getHours() === 22 && returnTime.getMinutes() > 0);

        if (!isSameDay || isPast10Pm) {
          const adjusted = new Date(departureTime);
          adjusted.setHours(21, 30, 0, 0);
          setReturnTime(adjusted);
          Alert.alert(
            'Outpass Schedule Adjusted',
            'Outpasses require returning on the same day before 10:00 PM. Return time adjusted to 09:30 PM.'
          );
        }
      }
    }
    setPassType(type);
  };

  const handleSubmit = async () => {
    if (!isHostelite) {
      Alert.alert('Hostel Resident Only', 'Only registered hostel residents can submit an outpass.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Required Field', 'Please enter a destination.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required Field', 'Please enter a reason.');
      return;
    }
    if (!departureTime) {
      Alert.alert('Required Field', 'Please select a departure time.');
      return;
    }
    if (!returnTime) {
      Alert.alert('Required Field', 'Please select a return time.');
      return;
    }
    if (returnTime <= departureTime) {
      Alert.alert('Invalid Date Range', 'Return time must be after departure time.');
      return;
    }

    // Enforce 10:00 PM and same day rule:
    // If return time is past 10:00 PM or on another day, it is automatically classified as LEAVE
    const isSameDay =
      departureTime.getFullYear() === returnTime.getFullYear() &&
      departureTime.getMonth() === returnTime.getMonth() &&
      departureTime.getDate() === returnTime.getDate();
    const isPast10Pm =
      returnTime.getHours() > 22 ||
      (returnTime.getHours() === 22 && returnTime.getMinutes() > 0);

    let effectivePassType = passType;
    if (!isSameDay || isPast10Pm) {
      effectivePassType = 'LEAVE';
    }

    try {
      setSubmitting(true);
      const payload = {
        passType: effectivePassType,
        destination: destination.trim(),
        reason: reason.trim(),
        departureTime: departureTime.toISOString(),
        returnTime: returnTime.toISOString(),
        parentPhone: parentPhone.trim() || undefined,
      };

      if (!user?.token || !user?.tenantId) {
        Alert.alert('Authentication Required', 'Please sign in to submit an outpass request.');
        return;
      }

      const created = await outpassApi.createRequest(
        { token: user.token, tenantId: user.tenantId },
        payload
      );
      setRequests((prev) => [created, ...prev]);

      setDestination('');
      setReason('');
      setDepartureTime(null);
      setReturnTime(null);
      setPassType('OUTPASS');
      Alert.alert(
        'Success',
        effectivePassType === 'LEAVE'
          ? 'Leave application submitted successfully for hostel review.'
          : 'Outpass request submitted successfully.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not submit request';
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const openPicker = (target: 'departure' | 'return') => {
    const current = target === 'departure' ? departureTime : returnTime;
    let initial = current || (target === 'return' && departureTime ? new Date(departureTime) : new Date());
    if (target === 'return' && !current && departureTime && passType === 'OUTPASS') {
      initial = new Date(departureTime);
      initial.setHours(21, 0, 0, 0);
    }
    setCalYear(initial.getFullYear());
    setCalMonth(initial.getMonth());
    setCalDay(initial.getDate());
    setCalHour(initial.getHours());
    setCalMinute(initial.getMinutes());
    setPickerMode('calendar');
    setPickerTarget(target);
  };

  const confirmCalendarSelection = () => {
    const chosen = new Date(calYear, calMonth, calDay, calHour, calMinute, 0);
    if (pickerTarget === 'departure') {
      setDepartureTime(chosen);
      if (passType === 'OUTPASS') {
        if (!returnTime || returnTime <= chosen) {
          const defReturn = new Date(chosen);
          defReturn.setHours(21, 30, 0, 0);
          if (defReturn <= chosen) {
            defReturn.setHours(21, 59, 0, 0);
          }
          setReturnTime(defReturn);
        }
      }
    } else if (pickerTarget === 'return') {
      const isSameDay = departureTime
        ? departureTime.getFullYear() === chosen.getFullYear() &&
          departureTime.getMonth() === chosen.getMonth() &&
          departureTime.getDate() === chosen.getDate()
        : true;
      const isPast10Pm =
        chosen.getHours() > 22 ||
        (chosen.getHours() === 22 && chosen.getMinutes() > 0);

      if (!isSameDay || isPast10Pm) {
        if (passType === 'OUTPASS') {
          setPassType('LEAVE');
          Alert.alert(
            'Converted to Leave',
            'Return time is after 10:00 PM (or overnight). Outpasses must return before 10:00 PM on the same day, so this request is now classified as a Leave application.'
          );
        }
      }
      setReturnTime(chosen);
    }
    setPickerTarget(null);
  };

  const applyPickerSelection = (offsetHours: number) => {
    const base = pickerTarget === 'return' && departureTime ? new Date(departureTime) : new Date();
    const selected = new Date(base.getTime() + offsetHours * 3600 * 1000);
    if (pickerTarget === 'departure') {
      setDepartureTime(selected);
    } else if (pickerTarget === 'return') {
      const isSameDay = departureTime
        ? departureTime.getFullYear() === selected.getFullYear() &&
          departureTime.getMonth() === selected.getMonth() &&
          departureTime.getDate() === selected.getDate()
        : true;
      const isPast10Pm =
        selected.getHours() > 22 ||
        (selected.getHours() === 22 && selected.getMinutes() > 0);

      if (!isSameDay || isPast10Pm) {
        if (passType === 'OUTPASS') {
          setPassType('LEAVE');
          Alert.alert(
            'Converted to Leave',
            'Return time is after 10:00 PM (or overnight). This request is automatically classified as a Leave application.'
          );
        }
      }
      setReturnTime(selected);
    }
    setPickerTarget(null);
  };

  const getStatusBadgeStyle = (status: OutpassStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          container: styles.badgeApproved,
          text: styles.badgeApprovedText,
          label: 'Approved',
        };
      case 'REJECTED':
        return {
          container: styles.badgeRejected,
          text: styles.badgeRejectedText,
          label: 'Rejected',
        };
      case 'ACTIVE':
        return {
          container: styles.badgeActive,
          text: styles.badgeActiveText,
          label: 'Active',
        };
      case 'PENDING':
      default:
        return {
          container: styles.badgePending,
          text: styles.badgePendingText,
          label: 'Pending',
        };
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Hostel outpass</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh"
            onPress={fetchRequests}
            hitSlop={12}
            style={styles.headerRefreshBtn}>
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.text.secondary} />
            ) : (
              <Ionicons name="refresh" size={22} color={Colors.text.primary} />
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled">
          {/* If Warden (Admin): Show Approval Dashboard Banner */}
          {isAdmin ? (
            <View style={styles.adminBannerCard}>
              <View style={styles.adminBadgeRow}>
                <View style={styles.adminModePill}>
                  <Ionicons name="shield-checkmark" size={14} color="#818CF8" />
                  <Text style={styles.adminModePillText}>Warden Review Console</Text>
                </View>
                <Text style={styles.adminStatsText}>
                  {requests.filter((r) => r.status === 'PENDING').length} Pending
                </Text>
              </View>

              <Text style={styles.adminBannerTitle}>Hostel Resident Outpasses</Text>
              <Text style={styles.adminBannerSubtitle}>
                Review student leave applications and issue verified gate passes.
              </Text>

              {/* Filter Tabs */}
              <View style={styles.filterTabsRow}>
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => {
                  const active = adminFilter === tab;
                  const count =
                    tab === 'ALL'
                      ? requests.length
                      : requests.filter((r) => r.status === tab).length;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setAdminFilter(tab)}
                      style={[styles.filterTab, active && styles.filterTabActive]}>
                      <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                        {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : !isHostelite ? (
            /* Day Scholar Notice */
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Ionicons name="home-outline" size={22} color="#60A5FA" />
                <Text style={styles.formTitle}>Hostel Residents Only</Text>
              </View>
              <Text style={[styles.formSubtitle, { marginBottom: 6 }]}>
                Outpass applications and digital gate passes are only available for registered hostel residents.
              </Text>
              <Text style={[styles.formSubtitle, { color: Colors.text.tertiary, fontSize: 13 }]}>
                If you reside in the hostel, please contact your Warden or Super Admin to update your hostelite profile status.
              </Text>
            </View>
          ) : (
            /* Student View: Request an Outpass Form */
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Request Outpass or Leave</Text>
              <Text style={styles.formSubtitle}>Hostel administration will review your request.</Text>

              {/* Pass Type Selector: Outpass vs Leave */}
              <View style={styles.passTypeContainer}>
                <Text style={styles.passTypeSectionLabel}>SELECT PASS TYPE</Text>
                <View style={styles.passTypeSegmentRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select Outpass"
                    onPress={() => handleSetPassType('OUTPASS')}
                    style={[
                      styles.passTypeSegmentBtn,
                      passType === 'OUTPASS' && styles.passTypeSegmentBtnActive,
                    ]}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={passType === 'OUTPASS' ? '#38BDF8' : Colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.passTypeSegmentText,
                        passType === 'OUTPASS' && styles.passTypeSegmentTextActive,
                      ]}>
                      Outpass (Day Pass)
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select Leave"
                    onPress={() => handleSetPassType('LEAVE')}
                    style={[
                      styles.passTypeSegmentBtn,
                      passType === 'LEAVE' && styles.passTypeSegmentBtnActiveLeave,
                    ]}>
                    <Ionicons
                      name="bed-outline"
                      size={15}
                      color={passType === 'LEAVE' ? '#A78BFA' : Colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.passTypeSegmentText,
                        passType === 'LEAVE' && styles.passTypeSegmentTextActiveLeave,
                      ]}>
                      Leave (Overnight)
                    </Text>
                  </Pressable>
                </View>

                {/* Explanatory banner for selected pass type */}
                <View
                  style={[
                    styles.passTypeBanner,
                    passType === 'LEAVE' && styles.passTypeBannerLeave,
                  ]}>
                  <Ionicons
                    name={passType === 'OUTPASS' ? 'alert-circle-outline' : 'moon-outline'}
                    size={14}
                    color={passType === 'OUTPASS' ? '#38BDF8' : '#A78BFA'}
                  />
                  <Text
                    style={[
                      styles.passTypeBannerText,
                      passType === 'LEAVE' && styles.passTypeBannerTextLeave,
                    ]}>
                    {passType === 'OUTPASS'
                      ? 'Outpass rule: Must return today before 10:00 PM. Returns after 10:00 PM are automatically treated as Leave.'
                      : 'Leave pass: For overnight stay, multi-day absence, or returning past 10:00 PM.'}
                  </Text>
                </View>
              </View>

              {/* Destination Field */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Destination (e.g. Forum Mall, City Center, Home)"
                  placeholderTextColor={Colors.text.tertiary}
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              {/* Reason Field */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Reason for leaving campus"
                  placeholderTextColor={Colors.text.tertiary}
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              {/* Parent Contact Number (Locked Official Record - Non-editable by students) */}
              <View style={styles.lockedParentContainer}>
                <View style={styles.lockedParentHeader}>
                  <View style={styles.lockedParentLabelGroup}>
                    <Ionicons name="lock-closed" size={13} color="#F59E0B" />
                    <Text style={styles.lockedParentLabel}>Parent Mobile Number (Official Record)</Text>
                  </View>
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>NON-EDITABLE</Text>
                  </View>
                </View>
                <Text style={styles.lockedParentValue}>{parentPhone}</Text>
                <Text style={styles.lockedParentHint}>
                  Official hostel record linked to student admission. Cannot be modified by students. Automatic gate exit & return SMS notifications will be dispatched here.
                </Text>
              </View>

              {/* Departure Time */}
              <Pressable
                onPress={() => openPicker('departure')}
                style={styles.selectRow}>
                <Text
                  style={[
                    styles.selectLabel,
                    departureTime ? styles.selectValueText : null,
                  ]}>
                  {departureTime ? formatDate(departureTime.toISOString()) : 'Departure time'}
                </Text>
                <Text style={styles.selectBtnText}>Select</Text>
              </Pressable>

              {/* Return Time */}
              <Pressable
                onPress={() => openPicker('return')}
                style={styles.selectRow}>
                <Text
                  style={[
                    styles.selectLabel,
                    returnTime ? styles.selectValueText : null,
                  ]}>
                  {returnTime ? formatDate(returnTime.toISOString()) : 'Return time'}
                </Text>
                <Text style={styles.selectBtnText}>Select</Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Submit request"
                disabled={submitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed ? styles.submitButtonPressed : null,
                  submitting ? styles.submitButtonDisabled : null,
                ]}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit request</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Section: Requests */}
          <Text style={styles.sectionHeader}>
            {isAdmin ? `Student requests (${adminFilter.toLowerCase()})` : 'Your requests'}
          </Text>

          {(isAdmin
            ? requests.filter((r) => adminFilter === 'ALL' || r.status === adminFilter)
            : requests
          ).length === 0 && !refreshing && (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={32} color={Colors.text.tertiary} />
              <Text style={styles.emptyCardTitle}>No outpass requests found</Text>
              <Text style={styles.emptyCardSubtitle}>
                {isAdmin
                  ? `There are no requests marked as ${adminFilter.toLowerCase()} in the database.`
                  : 'Submit a new request above to generate your digital gate pass.'}
              </Text>
            </View>
          )}

          {(isAdmin
            ? requests.filter((r) => adminFilter === 'ALL' || r.status === adminFilter)
            : requests
          ).map((item) => {
            const badge = getStatusBadgeStyle(item.status);
            const isBusy = actionBusyId === item.id;

            return (
              <View key={item.id} style={styles.requestCard}>
                {/* Header Row: Student name / Destination + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    {isAdmin && (
                      <View style={styles.studentInfoRow}>
                        <Text style={styles.cardStudentName}>
                          {item.studentName || 'Student'}
                        </Text>
                        {item.usn ? (
                          <View style={styles.usnPill}>
                            <Text style={styles.usnPillText}>{item.usn}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                    <View style={styles.cardTitleTypeRow}>
                      <View
                        style={[
                          styles.passTypePill,
                          item.passType === 'LEAVE'
                            ? styles.passTypePillLeave
                            : styles.passTypePillOutpass,
                        ]}>
                        <Ionicons
                          name={item.passType === 'LEAVE' ? 'bed-outline' : 'time-outline'}
                          size={11}
                          color={item.passType === 'LEAVE' ? '#A78BFA' : '#38BDF8'}
                        />
                        <Text
                          style={[
                            styles.passTypePillText,
                            item.passType === 'LEAVE'
                              ? styles.passTypePillTextLeave
                              : styles.passTypePillTextOutpass,
                          ]}>
                          {item.passType === 'LEAVE' ? 'LEAVE' : 'OUTPASS'}
                        </Text>
                      </View>
                      <Text style={styles.cardDestination} numberOfLines={1}>
                        {item.destination}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.badge, badge.container]}>
                    <Text style={[styles.badgeText, badge.text]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Subtitle: Reason */}
                <Text style={styles.cardReason} numberOfLines={2}>
                  {item.reason}
                </Text>

                {/* Timestamps */}
                <Text style={styles.cardMeta}>
                  Departure: {formatDate(item.departureTime)}
                </Text>
                <Text style={styles.cardMeta}>
                  Return: {formatDate(item.returnTime)}
                </Text>
                {item.actualExitTime ? (
                  <Text style={[styles.cardMeta, { color: '#10B981', fontFamily: Typography.bold }]}>
                    Gate Exit Logged: {formatDate(item.actualExitTime)}
                  </Text>
                ) : null}
                {item.actualEntryTime ? (
                  <Text style={[styles.cardMeta, { color: '#38BDF8', fontFamily: Typography.bold }]}>
                    Gate Return Logged: {formatDate(item.actualEntryTime)}
                  </Text>
                ) : null}
                {item.parentPhone ? (
                  <View style={styles.cardParentPhoneRow}>
                    <Ionicons name="call-outline" size={13} color={Colors.text.accent} />
                    <Text style={styles.cardParentPhoneText}>
                      Parent SMS: {item.parentPhone}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.cardMeta}>
                  Requested {formatDate(item.createdAt)}
                </Text>

                {/* If Rejected: Show reason note */}
                {item.status === 'REJECTED' && item.rejectionReason && (
                  <View style={styles.rejectionNoticeBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.status.error} />
                    <Text style={styles.rejectionNoticeText}>
                      Reason: {item.rejectionReason}
                    </Text>
                  </View>
                )}

                {/* Student Action: View Gate QR Pass if Approved or Active */}
                {!isAdmin && (item.status === 'APPROVED' || item.status === 'ACTIVE') && (
                  <Pressable
                    onPress={() => setActiveQrPass(item)}
                    style={({ pressed }) => [
                      styles.viewQrButton,
                      item.status === 'ACTIVE' && { backgroundColor: '#059669' },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Ionicons name="qr-code" size={16} color="#FFFFFF" />
                    <Text style={styles.viewQrButtonText}>
                      {item.status === 'ACTIVE' ? 'View Return QR Pass' : 'View Gate QR Pass'}
                    </Text>
                  </Pressable>
                )}

                {/* Student Action: Cancel if Pending */}
                {!isAdmin && item.status === 'PENDING' && (
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleCancel(item.id)}
                    style={({ pressed }) => [
                      styles.cancelOutpassBtn,
                      pressed && { opacity: 0.8 },
                    ]}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color={Colors.text.secondary} />
                    ) : (
                      <Text style={styles.cancelOutpassBtnText}>Cancel Request</Text>
                    )}
                  </Pressable>
                )}

                {/* Admin Actions: Approve / Reject Buttons */}
                {isAdmin && item.status === 'PENDING' && (
                  <View style={styles.adminActionRow}>
                    <Pressable
                      disabled={isBusy}
                      onPress={() => handleReview(item.id, 'APPROVED')}
                      style={({ pressed }) => [
                        styles.approveBtn,
                        pressed && { opacity: 0.8 },
                      ]}>
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.approveBtnText}>Approve Pass</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      disabled={isBusy}
                      onPress={() => setRejectionModalItem(item)}
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        pressed && { opacity: 0.8 },
                      ]}>
                      <Ionicons name="close-circle-outline" size={16} color={Colors.status.error} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </Pressable>
                  </View>
                )}

                {/* Admin / Gate Guard Actions: Scan Gate Exit / Scan Gate Return */}
                {isAdmin && item.status === 'APPROVED' && (
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleGateScan(item, 'EXIT')}
                    style={({ pressed }) => [
                      styles.gateScanBtn,
                      pressed && { opacity: 0.8 },
                    ]}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.gateScanBtnText}>Log Exit Scan (SMS Parent)</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {isAdmin && item.status === 'ACTIVE' && (
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleGateScan(item, 'ENTRY')}
                    style={({ pressed }) => [
                      styles.gateScanBtn,
                      { backgroundColor: '#059669' },
                      pressed && { opacity: 0.8 },
                    ]}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.gateScanBtnText}>Log Return Scan (SMS Parent)</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sleek Custom Date/Time Picker Modal with Calendar */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerTarget(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  Select {pickerTarget === 'departure' ? 'Departure' : 'Return'} Time
                </Text>
                <Text style={styles.modalSubtitle}>
                  {pickerMode === 'calendar' ? 'Pick a date and time from calendar' : 'Quick schedule options'}
                </Text>
              </View>
              <Pressable onPress={() => setPickerTarget(null)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {/* Mode Switcher Tabs */}
            <View style={styles.pickerModeRow}>
              <Pressable
                onPress={() => setPickerMode('calendar')}
                style={[styles.pickerModeTab, pickerMode === 'calendar' && styles.pickerModeTabActive]}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={pickerMode === 'calendar' ? Colors.primary.light : Colors.text.secondary}
                />
                <Text
                  style={[
                    styles.pickerModeTabText,
                    pickerMode === 'calendar' && styles.pickerModeTabTextActive,
                  ]}>
                  Calendar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPickerMode('quick')}
                style={[styles.pickerModeTab, pickerMode === 'quick' && styles.pickerModeTabActive]}>
                <Ionicons
                  name="flash-outline"
                  size={15}
                  color={pickerMode === 'quick' ? Colors.primary.light : Colors.text.secondary}
                />
                <Text
                  style={[
                    styles.pickerModeTabText,
                    pickerMode === 'quick' && styles.pickerModeTabTextActive,
                  ]}>
                  Quick presets
                </Text>
              </Pressable>
            </View>

            {pickerMode === 'calendar' ? (
              <View style={styles.calendarSection}>
                {/* Month/Year Navigation */}
                <View style={styles.calNavRow}>
                  <Pressable
                    onPress={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    style={styles.calNavBtn}>
                    <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
                  </Pressable>

                  <Text style={styles.calNavTitle}>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December',
                    ][calMonth]}{' '}
                    {calYear}
                  </Text>

                  <Pressable
                    onPress={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={18} color={Colors.text.primary} />
                  </Pressable>
                </View>

                {/* Weekday Row */}
                <View style={styles.calWeekRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <Text key={day} style={styles.calWeekText}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calGrid}>
                  {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.calDayCell} />
                  ))}

                  {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = calDay === day;
                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() === calMonth &&
                      new Date().getFullYear() === calYear;

                    return (
                      <Pressable
                        key={`day-${day}`}
                        onPress={() => setCalDay(day)}
                        style={[
                          styles.calDayCell,
                          isSelected && styles.calDayCellSelected,
                          isToday && !isSelected && styles.calDayCellToday,
                        ]}>
                        <Text
                          style={[
                            styles.calDayText,
                            isSelected && styles.calDayTextSelected,
                            isToday && !isSelected && styles.calDayTextToday,
                          ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Time Selection */}
                <View style={styles.timeSection}>
                  <View style={styles.timeTitleRow}>
                    <Text style={styles.timeLabel}>Time of departure / return:</Text>
                    <Text style={styles.timeValueDisplay}>
                      {String(calHour).padStart(2, '0')}:{String(calMinute).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.timeChipsRow}>
                    {[
                      { label: '08:00 AM', h: 8, m: 0 },
                      { label: '12:00 PM', h: 12, m: 0 },
                      { label: '05:00 PM', h: 17, m: 0 },
                      { label: '08:00 PM', h: 20, m: 0 },
                      { label: '09:30 PM', h: 21, m: 30 },
                    ].map((slot) => {
                      const active = calHour === slot.h && calMinute === slot.m;
                      return (
                        <Pressable
                          key={slot.label}
                          onPress={() => {
                            setCalHour(slot.h);
                            setCalMinute(slot.m);
                          }}
                          style={[styles.timeSlotChip, active && styles.timeSlotChipActive]}>
                          <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
                            {slot.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Confirm Button */}
                <Pressable onPress={confirmCalendarSelection} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>
                    Set {pickerTarget === 'departure' ? 'Departure' : 'Return'} Time
                  </Text>
                  <Ionicons name="checkmark" size={18} color={Colors.text.onBrand} />
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.presetGrid}>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(1)}>
                    <Text style={styles.presetBtnText}>In 1 Hour</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(4)}>
                    <Text style={styles.presetBtnText}>In 4 Hours</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(12)}>
                    <Text style={styles.presetBtnText}>This Evening</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(24)}>
                    <Text style={styles.presetBtnText}>Tomorrow Morning</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(72)}>
                    <Text style={styles.presetBtnText}>In 3 Days</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => applyPickerSelection(168)}>
                    <Text style={styles.presetBtnText}>In 1 Week</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setPickerTarget(null)}>
                  <Text style={styles.modalCloseBtnText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* 2. Digital Gate QR Pass Modal */}
      <Modal
        visible={activeQrPass !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveQrPass(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActiveQrPass(null)}>
          <View style={styles.qrModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.qrHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.verifiedBadgeText}>VERIFIED GATE PASS</Text>
                </View>
                <Text style={styles.qrModalTitle} numberOfLines={1}>
                  {activeQrPass?.destination}
                </Text>
              </View>
              <Pressable onPress={() => setActiveQrPass(null)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {/* Scannable High-Contrast QR Code */}
            <View style={styles.qrContainerBox}>
              {activeQrPass && (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      JSON.stringify({
                        outpassId: activeQrPass.id,
                        token: activeQrPass.qrToken || activeQrPass.id,
                        studentId: activeQrPass.studentId,
                        destination: activeQrPass.destination,
                        departureTime: activeQrPass.departureTime,
                        returnTime: activeQrPass.returnTime,
                      })
                    )}&color=080B11&bgcolor=FFFFFF`,
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Pass Validity Details */}
            <View style={styles.qrMetaGrid}>
              <View style={styles.qrMetaItem}>
                <Text style={styles.qrMetaLabel}>PASS TYPE</Text>
                <Text
                  style={[
                    styles.qrMetaValue,
                    {
                      color:
                        activeQrPass?.passType === 'LEAVE' ? '#A78BFA' : '#38BDF8',
                    },
                  ]}
                  numberOfLines={1}>
                  {activeQrPass?.passType === 'LEAVE' ? 'Hostel Leave' : 'Day Outpass'}
                </Text>
              </View>
              <View style={styles.qrMetaItem}>
                <Text style={styles.qrMetaLabel}>VALID FROM</Text>
                <Text style={styles.qrMetaValue} numberOfLines={1}>
                  {activeQrPass ? formatDate(activeQrPass.departureTime) : ''}
                </Text>
              </View>
              <View style={styles.qrMetaItem}>
                <Text style={styles.qrMetaLabel}>RETURN BEFORE</Text>
                <Text style={styles.qrMetaValue} numberOfLines={1}>
                  {activeQrPass ? formatDate(activeQrPass.returnTime) : ''}
                </Text>
              </View>
            </View>

            {/* Token details */}
            <View style={styles.tokenPill}>
              <Ionicons name="key-outline" size={13} color={Colors.text.tertiary} />
              <Text style={styles.tokenPillText} numberOfLines={1}>
                PASS TOKEN: {activeQrPass?.qrToken || activeQrPass?.id}
              </Text>
            </View>

            {/* Parent SMS notification status */}
            {activeQrPass?.parentPhone ? (
              <View style={styles.smsAlertNoticePill}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#10B981" />
                <Text style={styles.smsAlertNoticeText}>
                  Parent SMS Alert Active: {activeQrPass.parentPhone}
                </Text>
              </View>
            ) : null}

            <Text style={styles.qrNotice}>
              Show this QR code to the hostel security guard at the main gate for exit and entry verification.
            </Text>

            <Pressable onPress={() => setActiveQrPass(null)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Close Pass</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* 3. Warden Rejection Reason Modal */}
      <Modal
        visible={rejectionModalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalItem(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRejectionModalItem(null)}>
          <View style={styles.rejectModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Reject Outpass Request</Text>
            <Text style={styles.modalSubtitle}>
              Provide a reason for declining this student's request.
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { height: 72, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="e.g. Exams active, Parent permission missing"
                placeholderTextColor={Colors.text.tertiary}
                value={rejectionReasonInput}
                onChangeText={setRejectionReasonInput}
                multiline
              />
            </View>

            {/* Quick reason presets */}
            <View style={styles.quickReasonsRow}>
              {['Exams ongoing', 'Curfew hours active', 'Parent verification needed'].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setRejectionReasonInput(preset)}
                  style={styles.quickReasonChip}>
                  <Text style={styles.quickReasonChipText}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rejectActionsRow}>
              <Pressable
                onPress={() => setRejectionModalItem(null)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                disabled={actionBusyId !== null}
                onPress={() => {
                  if (rejectionModalItem) {
                    handleReview(
                      rejectionModalItem.id,
                      'REJECTED',
                      rejectionReasonInput.trim() || 'Declined by Warden'
                    );
                  }
                }}
                style={styles.confirmRejectBtn}>
                <Text style={styles.confirmRejectBtnText}>Confirm Reject</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  const light = Colors.background.canvas === '#F4F6FB';
  const cardBorder = light ? 'rgba(49, 52, 145, 0.16)' : Colors.border.card;
  const cardShadow = light ? '0px 6px 16px rgba(15, 23, 42, 0.06)' : '0px 10px 24px rgba(0, 0, 0, 0.35)';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
    },
    headerBackBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      color: Colors.text.primary,
      flex: 1,
      marginLeft: 16,
    },
    headerRefreshBtn: {
      padding: 4,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    formCard: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 20,
      padding: 18,
      marginBottom: 24,
      boxShadow: cardShadow,
    },
    formTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    formSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
      marginBottom: 16,
    },
    inputWrapper: {
      backgroundColor: Colors.background.input,
      borderWidth: 1.5,
      borderColor: Colors.border.subtle,
      borderRadius: 12,
      marginBottom: 12,
      paddingHorizontal: 14,
    },
    input: {
      fontFamily: Typography.regular,
      color: Colors.text.primary,
      fontSize: 15,
      height: 48,
    },
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.background.input,
      borderWidth: 1.5,
      borderColor: Colors.border.subtle,
      borderRadius: 12,
      height: 48,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    selectLabel: {
      fontFamily: Typography.regular,
      color: Colors.text.secondary,
      fontSize: 15,
    },
    selectValueText: {
      color: Colors.text.primary,
      fontFamily: Typography.semiBold,
    },
    selectBtnText: {
      fontFamily: Typography.semiBold,
      color: Colors.primary.light,
      fontSize: 14,
    },
    submitButton: {
      backgroundColor: Colors.primary.main,
      borderRadius: 24,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      borderWidth: 1,
      borderColor: light ? 'rgba(255, 255, 255, 0.35)' : Colors.border.glow,
      boxShadow: '0px 6px 14px rgba(49, 52, 145, 0.28)',
    },
    submitButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontSize: 15,
    },
    sectionHeader: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginBottom: 14,
    },
    requestCard: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      boxShadow: cardShadow,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    cardDestination: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: Colors.text.primary,
      flex: 1,
      marginRight: 8,
    },
    cardReason: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
      marginBottom: 8,
    },
    cardMeta: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.tertiary,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    badgeText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
    },
    badgePending: {
      backgroundColor: light ? 'rgba(49, 52, 145, 0.08)' : 'rgba(129, 140, 248, 0.18)',
      borderColor: light ? 'rgba(49, 52, 145, 0.25)' : 'rgba(129, 140, 248, 0.35)',
    },
    badgePendingText: {
      color: Colors.primary.light,
    },
    badgeApproved: {
      backgroundColor: light ? 'rgba(5, 150, 105, 0.1)' : 'rgba(52, 211, 153, 0.18)',
      borderColor: light ? 'rgba(5, 150, 105, 0.3)' : 'rgba(52, 211, 153, 0.35)',
    },
    badgeApprovedText: {
      color: light ? '#059669' : '#34D399',
    },
    badgeRejected: {
      backgroundColor: Colors.status.errorBackground,
      borderColor: Colors.border.error,
    },
    badgeRejectedText: {
      color: Colors.status.error,
    },
    badgeActive: {
      backgroundColor: light ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.18)',
      borderColor: light ? 'rgba(2, 132, 199, 0.3)' : 'rgba(56, 189, 248, 0.35)',
    },
    badgeActiveText: {
      color: Colors.primary.cyan,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(7, 9, 15, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 20,
      width: '100%',
      maxWidth: 380,
      padding: 20,
      boxShadow: cardShadow,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    modalCloseIconBtn: {
      padding: 4,
    },
    modalTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginBottom: 2,
    },
    modalSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    pickerModeRow: {
      flexDirection: 'row',
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    pickerModeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
    },
    pickerModeTabActive: {
      backgroundColor: light ? 'rgba(49, 52, 145, 0.1)' : 'rgba(79, 70, 229, 0.25)',
    },
    pickerModeTabText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    pickerModeTabTextActive: {
      color: Colors.primary.light,
      fontFamily: Typography.bold,
    },
    calendarSection: {
      marginTop: 2,
    },
    calNavRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    calNavBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.background.input,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    calNavTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
    },
    calWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      paddingBottom: 4,
    },
    calWeekText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.tertiary,
      width: 34,
      textAlign: 'center',
    },
    calGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    calDayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
      marginVertical: 1,
    },
    calDayCellSelected: {
      backgroundColor: Colors.primary.main,
    },
    calDayCellToday: {
      borderWidth: 1,
      borderColor: Colors.primary.light,
    },
    calDayText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: Colors.text.primary,
    },
    calDayTextSelected: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontWeight: '700',
    },
    calDayTextToday: {
      color: Colors.primary.light,
      fontWeight: '700',
    },
    timeSection: {
      backgroundColor: Colors.background.input,
      borderRadius: 14,
      padding: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 14,
    },
    timeTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    timeLabel: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    timeValueDisplay: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.primary.light,
    },
    timeChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    timeSlotChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: Colors.background.elevated,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    timeSlotChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: Colors.primary.main,
    },
    timeSlotText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    timeSlotTextActive: {
      color: Colors.text.onBrand,
      fontWeight: '700',
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.primary.main,
      borderRadius: 20,
      paddingVertical: 12,
    },
    confirmBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 18,
    },
    presetBtn: {
      flexBasis: '47%',
      backgroundColor: Colors.background.input,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    presetBtnText: {
      fontFamily: Typography.medium,
      color: Colors.text.primary,
      fontSize: 13,
    },
    modalCloseBtn: {
      backgroundColor: Colors.background.elevated,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    modalCloseBtnText: {
      fontFamily: Typography.semiBold,
      color: Colors.text.secondary,
      fontSize: 14,
    },
    emptyCard: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyCardTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
      marginTop: 8,
      marginBottom: 4,
    },
    emptyCardSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
    },
    /* Warden Admin Review Styles */
    adminBannerCard: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 20,
      padding: 18,
      marginBottom: 20,
      boxShadow: cardShadow,
    },
    adminBadgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    adminModePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: light ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    adminModePillText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: Colors.primary.light,
    },
    adminStatsText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: '#F59E0B',
    },
    adminBannerTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    adminBannerSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 14,
    },
    filterTabsRow: {
      flexDirection: 'row',
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      padding: 3,
      gap: 4,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 9,
    },
    filterTabActive: {
      backgroundColor: Colors.primary.main,
    },
    filterTabText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    filterTabTextActive: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
    },
    studentInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    cardStudentName: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
    },
    usnPill: {
      backgroundColor: Colors.background.elevated,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    usnPillText: {
      fontFamily: Typography.semiBold,
      fontSize: 11,
      color: Colors.primary.light,
    },
    rejectionNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.status.errorBackground,
      borderRadius: 10,
      padding: 8,
      marginTop: 8,
    },
    rejectionNoticeText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.status.error,
      flex: 1,
    },
    viewQrButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.primary.main,
      borderRadius: 14,
      paddingVertical: 10,
      marginTop: 12,
      borderWidth: 1,
      borderColor: Colors.border.glow,
      boxShadow: '0px 4px 12px rgba(49, 52, 145, 0.35)',
    },
    viewQrButtonText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.onBrand,
    },
    cancelOutpassBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginTop: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    cancelOutpassBtnText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    adminActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
    },
    approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 9,
    },
    approveBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    rejectBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.status.errorBackground,
      borderRadius: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: Colors.border.error,
    },
    rejectBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.status.error,
    },
    /* Digital Gate QR Pass Modal Styles */
    qrModalContent: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 24,
      width: '100%',
      maxWidth: 360,
      padding: 22,
      alignItems: 'center',
      boxShadow: cardShadow,
    },
    qrHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      marginBottom: 16,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: light ? 'rgba(5, 150, 105, 0.1)' : 'rgba(52, 211, 153, 0.18)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    verifiedBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#10B981',
      letterSpacing: 0.5,
    },
    qrModalTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      color: Colors.text.primary,
    },
    qrContainerBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 3,
      borderColor: Colors.border.focus,
      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.25)',
    },
    qrImage: {
      width: 190,
      height: 190,
    },
    qrMetaGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      backgroundColor: Colors.background.input,
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    qrMetaItem: {
      flex: 1,
      alignItems: 'center',
    },
    qrMetaLabel: {
      fontFamily: Typography.medium,
      fontSize: 10,
      color: Colors.text.tertiary,
      marginBottom: 2,
    },
    qrMetaValue: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: Colors.text.primary,
      textAlign: 'center',
    },
    tokenPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.background.elevated,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      maxWidth: '100%',
    },
    tokenPillText: {
      fontFamily: Typography.medium,
      fontSize: 10,
      color: Colors.text.secondary,
    },
    qrNotice: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.tertiary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 16,
    },
    doneBtn: {
      backgroundColor: Colors.primary.main,
      borderRadius: 14,
      width: '100%',
      paddingVertical: 12,
      alignItems: 'center',
    },
    doneBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.onBrand,
    },
    /* Rejection Modal */
    rejectModalContent: {
      backgroundColor: Colors.background.surface,
      borderWidth: 1.5,
      borderColor: cardBorder,
      borderRadius: 20,
      width: '100%',
      maxWidth: 360,
      padding: 20,
      boxShadow: cardShadow,
    },
    quickReasonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
    },
    quickReasonChip: {
      backgroundColor: Colors.background.input,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    quickReasonChipText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: Colors.text.secondary,
    },
    rejectActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    confirmRejectBtn: {
      flex: 1,
      backgroundColor: Colors.status.error,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    confirmRejectBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: '#FFFFFF',
    },
    /* Parent Phone & SMS Alert Styles */
    cardParentPhoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 4,
      marginBottom: 2,
    },
    cardParentPhoneText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.accent,
    },
    gateScanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.primary.main,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginTop: 10,
    },
    gateScanBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    smsAlertNoticePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: light ? 'rgba(5, 150, 105, 0.1)' : 'rgba(16, 185, 129, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.35)',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 12,
      width: '100%',
    },
    smsAlertNoticeText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: '#10B981',
      flex: 1,
    },
    simulateScanBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#1D4ED8',
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 16,
      width: '100%',
      marginBottom: 10,
    },
    simulateScanBtnText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    passTypeContainer: {
      marginBottom: 16,
    },
    passTypeSectionLabel: {
      fontFamily: Typography.bold,
      fontSize: 11,
      letterSpacing: 0.8,
      color: Colors.text.tertiary,
      marginBottom: 8,
    },
    passTypeSegmentRow: {
      flexDirection: 'row',
      backgroundColor: Colors.background.elevated,
      borderRadius: 12,
      padding: 4,
      gap: 6,
    },
    passTypeSegmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    passTypeSegmentBtnActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: '#38BDF8',
    },
    passTypeSegmentBtnActiveLeave: {
      backgroundColor: 'rgba(167, 139, 250, 0.15)',
      borderWidth: 1,
      borderColor: '#A78BFA',
    },
    passTypeSegmentText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    passTypeSegmentTextActive: {
      color: '#38BDF8',
      fontWeight: '700',
    },
    passTypeSegmentTextActiveLeave: {
      color: '#A78BFA',
      fontWeight: '700',
    },
    passTypeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
    },
    passTypeBannerLeave: {
      backgroundColor: 'rgba(167, 139, 250, 0.08)',
    },
    passTypeBannerText: {
      fontFamily: Typography.medium,
      fontSize: 11,
      color: '#38BDF8',
      flex: 1,
    },
    passTypeBannerTextLeave: {
      color: '#A78BFA',
    },
    lockedParentContainer: {
      backgroundColor: Colors.background.elevated,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    lockedParentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    lockedParentLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    lockedParentLabel: {
      fontFamily: Typography.semiBold,
      fontSize: 11,
      color: Colors.text.tertiary,
      letterSpacing: 0.5,
    },
    lockedBadge: {
      backgroundColor: 'rgba(148, 163, 184, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    lockedBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 9,
      color: '#94A3B8',
    },
    lockedParentValue: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    lockedParentHint: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: Colors.text.secondary,
      lineHeight: 15,
    },
    cardTitleTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    passTypePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    passTypePillOutpass: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    passTypePillLeave: {
      backgroundColor: 'rgba(167, 139, 250, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(167, 139, 250, 0.4)',
    },
    passTypePillText: {
      fontFamily: Typography.bold,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    passTypePillTextOutpass: {
      color: '#38BDF8',
    },
    passTypePillTextLeave: {
      color: '#A78BFA',
    },
  });
}

