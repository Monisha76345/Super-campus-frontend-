import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

import {
  callOffSportsDayApi,
  fetchSportsClosuresApi,
  fetchSportsFacilitiesApi,
  reopenSportsDayApi,
  updateSportsFacilityTimingApi,
} from '../../sports-api';
import { SportsFacility, SportsFacilityClosure } from '../../sports-types';

interface AdminSportsControlsModalProps {
  visible: boolean;
  onClose: () => void;
  token?: string;
  tenantId?: string;
  onUpdated?: () => void;
  initialFacilityId?: string;
}

export function AdminSportsControlsModal({
  visible,
  onClose,
  token,
  tenantId,
  onUpdated,
  initialFacilityId,
}: AdminSportsControlsModalProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [activeTab, setActiveTab] = useState<'CALL_OFF' | 'TIMINGS'>('CALL_OFF');
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [closures, setClosures] = useState<SportsFacilityClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Call off state
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Campus Sports Meet / Court Maintenance');

  // Timings state
  const [timingFacilityId, setTimingFacilityId] = useState<string>('');
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [slotDuration, setSlotDuration] = useState('60');

  // 2 rolling dates for quick selection
  const rollingDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Today' : 'Tomorrow';
      list.push({ dateStr, label });
    }
    return list;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facList, closList] = await Promise.all([
        fetchSportsFacilitiesApi(token, tenantId),
        fetchSportsClosuresApi(token, tenantId),
      ]);
      setFacilities(facList);
      setClosures(closList);

      if (initialFacilityId) {
        setSelectedFacilityId(initialFacilityId);
        setTimingFacilityId(initialFacilityId);
        const curFac = facList.find((f) => f.id === initialFacilityId);
        if (curFac) {
          setOpeningTime(curFac.openingTime.slice(0, 5));
          setClosingTime(curFac.closingTime.slice(0, 5));
          setSlotDuration(String(curFac.slotDurationMinutes || 60));
        }
      } else if (facList.length > 0 && !timingFacilityId) {
        setTimingFacilityId(facList[0].id);
        setOpeningTime(facList[0].openingTime.slice(0, 5));
        setClosingTime(facList[0].closingTime.slice(0, 5));
        setSlotDuration(String(facList[0].slotDurationMinutes || 60));
      }
    } catch (e) {
      console.warn('AdminSportsControlsModal loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, initialFacilityId]);

  const handleFacilityChangeForTiming = (facId: string) => {
    setTimingFacilityId(facId);
    const fac = facilities.find((f) => f.id === facId);
    if (fac) {
      setOpeningTime(fac.openingTime.slice(0, 5));
      setClosingTime(fac.closingTime.slice(0, 5));
      setSlotDuration(String(fac.slotDurationMinutes || 60));
    }
  };

  // Submit Call-off Day
  const handleCallOffDay = async () => {
    if (!token || !tenantId) return;
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for calling off bookings.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await callOffSportsDayApi(token, tenantId, {
        facilityId: selectedFacilityId,
        closureDate: selectedDate,
        reason: reason.trim(),
      });
      Alert.alert('Day Called Off', res.message || 'Bookings have been blocked for this day.');
      await loadData();
      onUpdated?.();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to call off day.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reopen Day
  const handleReopenDay = async (facilityId: string, closureDate: string) => {
    if (!token || !tenantId) return;
    try {
      setSubmitting(true);
      const res = await reopenSportsDayApi(token, tenantId, {
        facilityId,
        closureDate,
      });
      Alert.alert('Bookings Resumed', res.message || 'Bookings have been reopened.');
      await loadData();
      onUpdated?.();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reopen bookings.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Timings Update / Extra Slot
  const handleSaveTimings = async () => {
    if (!token || !tenantId || !timingFacilityId) return;
    try {
      setSubmitting(true);
      await updateSportsFacilityTimingApi(token, tenantId, timingFacilityId, {
        openingTime: `${openingTime}:00`,
        closingTime: `${closingTime}:00`,
        slotDurationMinutes: parseInt(slotDuration, 10) || 60,
      });
      Alert.alert('Timings Updated', 'Court operating hours and timings have been updated successfully!');
      await loadData();
      onUpdated?.();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update timings.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Preset: Add Extra Morning Timing (05:00 AM)
  const handleAddExtraMorningTiming = () => {
    setOpeningTime('05:00');
    Alert.alert('Extra Timing Preset', 'Opening time set to 05:00 AM. Tap "Save Timings" to apply.');
  };

  // Quick Preset: Add Extra Late Night Timing (11:00 PM)
  const handleAddExtraNightTiming = () => {
    setClosingTime('23:00');
    Alert.alert('Extra Timing Preset', 'Closing time set to 23:00 (11:00 PM). Tap "Save Timings" to apply.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#38BDF8" />
                <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
              </View>
              <Text style={styles.headerTitle}>Sports Timings & Day Controls</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </Pressable>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('CALL_OFF')}
              style={[styles.tabItem, activeTab === 'CALL_OFF' && styles.tabItemActive]}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={activeTab === 'CALL_OFF' ? '#38BDF8' : Colors.text.secondary}
              />
              <Text
                style={[styles.tabItemText, activeTab === 'CALL_OFF' && styles.tabItemTextActive]}
              >
                Call Off Day
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('TIMINGS')}
              style={[styles.tabItem, activeTab === 'TIMINGS' && styles.tabItemActive]}
            >
              <Ionicons
                name="time"
                size={16}
                color={activeTab === 'TIMINGS' ? '#38BDF8' : Colors.text.secondary}
              />
              <Text
                style={[styles.tabItemText, activeTab === 'TIMINGS' && styles.tabItemTextActive]}
              >
                Change Timings
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.loadingText}>Loading campus courts...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {activeTab === 'CALL_OFF' ? (
                /* TAB 1: CALL OFF DAY */
                <View>
                  <Text style={styles.sectionHeading}>Call off court bookings for a day</Text>
                  <Text style={styles.sectionSub}>
                    Prevent students from booking courts on days with bad weather, tournaments, or maintenance.
                  </Text>

                  {/* Court Selector */}
                  <Text style={styles.inputLabel}>Select Court / Facility</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    <Pressable
                      onPress={() => setSelectedFacilityId('ALL')}
                      style={[
                        styles.courtChip,
                        selectedFacilityId === 'ALL' && styles.courtChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.courtChipText,
                          selectedFacilityId === 'ALL' && styles.courtChipTextActive,
                        ]}
                      >
                        ⚡ All Campus Courts
                      </Text>
                    </Pressable>

                    {facilities.map((fac) => (
                      <Pressable
                        key={fac.id}
                        onPress={() => setSelectedFacilityId(fac.id)}
                        style={[
                          styles.courtChip,
                          selectedFacilityId === fac.id && styles.courtChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.courtChipText,
                            selectedFacilityId === fac.id && styles.courtChipTextActive,
                          ]}
                        >
                          {fac.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Date Selector (2 Days Window) */}
                  <Text style={styles.inputLabel}>Select Date to Call Off</Text>
                  <View style={styles.datePickerRow}>
                    {rollingDates.map((item) => {
                      const isSelected = selectedDate === item.dateStr;
                      return (
                        <Pressable
                          key={item.dateStr}
                          onPress={() => setSelectedDate(item.dateStr)}
                          style={[styles.dateBtn, isSelected && styles.dateBtnActive]}
                        >
                          <Text style={[styles.dateBtnLabel, isSelected && styles.dateBtnLabelActive]}>
                            {item.label}
                          </Text>
                          <Text style={[styles.dateBtnVal, isSelected && styles.dateBtnValActive]}>
                            {item.dateStr}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Reason Input */}
                  <Text style={styles.inputLabel}>Reason for Calling Off</Text>
                  <TextInput
                    style={styles.textInput}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="e.g. Rain, Surface Recoating, Sports Tournament..."
                    placeholderTextColor="#64748B"
                  />

                  {/* Action Button */}
                  <Pressable
                    onPress={handleCallOffDay}
                    disabled={submitting}
                    style={[styles.actionBtn, styles.callOffBtn, submitting && styles.btnDisabled]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="ban-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Call Off Day (Block Bookings)</Text>
                      </>
                    )}
                  </Pressable>

                  {/* Active Closures List */}
                  <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
                    Active Called-Off Days ({closures.length})
                  </Text>
                  {closures.length === 0 ? (
                    <View style={styles.emptyClosuresBox}>
                      <Ionicons name="checkmark-circle-outline" size={28} color="#10B981" />
                      <Text style={styles.emptyClosuresText}>
                        All courts are open for booking. No days currently called off.
                      </Text>
                    </View>
                  ) : (
                    closures.map((c) => {
                      const fac = facilities.find((f) => f.id === c.facilityId);
                      return (
                        <View key={c.id} style={styles.closureCard}>
                          <View style={styles.closureCardHeader}>
                            <View>
                              <Text style={styles.closureCourtName}>
                                {fac?.name || (c.facilityId === 'ALL' ? 'All Courts' : 'Campus Court')}
                              </Text>
                              <Text style={styles.closureDateText}>
                                📅 {c.closureDate} · {c.startTime?.slice(0, 5)} - {c.endTime?.slice(0, 5)}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => handleReopenDay(c.facilityId, c.closureDate)}
                              style={styles.reopenBtn}
                            >
                              <Ionicons name="refresh" size={13} color="#10B981" />
                              <Text style={styles.reopenBtnText}>Reopen</Text>
                            </Pressable>
                          </View>
                          <Text style={styles.closureReasonText}>Reason: {c.reason}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : (
                /* TAB 2: MANAGE TIMINGS & ADD EXTRA TIMINGS */
                <View>
                  <Text style={styles.sectionHeading}>Manage Court Operating Timings</Text>
                  <Text style={styles.sectionSub}>
                    Adjust opening hours, add extra slot timings (e.g. early morning or late evening), and configure slot lengths.
                  </Text>

                  {/* Select Court */}
                  <Text style={styles.inputLabel}>Select Court</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {facilities.map((fac) => (
                      <Pressable
                        key={fac.id}
                        onPress={() => handleFacilityChangeForTiming(fac.id)}
                        style={[
                          styles.courtChip,
                          timingFacilityId === fac.id && styles.courtChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.courtChipText,
                            timingFacilityId === fac.id && styles.courtChipTextActive,
                          ]}
                        >
                          {fac.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Quick Timing Boosts */}
                  <Text style={styles.inputLabel}>Quick Timing Presets</Text>
                  <View style={styles.presetRow}>
                    <Pressable onPress={handleAddExtraMorningTiming} style={styles.presetBtn}>
                      <Ionicons name="sunny-outline" size={15} color="#F59E0B" />
                      <Text style={styles.presetBtnText}>+ Early Morning (05:00 AM)</Text>
                    </Pressable>

                    <Pressable onPress={handleAddExtraNightTiming} style={styles.presetBtn}>
                      <Ionicons name="moon-outline" size={15} color="#A78BFA" />
                      <Text style={styles.presetBtnText}>+ Late Night (11:00 PM)</Text>
                    </Pressable>
                  </View>

                  {/* Time Inputs */}
                  <View style={styles.timeInputsGrid}>
                    <View style={styles.timeInputCol}>
                      <Text style={styles.inputLabel}>Opening Time (HH:MM)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={openingTime}
                        onChangeText={setOpeningTime}
                        placeholder="06:00"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={styles.timeInputCol}>
                      <Text style={styles.inputLabel}>Closing Time (HH:MM)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={closingTime}
                        onChangeText={setClosingTime}
                        placeholder="22:00"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  {/* Slot Duration */}
                  <Text style={styles.inputLabel}>Slot Duration (Minutes)</Text>
                  <View style={styles.durationRow}>
                    {['30', '45', '60', '90'].map((mins) => {
                      const isSel = slotDuration === mins;
                      return (
                        <Pressable
                          key={mins}
                          onPress={() => setSlotDuration(mins)}
                          style={[styles.durationChip, isSel && styles.durationChipActive]}
                        >
                          <Text
                            style={[styles.durationChipText, isSel && styles.durationChipTextActive]}
                          >
                            {mins} mins
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Save Button */}
                  <Pressable
                    onPress={handleSaveTimings}
                    disabled={submitting}
                    style={[styles.actionBtn, styles.saveBtn, submitting && styles.btnDisabled]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Save Updated Timings</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: isDark ? '#0B1120' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
      maxHeight: '90%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitleGroup: {
      gap: 3,
    },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    adminBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#38BDF8',
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#111827' : '#F1F5F9',
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      gap: 4,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 8,
    },
    tabItemActive: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    tabItemTextActive: {
      color: '#38BDF8',
      fontWeight: '700',
    },
    loadingBox: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      color: Colors.text.secondary,
    },
    scrollBody: {
      paddingBottom: 20,
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 12,
      color: Colors.text.secondary,
      lineHeight: 17,
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.secondary,
      marginTop: 10,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chipRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    courtChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      backgroundColor: isDark ? '#101626' : '#F8FAFC',
      marginRight: 8,
    },
    courtChipActive: {
      backgroundColor: '#2563EB',
      borderColor: '#38BDF8',
    },
    courtChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    courtChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    datePickerRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    dateBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      backgroundColor: isDark ? '#101626' : '#F8FAFC',
      alignItems: 'center',
    },
    dateBtnActive: {
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
    },
    dateBtnLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    dateBtnLabelActive: {
      color: '#38BDF8',
    },
    dateBtnVal: {
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    dateBtnValActive: {
      color: '#38BDF8',
    },
    textInput: {
      backgroundColor: isDark ? '#101626' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#CBD5E1',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      color: Colors.text.primary,
      marginBottom: 14,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 12,
      marginTop: 8,
    },
    callOffBtn: {
      backgroundColor: '#DC2626',
    },
    saveBtn: {
      backgroundColor: '#2563EB',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    emptyClosuresBox: {
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
      gap: 6,
    },
    emptyClosuresText: {
      fontSize: 12,
      color: isDark ? '#34D399' : '#059669',
      textAlign: 'center',
      fontWeight: '600',
    },
    closureCard: {
      backgroundColor: isDark ? '#151D30' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#FCA5A5',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    closureCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    closureCourtName: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    closureDateText: {
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    reopenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
      borderWidth: 1,
      borderColor: '#10B981',
    },
    reopenBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    closureReasonText: {
      fontSize: 11,
      color: isDark ? '#EF4444' : '#B91C1C',
      fontStyle: 'italic',
    },
    presetRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    presetBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#CBD5E1',
    },
    presetBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: Colors.text.primary,
    },
    timeInputsGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    timeInputCol: {
      flex: 1,
    },
    durationRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    durationChip: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
      backgroundColor: isDark ? '#101626' : '#F8FAFC',
      alignItems: 'center',
    },
    durationChipActive: {
      backgroundColor: '#2563EB',
      borderColor: '#38BDF8',
    },
    durationChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    durationChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}
