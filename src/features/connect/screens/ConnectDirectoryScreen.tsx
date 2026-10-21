import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { profilePhotoUri } from '@/features/profile/api/profile-api';
import { useAuthSession } from '@/features/auth';
import { ConnectMember, DirectoryRole } from '../types/connect-types';
import { fetchMembersApi, fetchMyConnectionsApi } from '../api/connect-api';

interface ConnectDirectoryScreenProps {
  token: string;
  tenantId: string;
  onBack: () => void;
  onViewMemberProfile: (member: ConnectMember) => void;
}

const ROLES: DirectoryRole[] = ['Alumni', 'Students', 'Faculty', 'Connections'];
const BATCHES = ['All batches', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '1996'];

export function ConnectDirectoryScreen({
  token,
  tenantId,
  onBack,
  onViewMemberProfile,
}: ConnectDirectoryScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState<DirectoryRole>('Alumni');
  const [selectedBatch, setSelectedBatch] = useState('All batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<ConnectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthSession();
  const currentUserId = user?.id || '';

  const loadMembers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (selectedRole === 'Connections') {
        const conns = await fetchMyConnectionsApi(token, tenantId);
        const nonSelfConns = currentUserId
          ? conns.filter((m) => m.userId !== currentUserId)
          : conns;
        const filtered = searchQuery.trim()
          ? nonSelfConns.filter(
              (m) =>
                m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase())),
            )
          : nonSelfConns;
        setMembers(filtered);
      } else {
        const data = await fetchMembersApi(token, tenantId, {
          role: selectedRole,
          batch: selectedBatch === 'All batches' ? undefined : selectedBatch,
          query: searchQuery.trim() || undefined,
        });
        const filtered = currentUserId
          ? data.filter((m) => m.userId !== currentUserId)
          : data;
        setMembers(filtered);
      }
    } catch (err) {
      console.warn('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, selectedRole, selectedBatch, searchQuery, currentUserId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const searchPlaceholder = useMemo(() => {
    if (selectedRole === 'Alumni') return 'Search alumni by name';
    if (selectedRole === 'Faculty') return 'Search faculty by name';
    if (selectedRole === 'Connections') return 'Search connections';
    return 'Search students by name';
  }, [selectedRole]);

  const renderMemberCard = ({ item }: { item: ConnectMember }) => {
    const photoUri = profilePhotoUri(item.photoKey ?? null);
    return (
      <View style={styles.memberCard}>
        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image
              source={{
                uri: photoUri,
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Tenant-Id': tenantId,
                },
              }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.avatarInitial}>{item.initials}</Text>
          )}
        </View>

        <Text style={styles.memberName} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={styles.memberRole}>{item.role}</Text>
        {item.batch ? <Text style={styles.memberBatch}>{item.batch}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => onViewMemberProfile(item)}
          style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.btnPressed]}>
          <Text style={styles.viewProfileText}>View profile</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={10}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F8FAFC' : Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Discover Campus</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={renderMemberCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* 1. Community Banner Card matching Image 2 */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerIconWrap}>
                <Ionicons name="people" size={22} color="#E9D5FF" />
              </View>
              <Text style={styles.bannerTitle}>Find your community</Text>
              <Text style={styles.bannerSub}>Explore and join campus clubs.</Text>
            </View>

            {/* 2. Search Input matching Image 2 & 3 */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={isDark ? '#94A3B8' : Colors.text.secondary} style={{ marginRight: 10 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={isDark ? '#64748B' : Colors.text.secondary}
                autoCorrect={false}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={isDark ? '#94A3B8' : Colors.text.secondary} />
                </Pressable>
              ) : null}
            </View>

            {/* 3. Role Filters Chips matching Image 2 & 3 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {ROLES.map((role) => {
                const isActive = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={[
                      styles.roleChip,
                      isActive ? styles.roleChipActive : styles.roleChipInactive,
                    ]}>
                    <Ionicons
                      name={
                        role === 'Alumni'
                          ? 'school'
                          : role === 'Students'
                            ? 'people'
                            : role === 'Faculty'
                              ? 'person-circle'
                              : 'person-add'
                      }
                      size={16}
                      color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : Colors.text.secondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        isActive ? styles.roleChipTextActive : styles.roleChipTextInactive,
                      ]}>
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 4. Batch Selector Chips matching Image 2 & 3 */}
            <Text style={styles.batchLabel}>{selectedRole} batch</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {BATCHES.map((batch) => {
                const isActive = selectedBatch === batch;
                return (
                  <Pressable
                    key={batch}
                    onPress={() => setSelectedBatch(batch)}
                    style={[
                      styles.batchChip,
                      isActive ? styles.batchChipActive : styles.batchChipInactive,
                    ]}>
                    <Text
                      style={[
                        styles.batchChipText,
                        isActive ? styles.batchChipTextActive : styles.batchChipTextInactive,
                      ]}>
                      {batch}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 5. Results Title matching Image 2 & 3 */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Discover {selectedRole.toLowerCase()}</Text>
              <Text style={styles.resultsCount}>
                {loading ? 'Searching...' : `${members.length} ${members.length === 1 ? 'person' : 'people'}`}
              </Text>
            </View>

            {loading && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={Colors.primary.main} />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={44} color={Colors.text.tertiary} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No {selectedRole.toLowerCase()} found</Text>
              <Text style={styles.emptySub}>Try adjusting your search query or batch filter.</Text>
            </View>
          ) : null
        }
      />
    </View>
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
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 110,
    },

    // 1. Community Banner
    bannerCard: {
      backgroundColor: isDark ? '#1A1842' : Colors.primary.main,
      borderRadius: 22,
      padding: 16,
      marginTop: 8,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.25)',
      maxWidth: '75%',
    },
    bannerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    bannerTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: Colors.text.onBrand,
      marginBottom: 2,
    },
    bannerSub: {
      fontFamily: Typography.regular,
      fontSize: 12.5,
      color: isDark ? Colors.text.onBrandMuted : '#E2E8F0',
    },

    // 2. Search Bar
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.input,
      borderRadius: 18,
      borderWidth: 1.2,
      borderColor: Colors.border.card,
      paddingHorizontal: 16,
      height: 52,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.regular,
      fontSize: 15,
      color: Colors.text.primary,
    },

    // 3. Role & Batch Chips
    chipsRow: {
      gap: 10,
      paddingBottom: 6,
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
    },
    roleChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : Colors.primary.light,
    },
    roleChipInactive: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
    },
    roleChipText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
    },
    roleChipTextActive: {
      color: Colors.text.onBrand,
    },
    roleChipTextInactive: {
      color: Colors.text.secondary,
    },

    batchLabel: {
      fontFamily: Typography.bold,
      fontSize: 14.5,
      color: Colors.text.primary,
      marginTop: 16,
      marginBottom: 10,
    },
    batchChip: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
    },
    batchChipActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : Colors.primary.light,
    },
    batchChipInactive: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
    },
    batchChipText: {
      fontFamily: Typography.medium,
      fontSize: 13.5,
    },
    batchChipTextActive: {
      color: Colors.text.onBrand,
    },
    batchChipTextInactive: {
      color: Colors.text.secondary,
    },

    // 4. Results Header
    resultsHeader: {
      marginTop: 22,
      marginBottom: 14,
    },
    resultsTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    resultsCount: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      color: Colors.text.secondary,
      marginTop: 3,
    },

    // 5. Member Card matching Image 2 & 3
    memberCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      marginBottom: 14,
      maxWidth: 240,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 8,
      elevation: isDark ? 0 : 2,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.22)' : Colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 32,
    },
    avatarInitial: {
      fontFamily: Typography.bold,
      fontSize: 24,
      color: Colors.text.onBrand,
    },
    memberName: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: Colors.text.primary,
      marginBottom: 3,
      textAlign: 'center',
    },
    memberRole: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 2,
    },
    memberBatch: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.text.primary,
      marginBottom: 14,
    },
    viewProfileBtn: {
      backgroundColor: Colors.primary.main,
      borderRadius: 20,
      paddingHorizontal: 22,
      paddingVertical: 10,
      width: '100%',
      alignItems: 'center',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.2)',
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowRadius: 6,
      elevation: 3,
    },
    viewProfileText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.onBrand,
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },

    centerBox: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyBox: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: Colors.text.primary,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
    },
  });
}
