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
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

import { fetchOpenGamesApi, joinGameByCodeApi } from '../../sports-api';
import { SportsBooking } from '../../sports-types';

interface FindPlayersModalProps {
  visible: boolean;
  onClose: () => void;
  token?: string;
  tenantId?: string;
  onJoinSuccess: (booking: SportsBooking) => void;
}

export function FindPlayersModal({
  visible,
  onClose,
  token,
  tenantId,
  onJoinSuccess,
}: FindPlayersModalProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  const [inviteCode, setInviteCode] = useState('');
  const [openGames, setOpenGames] = useState<SportsBooking[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [joiningCode, setJoiningCode] = useState(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  const loadOpenGames = async () => {
    try {
      setLoadingGames(true);
      const list = await fetchOpenGamesApi(token, tenantId);
      setOpenGames(list);
    } catch (e) {
      console.warn('Error loading open games', e);
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadOpenGames();
    }
  }, [visible]);

  const handleJoinWithCode = async (codeToJoin?: string) => {
    const code = (codeToJoin || inviteCode).trim().toUpperCase();
    if (!code) {
      Alert.alert('Invitation Code Required', 'Please enter a valid 6-digit invitation code.');
      return;
    }
    if (!token) {
      Alert.alert('Authentication Required', 'Please log in to join campus games.');
      return;
    }

    try {
      setJoiningCode(true);
      const booking = await joinGameByCodeApi(token, tenantId || 'nmit', code);
      setInviteCode('');
      onClose();
      onJoinSuccess(booking);
    } catch (err: any) {
      Alert.alert('Could Not Join Game', err?.message || 'Invalid or expired invitation code.');
    } finally {
      setJoiningCode(false);
      setJoiningGameId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <StatusBar style="light" />
        {/* Top Bar matching Screenshot 3 */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Find players</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Header */}
          <Text style={styles.heroTitle}>Good players. Better people.</Text>
          <Text style={styles.heroSubtitle}>
            Join a campus game or use an invitation from a friend. Your place is confirmed only
            when the server accepts it.
          </Text>

          {/* Invitation Code Section */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Invitation code"
              placeholderTextColor={Colors.text.tertiary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
          </View>

          <Pressable
            disabled={joiningCode || !inviteCode.trim()}
            onPress={() => handleJoinWithCode()}
            style={[
              styles.joinCodeBtn,
              (!inviteCode.trim() || joiningCode) && styles.joinCodeBtnDisabled,
            ]}
          >
            {joiningCode ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.joinCodeBtnText}>Join with code</Text>
            )}
          </Pressable>

          {/* Section: Open Games */}
          <Text style={styles.sectionHeader}>Open games</Text>

          {loadingGames ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator
                size="large"
                color={isDark ? '#38BDF8' : Colors.primary.main}
              />
            </View>
          ) : openGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>Be the first to bring people together</Text>
              <Text style={styles.emptyCardBody}>
                Book a court and turn on 'Invite campus players'.
              </Text>
            </View>
          ) : (
            <View style={styles.gamesList}>
              {openGames.map((game) => {
                const spotsRemaining = Math.max(0, game.maxPlayers - game.currentPlayersCount);
                const isJoiningThis = joiningGameId === game.id;
                return (
                  <View key={game.id} style={styles.gameCard}>
                    <View style={styles.gameHeaderRow}>
                      <View style={styles.gameHeaderLeft}>
                        <Text style={styles.gameCourtTitle}>
                          {game.facilityName || 'Campus Court'}
                        </Text>
                        <Text style={styles.gameTimeSubtitle}>
                          {game.bookingDate} · {game.startTime?.slice(0, 5)} -{' '}
                          {game.endTime?.slice(0, 5)}
                        </Text>
                      </View>
                      <View style={styles.spotsBadge}>
                        <Ionicons
                          name="people"
                          size={12}
                          color={isDark ? '#38BDF8' : Colors.primary.main}
                        />
                        <Text style={styles.spotsBadgeText}>
                          {game.currentPlayersCount} / {game.maxPlayers}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.hostRow}>
                      <Text style={styles.hostText}>
                        Hosted by <Text style={{ color: Colors.text.primary }}>{game.userName}</Text>
                      </Text>
                      <Text style={styles.spotsLeftText}>{spotsRemaining} spot(s) left</Text>
                    </View>

                    {game.notes ? (
                      <Text style={styles.gameNotes} numberOfLines={2}>
                        "{game.notes}"
                      </Text>
                    ) : null}

                    <Pressable
                      disabled={isJoiningThis || spotsRemaining <= 0}
                      onPress={() => {
                        setJoiningGameId(game.id);
                        handleJoinWithCode(game.inviteCode);
                      }}
                      style={styles.joinGameActionBtn}
                    >
                      {isJoiningThis ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.joinGameActionBtnText}>Join Game</Text>
                          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                        </>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
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
      marginBottom: 16,
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
    scrollContent: {
      paddingBottom: 40,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: Colors.text.primary,
      lineHeight: 32,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 14,
      color: Colors.text.secondary,
      lineHeight: 20,
      marginBottom: 24,
    },
    inputContainer: {
      backgroundColor: Colors.background.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      paddingHorizontal: 16,
      height: 52,
      justifyContent: 'center',
      marginBottom: 14,
    },
    input: {
      color: Colors.text.primary,
      fontSize: 15,
    },
    joinCodeBtn: {
      backgroundColor: isDark ? '#1E293B' : Colors.primary.main,
      borderRadius: 14,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    joinCodeBtnDisabled: {
      opacity: 0.5,
    },
    joinCodeBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    sectionHeader: {
      fontSize: 20,
      fontWeight: '800',
      color: Colors.text.primary,
      marginBottom: 14,
    },
    emptyCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 22,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    emptyCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 6,
    },
    emptyCardBody: {
      fontSize: 13,
      color: Colors.text.secondary,
      lineHeight: 18,
    },
    gamesList: {
      gap: 12,
    },
    gameCard: {
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
    gameHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gameHeaderLeft: {
      flex: 1,
      marginRight: 10,
    },
    gameCourtTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    gameTimeSubtitle: {
      fontSize: 12,
      color: Colors.text.secondary,
      marginTop: 2,
    },
    spotsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    spotsBadgeText: {
      color: isDark ? '#38BDF8' : Colors.primary.main,
      fontSize: 11,
      fontWeight: '700',
    },
    hostRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    hostText: {
      fontSize: 12,
      color: Colors.text.tertiary,
    },
    spotsLeftText: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '600',
    },
    gameNotes: {
      fontSize: 12,
      color: Colors.text.secondary,
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.04)',
      padding: 8,
      borderRadius: 8,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    joinGameActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: Colors.primary.main,
      paddingVertical: 10,
      borderRadius: 12,
    },
    joinGameActionBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
