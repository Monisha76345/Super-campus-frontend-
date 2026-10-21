import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import {
  CampusClub,
  CampusEvent,
  CampusOpportunity,
  ConnectTab,
} from '../types/connect-types';
import {
  fetchClubsApi,
  fetchEventsApi,
  fetchOpportunitiesApi,
} from '../api/connect-api';

interface ConnectFeedScreenProps {
  campusName: string;
  initialTab?: ConnectTab;
  token: string;
  tenantId: string;
  onBack: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateOpportunity: (type: 'INTERNSHIP' | 'JOB') => void;
}

const TABS: { key: ConnectTab; label: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'internships', label: 'Internships' },
  { key: 'jobs', label: 'Jobs' },
];

export function ConnectFeedScreen({
  campusName,
  initialTab = 'events',
  token,
  tenantId,
  onBack,
  onOpenCreateEvent,
  onOpenCreateOpportunity,
}: ConnectFeedScreenProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ConnectTab>(initialTab);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [clubs, setClubs] = useState<CampusClub[]>([]);
  const [opportunities, setOpportunities] = useState<CampusOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const data = await fetchEventsApi(token, tenantId);
        setEvents(data);
      } else if (activeTab === 'clubs') {
        const data = await fetchClubsApi(token, tenantId);
        setClubs(data);
      } else if (activeTab === 'internships') {
        const data = await fetchOpportunitiesApi(token, tenantId, 'INTERNSHIP');
        setOpportunities(data);
      } else if (activeTab === 'jobs') {
        const data = await fetchOpportunitiesApi(token, tenantId, 'JOB');
        setOpportunities(data);
      }
    } catch (err) {
      console.warn('Failed to load feed data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, token, tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderEventItem = ({ item }: { item: CampusEvent }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Ionicons name="calendar" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.eventBadgeText}>{item.formattedDate}</Text>
        </View>
        <Text style={styles.timeBadgeText}>{item.formattedTime}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <View style={styles.cardFooterRow}>
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={15} color={isDark ? '#94A3B8' : Colors.text.secondary} />
          <Text style={styles.venueText}>{item.venue}</Text>
        </View>
        {item.capacity ? (
          <Text style={styles.capacityText}>Cap: {item.capacity} seats</Text>
        ) : null}
      </View>
    </View>
  );

  const renderClubItem = ({ item }: { item: CampusClub }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>{item.category}</Text>
        </View>
        <Text style={styles.memberCountText}>{item.memberCount} members</Text>
      </View>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  );

  const renderOpportunityItem = ({ item }: { item: CampusOpportunity }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>{item.type}</Text>
        </View>
        <Text style={styles.companyText}>{item.company}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <View style={styles.cardFooterRow}>
        <View style={styles.venueRow}>
          <Ionicons name="business-outline" size={15} color={Colors.text.secondary} />
          <Text style={styles.venueText}>{item.location}</Text>
        </View>
        {item.stipendOrSalary ? (
          <Text style={styles.stipendText}>{item.stipendOrSalary}</Text>
        ) : null}
      </View>
    </View>
  );

  const currentList = useMemo(() => {
    if (activeTab === 'events') return events;
    if (activeTab === 'clubs') return clubs;
    return opportunities;
  }, [activeTab, events, clubs, opportunities]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* 1. Header Navigation: "← Back to Connect" */}
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        hitSlop={8}
        style={styles.backRow}>
        <Ionicons name="arrow-back" size={18} color={isDark ? Colors.primary.cyan : Colors.primary.main} style={{ marginRight: 6 }} />
        <Text style={styles.backText}>Back to Connect</Text>
      </Pressable>

      {/* 2. Main Title matching Image 4: "NMIT Connect / Find your community. Build your future." */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{campusName} Connect</Text>
        <Text style={styles.mainSubtitle}>Find your community. Build your future.</Text>
      </View>

      {/* 3. Segmented Filter Tabs matching Image 4: Events, Clubs, Internships, Jobs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabPill,
                isActive ? styles.tabPillActive : styles.tabPillInactive,
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  isActive ? styles.tabPillTextActive : styles.tabPillTextInactive,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4. Action Row matching Screenshots 1 & 3 */}
      <View style={styles.actionRow}>
        {activeTab !== 'clubs' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (activeTab === 'events') {
                onOpenCreateEvent();
              } else if (activeTab === 'internships') {
                onOpenCreateOpportunity('INTERNSHIP');
              } else if (activeTab === 'jobs') {
                onOpenCreateOpportunity('JOB');
              }
            }}
            style={({ pressed }) => [styles.postEventBtn, pressed && styles.btnPressed]}>
            <Text style={styles.postEventText}>
              {activeTab === 'events'
                ? 'Post event'
                : activeTab === 'internships'
                  ? 'Post internship'
                  : 'Post job'}
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={handleManualRefresh}
          hitSlop={8}
          style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {/* 5. Content Feed / Empty State matching Image 4 */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={currentList as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (activeTab === 'events') return renderEventItem({ item: item as CampusEvent });
            if (activeTab === 'clubs') return renderClubItem({ item: item as CampusClub });
            return renderOpportunityItem({ item: item as CampusOpportunity });
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              tintColor={Colors.primary.main}
              colors={[Colors.primary.main]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab} yet. Published campus listings will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
      paddingHorizontal: 16,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 6,
    },
    backText: {
      fontFamily: Typography.semiBold,
      fontSize: 14.5,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    titleSection: {
      marginBottom: 16,
    },
    mainTitle: {
      fontFamily: Typography.bold,
      fontSize: 28,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    mainSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.secondary,
      marginTop: 4,
    },

    // Tabs
    tabsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    tabPill: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 18,
      borderWidth: 1,
    },
    tabPillActive: {
      backgroundColor: Colors.primary.main,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : Colors.primary.light,
    },
    tabPillInactive: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
    },
    tabPillText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
    },
    tabPillTextActive: {
      color: Colors.text.onBrand,
    },
    tabPillTextInactive: {
      color: Colors.text.secondary,
    },

    // Action Row
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 20,
    },
    postEventBtn: {
      backgroundColor: Colors.primary.main,
      borderRadius: 22,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(49, 52, 145, 0.2)',
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    postEventText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      color: Colors.text.onBrand,
    },
    refreshBtn: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    refreshText: {
      fontFamily: Typography.semiBold,
      fontSize: 14.5,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },

    // Feed list & cards
    listContent: {
      paddingBottom: 110,
      gap: 12,
    },
    card: {
      backgroundColor: Colors.background.surface,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: isDark ? 0 : 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(49, 52, 145, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    eventBadgeText: {
      fontFamily: Typography.semiBold,
      fontSize: 12,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    timeBadgeText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    companyText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
    },
    memberCountText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    cardTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: Colors.text.primary,
      marginBottom: 6,
    },
    cardDescription: {
      fontFamily: Typography.regular,
      fontSize: 13.5,
      lineHeight: 19,
      color: Colors.text.secondary,
      marginBottom: 10,
    },
    cardFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: Colors.border.subtle,
      paddingTop: 10,
    },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    venueText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.secondary,
    },
    capacityText: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    stipendText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: Colors.status.success,
    },

    // Empty state
    emptyContainer: {
      paddingVertical: 20,
    },
    emptyText: {
      fontFamily: Typography.regular,
      fontSize: 14.5,
      color: Colors.text.secondary,
      lineHeight: 22,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
