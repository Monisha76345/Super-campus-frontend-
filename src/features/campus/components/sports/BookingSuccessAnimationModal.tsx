import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

import { SportsBooking, SportType } from '../../sports-types';

interface BookingSuccessAnimationModalProps {
  visible: boolean;
  booking: SportsBooking | null;
  onProceedToPass: () => void;
}

export function BookingSuccessAnimationModal({
  visible,
  booking,
  onProceedToPass,
}: BookingSuccessAnimationModalProps) {
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

  // Shared Animation Values
  const ballTranslateX = useRef(new Animated.Value(-90)).current;
  const ballTranslateY = useRef(new Animated.Value(110)).current;
  const ballScale = useRef(new Animated.Value(0.9)).current;
  const ballRotate = useRef(new Animated.Value(0)).current;
  const netWiggle = useRef(new Animated.Value(1)).current;
  const racquetRotate = useRef(new Animated.Value(-30)).current;

  // Impact & Confetti
  const impactScale = useRef(new Animated.Value(0)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.85)).current;

  const sportType: SportType = (booking?.sportType as SportType) || 'BASKETBALL';

  useEffect(() => {
    if (!visible) return;

    // Reset values
    ballTranslateX.setValue(-90);
    ballTranslateY.setValue(110);
    ballScale.setValue(0.9);
    ballRotate.setValue(0);
    netWiggle.setValue(1);
    racquetRotate.setValue(-30);
    impactScale.setValue(0);
    impactOpacity.setValue(0);
    confettiAnim.setValue(0);
    textSlideAnim.setValue(30);
    textOpacityAnim.setValue(0);
    cardScaleAnim.setValue(0.85);

    // Initial card pop-in
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    if (sportType === 'BASKETBALL') {
      // 🏀 BASKETBALL SHOOT & SWISH SEQUENCE
      Animated.sequence([
        // 1. Arc up to peak (x: -20, y: -45)
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: -15,
            duration: 550,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: -40,
            duration: 550,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballRotate, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
        // 2. Swish down through hoop into basket (x: 24, y: 38)
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 24,
            duration: 350,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 38,
            duration: 350,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 0.72,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // 3. Net wiggles & sparkles burst
        Animated.parallel([
          Animated.sequence([
            Animated.timing(netWiggle, {
              toValue: 1.45,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.timing(netWiggle, {
              toValue: 0.85,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.timing(netWiggle, {
              toValue: 1,
              duration: 120,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(impactScale, {
            toValue: 1.8,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(impactOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.timing(impactOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });

        // 4. Text reveal
        Animated.parallel([
          Animated.timing(textSlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // 🏸 BADMINTON / 🏓 PICKLEBALL / TABLE TENNIS SMASH & HIT SEQUENCE
      Animated.sequence([
        // Racquet windup
        Animated.timing(racquetRotate, {
          toValue: -50,
          duration: 250,
          useNativeDriver: true,
        }),
        // Fast smash forward + strike
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 20,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateX, {
            toValue: 70,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: -20,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Burst & text
        Animated.parallel([
          Animated.timing(impactScale, {
            toValue: 2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(impactOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(textSlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.timing(impactOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      });
    }
  }, [visible, sportType]);

  if (!booking) return null;

  const spin = ballRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getCelebrationTitle = () => {
    switch (sportType) {
      case 'BASKETBALL':
        return 'SWISH! 🏀';
      case 'BADMINTON':
        return 'SMASH! 🏸';
      case 'PICKLEBALL':
        return 'ACE! 🏓';
      case 'TABLE_TENNIS':
        return 'GAME ON! 🏓';
      default:
        return 'GAME ON! 🏆';
    }
  };

  const getCelebrationSubtitle = () => {
    return `${booking.facilityName || 'Court'} Booked!`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onProceedToPass}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalCard, { transform: [{ scale: cardScaleAnim }] }]}>
          {/* Confetti & Particle Sparks */}
          <View style={styles.confettiContainer} pointerEvents="none">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const tx = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(rad) * 95],
              });
              const ty = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(rad) * 95],
              });
              const opacity = confettiAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 1, 0],
              });
              const colors = ['#F59E0B', '#38BDF8', '#10B981', '#A78BFA', '#EF4444'];
              const particleColor = colors[idx % colors.length];

              return (
                <Animated.View
                  key={angle}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: particleColor,
                      opacity,
                      transform: [{ translateX: tx }, { translateY: ty }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Sports Animation Arena */}
          <View style={styles.arenaContainer}>
            {sportType === 'BASKETBALL' ? (
              // 🏀 BASKETBALL ARENA (Hoop, Backboard, Swishing Ball)
              <View style={styles.basketballStage}>
                {/* Backboard & Target */}
                <View style={styles.backboard}>
                  <View style={styles.targetSquare} />
                </View>

                {/* Orange Rim */}
                <View style={styles.rimHolder}>
                  <View style={styles.orangeRim} />
                  {/* Wiggling Net */}
                  <Animated.View
                    style={[
                      styles.basketballNet,
                      { transform: [{ scaleY: netWiggle }] },
                    ]}
                  >
                    <View style={styles.netLineLeft} />
                    <View style={styles.netLineRight} />
                    <View style={styles.netMeshRow} />
                  </Animated.View>
                </View>

                {/* Flying & Spinning Basketball */}
                <Animated.View
                  style={[
                    styles.basketballBall,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { scale: ballScale },
                        { rotate: spin },
                      ],
                    },
                  ]}
                >
                  <View style={styles.ballSeamHorizontal} />
                  <View style={styles.ballSeamVertical} />
                </Animated.View>

                {/* Swish Impact Shockwave */}
                <Animated.View
                  style={[
                    styles.swishShockwave,
                    {
                      opacity: impactOpacity,
                      transform: [{ scale: impactScale }],
                    },
                  ]}
                />
              </View>
            ) : sportType === 'BADMINTON' ? (
              // 🏸 BADMINTON SMASH ARENA
              <View style={styles.badmintonStage}>
                {/* Swinging Racquet */}
                <Animated.View
                  style={[
                    styles.badmintonRacquet,
                    {
                      transform: [
                        { translateX: -60 },
                        { translateY: 40 },
                        { rotate: racquetRotate.interpolate({
                            inputRange: [-50, 20],
                            outputRange: ['-50deg', '20deg'],
                          })
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.racquetHead} />
                  <View style={styles.racquetShaft} />
                  <View style={styles.racquetGrip} />
                </Animated.View>

                {/* Smashed Flying Shuttlecock */}
                <Animated.View
                  style={[
                    styles.shuttlecock,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { rotate: '45deg' },
                      ],
                    },
                  ]}
                >
                  <View style={styles.shuttleFeathers} />
                  <View style={styles.shuttleCork} />
                </Animated.View>

                {/* Court Net */}
                <View style={styles.badmintonNet}>
                  <View style={styles.netWhiteTape} />
                </View>
              </View>
            ) : (
              // 🏓 PICKLEBALL / TABLE TENNIS ARENA
              <View style={styles.pickleballStage}>
                {/* Paddle */}
                <Animated.View
                  style={[
                    styles.paddleWrapper,
                    {
                      transform: [
                        { translateX: -50 },
                        { translateY: 30 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [-50, 20],
                            outputRange: ['-40deg', '15deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.paddleHead} />
                  <View style={styles.paddleHandle} />
                </Animated.View>

                {/* Neon Wiffle Ball */}
                <Animated.View
                  style={[
                    styles.pickleballBall,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { rotate: spin },
                      ],
                    },
                  ]}
                >
                  <View style={styles.wiffleDot1} />
                  <View style={styles.wiffleDot2} />
                </Animated.View>

                {/* Table / Court Net */}
                <View style={styles.miniNetLine} />
              </View>
            )}
          </View>

          {/* Animated Celebration Text */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacityAnim,
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <Text style={styles.celebrationTitle}>{getCelebrationTitle()}</Text>
            <Text style={styles.celebrationSubtitle}>{getCelebrationSubtitle()}</Text>

            {/* Match Slot Chip */}
            <View style={styles.bookingBadgeRow}>
              <View style={styles.badgeItem}>
                <Ionicons name="calendar-outline" size={13} color="#38BDF8" />
                <Text style={styles.badgeItemText}>{booking.bookingDate}</Text>
              </View>
              <View style={styles.badgeItem}>
                <Ionicons name="time-outline" size={13} color="#A78BFA" />
                <Text style={styles.badgeItemText}>
                  {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                </Text>
              </View>
            </View>

            {/* CTA Button to Court Pass */}
            <Pressable onPress={onProceedToPass} style={styles.proceedButton}>
              <Text style={styles.proceedButtonText}>View Gate Pass</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: Colors.background.surface,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: isDark ? '#312E81' : Colors.border.subtle,
      padding: 24,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.6 : 0.2,
      shadowRadius: 20,
      elevation: 8,
    },
    confettiContainer: {
      position: 'absolute',
      top: 110,
      left: '50%',
      width: 0,
      height: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    particle: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    arenaContainer: {
      width: '100%',
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    // 🏀 Basketball Styles
    basketballStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backboard: {
      position: 'absolute',
      right: 20,
      top: 16,
      width: 58,
      height: 48,
      borderRadius: 6,
      borderWidth: 2.5,
      borderColor: '#94A3B8',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    targetSquare: {
      width: 26,
      height: 22,
      borderWidth: 2,
      borderColor: '#EF4444',
      borderRadius: 2,
    },
    rimHolder: {
      position: 'absolute',
      right: 54,
      top: 48,
      alignItems: 'center',
    },
    orangeRim: {
      width: 38,
      height: 6,
      backgroundColor: '#EA580C',
      borderRadius: 3,
    },
    basketballNet: {
      width: 30,
      height: 38,
      borderLeftWidth: 1.5,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
      borderColor: '#E2E8F0',
      borderStyle: 'dashed',
      marginTop: -1,
      alignItems: 'center',
    },
    netLineLeft: {
      position: 'absolute',
      left: 6,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: '#CBD5E1',
    },
    netLineRight: {
      position: 'absolute',
      right: 6,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: '#CBD5E1',
    },
    netMeshRow: {
      position: 'absolute',
      left: 2,
      right: 2,
      top: 16,
      height: 1,
      backgroundColor: '#CBD5E1',
    },
    basketballBall: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#EA580C',
      position: 'absolute',
      borderWidth: 1.5,
      borderColor: '#9A3412',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 4,
    },
    ballSeamHorizontal: {
      position: 'absolute',
      width: '100%',
      height: 1.5,
      backgroundColor: '#1E293B',
    },
    ballSeamVertical: {
      position: 'absolute',
      height: '100%',
      width: 1.5,
      backgroundColor: '#1E293B',
    },
    swishShockwave: {
      position: 'absolute',
      right: 48,
      top: 46,
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#F59E0B',
    },
    // 🏸 Badminton Styles
    badmintonStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badmintonRacquet: {
      position: 'absolute',
      alignItems: 'center',
    },
    racquetHead: {
      width: 32,
      height: 40,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
    },
    racquetShaft: {
      width: 2,
      height: 34,
      backgroundColor: '#94A3B8',
    },
    racquetGrip: {
      width: 6,
      height: 16,
      backgroundColor: '#1E293B',
      borderRadius: 2,
    },
    shuttlecock: {
      position: 'absolute',
      alignItems: 'center',
    },
    shuttleFeathers: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderTopWidth: 20,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#FFFFFF',
    },
    shuttleCork: {
      width: 12,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#E2E8F0',
      borderWidth: 1,
      borderColor: '#94A3B8',
      marginTop: -2,
    },
    badmintonNet: {
      position: 'absolute',
      right: 30,
      width: 4,
      height: 90,
      backgroundColor: '#64748B',
    },
    netWhiteTape: {
      width: 8,
      height: 8,
      backgroundColor: '#FFFFFF',
      marginLeft: -2,
    },
    // 🏓 Pickleball / Table Tennis Styles
    pickleballStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paddleWrapper: {
      position: 'absolute',
      alignItems: 'center',
    },
    paddleHead: {
      width: 36,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#0D9488',
      borderWidth: 2,
      borderColor: '#14B8A6',
    },
    paddleHandle: {
      width: 6,
      height: 22,
      backgroundColor: '#D97706',
      borderRadius: 2,
    },
    pickleballBall: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#84CC16',
      borderWidth: 1,
      borderColor: '#65A30D',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wiffleDot1: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
    },
    wiffleDot2: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: '#4D7C0F',
      marginTop: 2,
    },
    miniNetLine: {
      position: 'absolute',
      right: 35,
      width: 3,
      height: 70,
      backgroundColor: '#94A3B8',
    },
    // Text & Actions
    textContainer: {
      alignItems: 'center',
      width: '100%',
    },
    celebrationTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: Colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    celebrationSubtitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#A78BFA' : Colors.primary.main,
      marginTop: 4,
      marginBottom: 16,
      textAlign: 'center',
    },
    bookingBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.04)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 20,
    },
    badgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    badgeItemText: {
      color: Colors.text.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    proceedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.primary.main,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 16,
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    proceedButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
