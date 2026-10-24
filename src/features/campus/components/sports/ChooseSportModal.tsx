import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { searchUsersApi } from '@/features/chat/chat-api';
import { SearchUser } from '@/features/chat/types';
import { useAppTheme } from '@/theme/app-theme';

import {
  createSportsBookingApi,
  fetchSlotAvailabilityApi,
  fetchSportsFacilitiesApi,
} from '../../sports-api';
import {
  SlotAvailability,
  SportsBooking,
  SportsFacility,
  SportType,
} from '../../sports-types';

export interface SportCardItem {
  sportType: SportType;
  title: string;
  subtitle: string;
  tag: 'Indoor' | 'Outdoor';
  icon: keyof typeof Ionicons.glyphMap;
}

export const CAMPUS_SPORTS_LIST: SportCardItem[] = [
  {
    sportType: 'BADMINTON',
    title: 'Badminton',
    subtitle: '1 courts · Indoor Stadium',
    tag: 'Indoor',
    icon: 'tennisball-outline',
  },
  {
    sportType: 'BASKETBALL',
    title: 'Basketball',
    subtitle: '1 courts · Main Sports Complex',
    tag: 'Outdoor',
    icon: 'basketball-outline',
  },
  {
    sportType: 'PICKLEBALL',
    title: 'Pickleball',
    subtitle: '2 courts · NMIT Pickleball Courts',
    tag: 'Outdoor',
    icon: 'tennisball',
  },
  {
    sportType: 'TABLE_TENNIS',
    title: 'Table Tennis',
    subtitle: '1 courts · Indoor Stadium',
    tag: 'Indoor',
    icon: 'disc-outline',
  },
];

interface ChooseSportModalProps {
  visible: boolean;
  onClose: () => void;
  token?: string;
  tenantId?: string;
  onBookingSuccess: (booking: SportsBooking) => void;
  initialSport?: SportType | null;
}

export function ChooseSportModal({
  visible,
  onClose,
  token,
  tenantId,
  onBookingSuccess,
  initialSport,
}: ChooseSportModalProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Indoor' | 'Outdoor'>('All');

  // Slot booking sheet state
  const [activeFacility, setActiveFacility] = useState<SportsFacility | null>(null);
  const [selectedSportType, setSelectedSportType] = useState<SportType | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [isOpenGame, setIsOpenGame] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Teammates selection during booking
  const [selectedTeammates, setSelectedTeammates] = useState<SearchUser[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<SearchUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Generate next 5 calendar dates
  const availableDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      list.push({ dateStr, label });
    }
    return list;
  }, []);

  // Fetch facilities
  const loadFacilities = async () => {
    try {
      setLoading(true);
      const list = await fetchSportsFacilitiesApi(token, tenantId, {
        venueType: selectedFilter === 'All' ? undefined : selectedFilter.toUpperCase(),
        search: search.trim() || undefined,
      });
      setFacilities(list);
    } catch (e) {
      console.warn('Error loading facilities', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadFacilities();
    }
  }, [visible, selectedFilter, search]);

  // Handle initialSport auto-selection
  useEffect(() => {
    if (visible && initialSport) {
      setSelectedSportType(initialSport);
      const match = facilities.find((f) => f.sportType === initialSport);
      if (match) {
        setActiveFacility(match);
      }
    } else if (!visible) {
      setActiveFacility(null);
      setSelectedSportType(null);
    }
  }, [visible, initialSport, facilities]);

  // Filter 4 sports matching Screenshot 5
  const filteredSports = useMemo(() => {
    return CAMPUS_SPORTS_LIST.filter((item) => {
      if (selectedFilter !== 'All' && item.tag !== selectedFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedFilter, search]);

  const handleSelectSportCard = (sport: SportCardItem) => {
    setSelectedSportType(sport.sportType);
    const matchingFacility =
      facilities.find((f) => f.sportType === sport.sportType) || facilities[0];
    if (matchingFacility) {
      setActiveFacility(matchingFacility);
    }
  };

  const availableCourtsForSport = useMemo(() => {
    if (!selectedSportType) return [];
    return facilities.filter((f) => f.sportType === selectedSportType);
  }, [facilities, selectedSportType]);

  // Fetch slots whenever activeFacility or selectedDate changes
  useEffect(() => {
    if (!activeFacility) return;
    (async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        setSelectedTeammates([]);
        setShowUserPicker(false);
        const res = await fetchSlotAvailabilityApi(token, tenantId, activeFacility.id, selectedDate);
        setSlots(res.slots);
      } catch (e) {
        console.warn('Error loading slots', e);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [activeFacility, selectedDate]);

  const handleSearchTeammates = async (query: string) => {
    setUserSearchQuery(query);
    if (!token) return;
    try {
      setIsSearchingUsers(true);
      const res = await searchUsersApi(token, tenantId || 'nmit', query);
      const filtered = res.filter(
        (u) => !selectedTeammates.some((t) => t.userId === u.userId),
      );
      setUserSearchResults(filtered);
    } catch (e) {
      console.warn('Error searching teammates:', e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddTeammate = (user: SearchUser) => {
    const maxTeammates = (activeFacility?.maxPlayers || 4) - 1;
    if (selectedTeammates.length >= maxTeammates) {
      Alert.alert('Roster Full', `Maximum players for this court is ${activeFacility?.maxPlayers}.`);
      return;
    }
    setSelectedTeammates([...selectedTeammates, user]);
    setUserSearchResults(userSearchResults.filter((u) => u.userId !== user.userId));
  };

  const handleRemoveTeammate = (userId: string) => {
    setSelectedTeammates(selectedTeammates.filter((u) => u.userId !== userId));
  };

  const handleConfirmBooking = async () => {
    if (!activeFacility || !selectedSlot || !token) {
      Alert.alert('Selection Required', 'Please select a bookable time slot.');
      return;
    }

    try {
      setBookingInProgress(true);
      const newBooking = await createSportsBookingApi(token, tenantId || 'nmit', {
        facilityId: activeFacility.id,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        isOpenGame,
        maxPlayers: activeFacility.maxPlayers || 4,
        teammates: selectedTeammates.map((t) => ({
          userId: t.userId,
          userName: t.fullName,
          userUsn: t.usn,
        })),
      });

      setActiveFacility(null);
      setSelectedTeammates([]);
      onClose();
      onBookingSuccess(newBooking);
    } catch (err: any) {
      Alert.alert('Booking Error', err?.message || 'Could not confirm court booking.');
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <StatusBar style="light" />

        {/* Top Bar matching Screenshot 5 */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Choose a Sport</Text>
        </View>

        <Text style={styles.topSubtitle}>Pick a game. Find a court. Get playing.</Text>

        {/* Search Bar matching Screenshot 5 */}
        <View style={styles.searchBarBox}>
          <Ionicons name="search-outline" size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sports, venues"
            placeholderTextColor={Colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.text.secondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills matching Screenshot 5 */}
        <View style={styles.filterRow}>
          {(['All', 'Indoor', 'Outdoor'] as const).map((filter) => {
            const active = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sports List matching Screenshot 5 */}
        {filteredSports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching sports</Text>
            <Text style={styles.emptyBody}>
              Try another search or change your filter.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.facilityList}
          >
            {filteredSports.map((sport) => (
              <Pressable
                key={sport.sportType}
                onPress={() => handleSelectSportCard(sport)}
                style={styles.sportItemCard}
              >
                <View style={styles.sportItemIconCircle}>
                  <Ionicons name={sport.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.sportItemMeta}>
                  <Text style={styles.sportItemTitle}>{sport.title}</Text>
                  <Text style={styles.sportItemSubtitle}>{sport.subtitle}</Text>
                  <Text style={styles.sportItemTag}>{sport.tag}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Slot Selection Modal Drawer */}
        {activeFacility && (
          <Modal
            visible={Boolean(activeFacility)}
            transparent
            animationType="slide"
            onRequestClose={() => setActiveFacility(null)}
          >
            <Pressable style={styles.drawerOverlay} onPress={() => setActiveFacility(null)}>
              <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
                <View style={styles.drawerHandle} />
                <View style={styles.drawerHeader}>
                  <View>
                    <Text style={styles.drawerCourtTitle}>{activeFacility.name}</Text>
                    <Text style={styles.drawerCourtSubtitle}>
                      {activeFacility.venueType} · {activeFacility.location}
                    </Text>
                  </View>
                  <Pressable onPress={() => setActiveFacility(null)} style={styles.drawerCloseBtn}>
                    <Ionicons name="close" size={20} color={Colors.text.secondary} />
                  </Pressable>
                </View>

                {/* Multiple Courts Switcher (e.g. Pickleball Court 1 vs Court 2) */}
                {availableCourtsForSport.length > 1 && (
                  <View style={styles.courtChipsRow}>
                    {availableCourtsForSport.map((court) => {
                      const isCourtActive = activeFacility.id === court.id;
                      return (
                        <Pressable
                          key={court.id}
                          onPress={() => setActiveFacility(court)}
                          style={[styles.courtChip, isCourtActive && styles.courtChipActive]}
                        >
                          <Text
                            style={[
                              styles.courtChipText,
                              isCourtActive && styles.courtChipTextActive,
                            ]}
                          >
                            {court.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Date Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateStrip}
                >
                  {availableDates.map((item) => {
                    const active = selectedDate === item.dateStr;
                    return (
                      <Pressable
                        key={item.dateStr}
                        onPress={() => setSelectedDate(item.dateStr)}
                        style={[styles.dateChip, active && styles.dateChipActive]}
                      >
                        <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.dateChipSub,
                            active && styles.dateChipSubActive,
                          ]}
                        >
                          {item.dateStr.slice(5)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Time Slots Grid */}
                <Text style={styles.sectionHeading}>Available Time Slots (60 min)</Text>
                {loadingSlots ? (
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <ActivityIndicator
                      size="small"
                      color={isDark ? '#38BDF8' : Colors.primary.main}
                    />
                  </View>
                ) : (
                  <ScrollView style={styles.slotsScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.slotsGrid}>
                      {slots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        const isAvailable = slot.status === 'AVAILABLE';
                        return (
                          <Pressable
                            key={slot.startTime}
                            disabled={!isAvailable}
                            onPress={() => setSelectedSlot(slot)}
                            style={[
                              styles.slotBox,
                              isAvailable && styles.slotBoxAvailable,
                              isSelected && styles.slotBoxSelected,
                              !isAvailable && styles.slotBoxUnavailable,
                            ]}
                          >
                            <Text
                              style={[
                                styles.slotTimeText,
                                isSelected && styles.slotTimeTextSelected,
                                !isAvailable && styles.slotTimeTextMuted,
                              ]}
                            >
                              {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                            </Text>
                            <Text
                              style={[
                                styles.slotStatusSub,
                                isSelected && styles.slotStatusSubSelected,
                              ]}
                            >
                              {slot.status === 'AVAILABLE'
                                ? 'Available'
                                : slot.status === 'BOOKED'
                                ? 'Booked'
                                : 'Closed'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* Select Teammates Section */}
                <View style={styles.teammatesSection}>
                  <View style={styles.teammatesSectionHeader}>
                    <Text style={styles.sectionHeading}>
                      Add Teammates ({1 + selectedTeammates.length}/{activeFacility.maxPlayers})
                    </Text>
                    {1 + selectedTeammates.length < (activeFacility.maxPlayers || 4) && (
                      <Pressable
                        onPress={() => {
                          const next = !showUserPicker;
                          setShowUserPicker(next);
                          if (next && userSearchResults.length === 0) {
                            handleSearchTeammates('');
                          }
                        }}
                        style={styles.addTeammateBtn}
                      >
                        <Ionicons
                          name={showUserPicker ? 'chevron-up' : 'person-add-outline'}
                          size={14}
                          color={isDark ? '#38BDF8' : Colors.primary.main}
                        />
                        <Text style={styles.addTeammateBtnText}>
                          {showUserPicker ? 'Close' : '+ Add'}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Selected Teammate Chips */}
                  <View style={styles.teammateChipsWrap}>
                    <View style={styles.hostChip}>
                      <Ionicons name="star" size={11} color="#FBBF24" />
                      <Text style={styles.hostChipText}>You (Host)</Text>
                    </View>
                    {selectedTeammates.map((tm) => (
                      <View key={tm.userId} style={styles.teammateChip}>
                        <Text style={styles.teammateChipName} numberOfLines={1}>
                          {tm.fullName}
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveTeammate(tm.userId)}
                          hitSlop={8}
                          style={styles.removeTeammateBtn}
                        >
                          <Ionicons name="close-circle" size={14} color={Colors.text.tertiary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Inline Teammate Search & Picker */}
                  {showUserPicker && (
                    <View style={styles.userPickerBox}>
                      <View style={styles.pickerSearchInputRow}>
                        <Ionicons name="search" size={15} color={Colors.text.tertiary} />
                        <TextInput
                          style={styles.pickerSearchInput}
                          placeholder="Search students by name or USN..."
                          placeholderTextColor={Colors.text.tertiary}
                          value={userSearchQuery}
                          onChangeText={handleSearchTeammates}
                        />
                        {isSearchingUsers && (
                          <ActivityIndicator
                            size="small"
                            color={isDark ? '#38BDF8' : Colors.primary.main}
                          />
                        )}
                      </View>

                      <ScrollView style={styles.userPickerList} nestedScrollEnabled>
                        {userSearchResults.slice(0, 5).map((u) => (
                          <View key={u.userId} style={styles.userPickerItem}>
                            <View style={styles.userPickerAvatar}>
                              <Text style={styles.userPickerAvatarText}>
                                {u.initials || u.fullName.slice(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.userPickerMeta}>
                              <Text style={styles.userPickerName}>{u.fullName}</Text>
                              <Text style={styles.userPickerSub}>
                                {u.usn || u.role || 'Student'}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => handleAddTeammate(u)}
                              style={styles.pickUserBtn}
                            >
                              <Text style={styles.pickUserBtnText}>+ Add</Text>
                            </Pressable>
                          </View>
                        ))}
                        {!isSearchingUsers && userSearchResults.length === 0 && (
                          <Text style={styles.noStudentsFoundText}>
                            {userSearchQuery ? 'No matching students found' : 'Type to search students'}
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Open Game Toggle */}
                <View style={styles.openGameToggleRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.openGameLabel}>Invite campus players</Text>
                    <Text style={styles.openGameDesc}>
                      List in Open Games so campus students can join your match
                    </Text>
                  </View>
                  <Switch
                    value={isOpenGame}
                    onValueChange={setIsOpenGame}
                    trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: Colors.primary.main }}
                    thumbColor={isOpenGame ? (isDark ? '#38BDF8' : '#FFFFFF') : '#94A3B8'}
                  />
                </View>

                {/* CTA Confirm Button */}
                <Pressable
                  disabled={!selectedSlot || bookingInProgress}
                  onPress={handleConfirmBooking}
                  style={[
                    styles.confirmBookingBtn,
                    (!selectedSlot || bookingInProgress) && styles.confirmBookingBtnDisabled,
                  ]}
                >
                  {bookingInProgress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.confirmBookingBtnText}>
                        {selectedSlot
                          ? `Book Slot (${selectedSlot.startTime.slice(0, 5)})`
                          : 'Select a Time Slot'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Modal>
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
      marginBottom: 8,
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
    topSubtitle: {
      fontSize: 14,
      color: Colors.text.secondary,
      marginBottom: 18,
      paddingHorizontal: 6,
    },
    searchBarBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      paddingHorizontal: 14,
      height: 48,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      color: Colors.text.primary,
      fontSize: 14,
      marginLeft: 10,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    filterChip: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? Colors.primary.accent : Colors.primary.main,
    },
    filterChipText: {
      color: Colors.text.secondary,
      fontSize: 13,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    centerBox: {
      paddingTop: 60,
      alignItems: 'center',
    },
    emptyCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 24,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginTop: 10,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    emptyBody: {
      fontSize: 13,
      color: Colors.text.secondary,
      lineHeight: 18,
    },
    facilityList: {
      paddingBottom: 30,
      gap: 12,
    },
    sportItemCard: {
      backgroundColor: isDark ? '#1F2636' : Colors.background.surface,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#2B364A' : Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    sportItemIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#0D9488',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    sportItemMeta: {
      flex: 1,
    },
    sportItemTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    sportItemSubtitle: {
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    sportItemTag: {
      fontSize: 12,
      fontWeight: '700',
      color: '#34D399',
      marginTop: 3,
    },
    courtChipsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
      marginTop: 4,
    },
    courtChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E293B' : 'rgba(37, 99, 235, 0.08)',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : 'rgba(37, 99, 235, 0.2)',
    },
    courtChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? Colors.primary.accent : Colors.primary.main,
    },
    courtChipText: {
      color: Colors.text.secondary,
      fontSize: 12,
      fontWeight: '600',
    },
    courtChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    drawerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
    },
    drawerContent: {
      backgroundColor: Colors.background.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      maxHeight: '85%',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    drawerHandle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? '#334155' : '#CBD5E1',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 14,
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    drawerCourtTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    drawerCourtSubtitle: {
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    drawerCloseBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E293B' : 'rgba(15, 23, 42, 0.06)',
    },
    dateStrip: {
      gap: 10,
      paddingBottom: 14,
    },
    dateChip: {
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.04)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      minWidth: 80,
    },
    dateChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? Colors.primary.accent : Colors.primary.main,
    },
    dateChipText: {
      color: Colors.text.secondary,
      fontSize: 12,
      fontWeight: '700',
    },
    dateChipTextActive: {
      color: '#FFFFFF',
    },
    dateChipSub: {
      color: Colors.text.tertiary,
      fontSize: 10,
      marginTop: 2,
    },
    dateChipSubActive: {
      color: '#BFDBFE',
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.secondary,
      marginBottom: 10,
    },
    slotsScroll: {
      maxHeight: 180,
      marginBottom: 14,
    },
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    slotBox: {
      width: '48%',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    slotBoxAvailable: {
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      borderColor: Colors.border.subtle,
    },
    slotBoxSelected: {
      backgroundColor: isDark ? '#1D4ED8' : Colors.primary.main,
      borderColor: isDark ? '#60A5FA' : Colors.primary.main,
    },
    slotBoxUnavailable: {
      backgroundColor: isDark ? '#0B0F19' : 'rgba(15, 23, 42, 0.02)',
      borderColor: Colors.border.subtle,
      opacity: 0.4,
    },
    slotTimeText: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    slotTimeTextSelected: {
      color: '#FFFFFF',
    },
    slotTimeTextMuted: {
      color: Colors.text.tertiary,
    },
    slotStatusSub: {
      fontSize: 10,
      color: '#10B981',
      marginTop: 2,
    },
    slotStatusSubSelected: {
      color: '#BFDBFE',
    },
    teammatesSection: {
      marginBottom: 14,
    },
    teammatesSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    addTeammateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1E293B' : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    addTeammateBtnText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 12,
      fontWeight: '700',
    },
    teammateChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    hostChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#4338CA' : '#C7D2FE',
    },
    hostChipText: {
      color: isDark ? '#E0E7FF' : '#1E1B4B',
      fontSize: 12,
      fontWeight: '700',
    },
    teammateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.04)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      maxWidth: 140,
    },
    teammateChipName: {
      color: Colors.text.primary,
      fontSize: 12,
      fontWeight: '600',
      flexShrink: 1,
    },
    removeTeammateBtn: {
      padding: 2,
    },
    userPickerBox: {
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      borderRadius: 14,
      padding: 10,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 12,
    },
    pickerSearchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 40,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 8,
    },
    pickerSearchInput: {
      flex: 1,
      color: Colors.text.primary,
      fontSize: 13,
      marginLeft: 8,
    },
    userPickerList: {
      maxHeight: 140,
    },
    userPickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
    },
    userPickerAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : 'rgba(37, 99, 235, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    userPickerAvatarText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 10,
      fontWeight: '700',
    },
    userPickerMeta: {
      flex: 1,
    },
    userPickerName: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.text.primary,
    },
    userPickerSub: {
      fontSize: 11,
      color: Colors.text.tertiary,
    },
    pickUserBtn: {
      backgroundColor: Colors.primary.main,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    pickUserBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    noStudentsFoundText: {
      fontSize: 12,
      color: Colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: 12,
    },
    openGameToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.03)',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 16,
    },
    openGameLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    openGameDesc: {
      fontSize: 11,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    confirmBookingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.primary.main,
      paddingVertical: 14,
      borderRadius: 16,
    },
    confirmBookingBtnDisabled: {
      backgroundColor: isDark ? '#1E293B' : '#94A3B8',
      opacity: 0.6,
    },
    confirmBookingBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
  });
}
