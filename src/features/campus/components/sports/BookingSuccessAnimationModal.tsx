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

  // Motion Values
  const ballTranslateX = useRef(new Animated.Value(-90)).current;
  const ballTranslateY = useRef(new Animated.Value(110)).current;
  const ballScale = useRef(new Animated.Value(0.9)).current;
  const ballRotate = useRef(new Animated.Value(0)).current;
  const netWiggle = useRef(new Animated.Value(1)).current;
  const racquetRotate = useRef(new Animated.Value(-30)).current;

  // Table tennis table bounce second phase
  const pingPongBounceAnim = useRef(new Animated.Value(0)).current;

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

    // Reset all animation values
    ballTranslateX.setValue(-90);
    ballTranslateY.setValue(110);
    ballScale.setValue(0.9);
    ballRotate.setValue(0);
    netWiggle.setValue(1);
    racquetRotate.setValue(-30);
    pingPongBounceAnim.setValue(0);
    impactScale.setValue(0);
    impactOpacity.setValue(0);
    confettiAnim.setValue(0);
    textSlideAnim.setValue(30);
    textOpacityAnim.setValue(0);
    cardScaleAnim.setValue(0.85);

    // Card pop-in spring
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const triggerBurstAndText = () => {
      Animated.parallel([
        Animated.timing(impactScale, {
          toValue: 2,
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
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    };

    if (sportType === 'BASKETBALL') {
      // 🏀 BASKETBALL: HIGH ARC SHOT & CLEAN SWISH THROUGH HOOP
      Animated.sequence([
        // Arc up to apex
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: -15,
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: -45,
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballRotate, {
            toValue: 1,
            duration: 520,
            useNativeDriver: true,
          }),
        ]),
        // Swish down through orange rim & net
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 24,
            duration: 340,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 38,
            duration: 340,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 0.72,
            duration: 340,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Net wiggle wobble
        Animated.sequence([
          Animated.timing(netWiggle, { toValue: 1.5, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 0.8, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1.15, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start();
        triggerBurstAndText();
      });
    } else if (sportType === 'BADMINTON') {
      // 🏸 BADMINTON: RACQUET POWER SMASH & FEATHERED SHUTTLECOCK METEOR SMASH
      Animated.sequence([
        // Racquet backswing windup
        Animated.timing(racquetRotate, {
          toValue: -60,
          duration: 220,
          useNativeDriver: true,
        }),
        // Explosive forward smash strike + high speed shuttlecock flight
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 25,
            duration: 160,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateX, {
            toValue: 80,
            duration: 380,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: -25,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        triggerBurstAndText();
      });
    } else if (sportType === 'PICKLEBALL') {
      // 🏓 PICKLEBALL: SIGNATURE TOP-SPIN GROUNDSTROKE & WIFFLE BALL BOUNCE OVER NET
      Animated.sequence([
        // Paddle backswing
        Animated.timing(racquetRotate, {
          toValue: -40,
          duration: 200,
          useNativeDriver: true,
        }),
        // Paddle drives through ball
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 20,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Ball dips into court bounce
          Animated.timing(ballTranslateX, {
            toValue: -10,
            duration: 250,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 50, // Bounces off court
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballRotate, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // Ball bounces UP and CLEARS the low pickleball net to the backline
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 75,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 15,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        triggerBurstAndText();
      });
    } else {
      // 🏓 TABLE TENNIS: DUAL BOUNCE RALLY ACROSS AUTHENTIC BLUE PING PONG TABLE
      Animated.sequence([
        // 1. Forehand loop windup
        Animated.timing(racquetRotate, {
          toValue: -45,
          duration: 180,
          useNativeDriver: true,
        }),
        // 2. Forehand strike -> Ball bounces on home side
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 20,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateX, {
            toValue: -35,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 42, // Table surface bounce 1
            duration: 220,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // 3. Ball leaps over center ping pong net and bounces on opponent side
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 65,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 35, // Table surface bounce 2
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 0.75,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        triggerBurstAndText();
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
        return 'DINK & SMASH! 🏓';
      case 'TABLE_TENNIS':
        return 'PING PONG ACE! 🏓';
      default:
        return 'GAME ON! 🏆';
    }
  };

  const getCelebrationSubtitle = () => {
    switch (sportType) {
      case 'BASKETBALL':
        return `${booking.facilityName || 'Basketball Arena'} Booked!`;
      case 'BADMINTON':
        return `${booking.facilityName || 'Badminton Court'} Booked!`;
      case 'PICKLEBALL':
        return `${booking.facilityName || 'Pickleball Court'} Booked!`;
      case 'TABLE_TENNIS':
        return `${booking.facilityName || 'Table Tennis Arena'} Booked!`;
      default:
        return `${booking.facilityName || 'Court'} Booked!`;
    }
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
                outputRange: [0, Math.cos(rad) * 105],
              });
              const ty = confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(rad) * 105],
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

          {/* Sports Specific Animation Arena */}
          <View style={styles.arenaContainer}>
            {sportType === 'BASKETBALL' ? (
              /* 🏀 1. BASKETBALL ARENA (Glass Backboard, Orange Rim, Wiggling Net, Flying Basketball) */
              <View style={styles.basketballStage}>
                <View style={styles.courtFloorLine} />

                {/* Backboard & Shooter Box */}
                <View style={styles.backboard}>
                  <View style={styles.targetSquare} />
                </View>

                {/* Orange Rim */}
                <View style={styles.rimHolder}>
                  <View style={styles.orangeRim} />
                  {/* Wiggling Net */}
                  <Animated.View
                    style={[styles.basketballNet, { transform: [{ scaleY: netWiggle }] }]}
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

                {/* Swish Shockwave */}
                <Animated.View
                  style={[
                    styles.swishShockwave,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : sportType === 'BADMINTON' ? (
              /* 🏸 2. BADMINTON ARENA (Emerald Court, High Net, Racquet Smash, Feathered Shuttlecock) */
              <View style={styles.badmintonStage}>
                {/* Court Floor Line */}
                <View style={styles.badmintonFloor} />

                {/* Swinging Carbon Badminton Racquet */}
                <Animated.View
                  style={[
                    styles.badmintonRacquet,
                    {
                      transform: [
                        { translateX: -65 },
                        { translateY: 38 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [-60, 25],
                            outputRange: ['-60deg', '25deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.racquetHead}>
                    <View style={styles.racquetStringV} />
                    <View style={styles.racquetStringH} />
                  </View>
                  <View style={styles.racquetShaft} />
                  <View style={styles.racquetGrip} />
                </Animated.View>

                {/* High Regulation Badminton Net */}
                <View style={styles.badmintonHighNet}>
                  <View style={styles.badmintonNetTopTape} />
                  <View style={styles.badmintonNetMeshPattern} />
                  <View style={styles.badmintonNetPost} />
                </View>

                {/* Smashed Flying Shuttlecock with Feather Skirt & Cork Base */}
                <Animated.View
                  style={[
                    styles.shuttlecockWrap,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { rotate: '42deg' },
                      ],
                    },
                  ]}
                >
                  <View style={styles.shuttleFeathers} />
                  <View style={styles.shuttleRibbon} />
                  <View style={styles.shuttleCork} />
                </Animated.View>

                {/* Smash Speed Shockwave */}
                <Animated.View
                  style={[
                    styles.badmintonImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : sportType === 'PICKLEBALL' ? (
              /* 🏓 3. PICKLEBALL ARENA (Ocean Blue Court, Kitchen Line, Low 34" Net, Neon Lime Wiffle Ball) */
              <View style={styles.pickleballStage}>
                {/* Acrylic Court Line */}
                <View style={styles.pickleballCourtFloor}>
                  <View style={styles.pickleballKitchenLine} />
                </View>

                {/* Pickleball Paddle */}
                <Animated.View
                  style={[
                    styles.pickleballPaddleWrap,
                    {
                      transform: [
                        { translateX: -60 },
                        { translateY: 26 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [-40, 20],
                            outputRange: ['-35deg', '18deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.pickleballPaddleHead}>
                    <View style={styles.paddleEdgeGuard} />
                  </View>
                  <View style={styles.pickleballPaddleHandle} />
                </Animated.View>

                {/* Regulation 34-inch Center Net */}
                <View style={styles.pickleballNet}>
                  <View style={styles.pickleballNetTape} />
                  <View style={styles.pickleballNetCenterStrap} />
                </View>

                {/* Perforated Neon-Lime Wiffle Ball */}
                <Animated.View
                  style={[
                    styles.wiffleBall,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { rotate: spin },
                      ],
                    },
                  ]}
                >
                  <View style={styles.wiffleHole1} />
                  <View style={styles.wiffleHole2} />
                  <View style={styles.wiffleHole3} />
                  <View style={styles.wiffleHole4} />
                </Animated.View>

                {/* Bounce Shockwave */}
                <Animated.View
                  style={[
                    styles.pickleballImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : (
              /* 🏓 4. TABLE TENNIS ARENA (ITTF Blue Table, White Center Line, Red Ping Pong Bat, White Ball) */
              <View style={styles.tableTennisStage}>
                {/* Ping Pong Table Top */}
                <View style={styles.pingPongTable}>
                  <View style={styles.pingPongCenterLine} />
                  {/* Table Tennis Net */}
                  <View style={styles.pingPongNet}>
                    <View style={styles.pingPongNetTopWhite} />
                  </View>
                </View>

                {/* Red Ping Pong Paddle */}
                <Animated.View
                  style={[
                    styles.pingPongPaddleWrap,
                    {
                      transform: [
                        { translateX: -65 },
                        { translateY: 22 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [-45, 20],
                            outputRange: ['-45deg', '15deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.pingPongRubberRed} />
                  <View style={styles.pingPongWoodHandle} />
                </Animated.View>

                {/* White Celluloid Ball with Double Bounce */}
                <Animated.View
                  style={[
                    styles.pingPongBall,
                    {
                      transform: [
                        { translateX: ballTranslateX },
                        { translateY: ballTranslateY },
                        { scale: ballScale },
                      ],
                    },
                  ]}
                />

                {/* Ping Pong Strike Shockwave */}
                <Animated.View
                  style={[
                    styles.pingPongImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
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
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
    // 🏀 1. Basketball Styles
    basketballStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    courtFloorLine: {
      position: 'absolute',
      bottom: 15,
      left: 10,
      right: 10,
      height: 2,
      backgroundColor: 'rgba(234, 88, 12, 0.4)',
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

    // 🏸 2. Badminton Styles
    badmintonStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badmintonFloor: {
      position: 'absolute',
      bottom: 18,
      left: 15,
      right: 15,
      height: 4,
      backgroundColor: '#10B981',
      borderRadius: 2,
    },
    badmintonRacquet: {
      position: 'absolute',
      alignItems: 'center',
    },
    racquetHead: {
      width: 34,
      height: 42,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    racquetStringV: {
      position: 'absolute',
      width: 1,
      height: '80%',
      backgroundColor: '#93C5FD',
    },
    racquetStringH: {
      position: 'absolute',
      height: 1,
      width: '80%',
      backgroundColor: '#93C5FD',
    },
    racquetShaft: {
      width: 2.5,
      height: 36,
      backgroundColor: '#94A3B8',
    },
    racquetGrip: {
      width: 6,
      height: 18,
      backgroundColor: '#1E293B',
      borderRadius: 2,
    },
    badmintonHighNet: {
      position: 'absolute',
      right: 36,
      bottom: 18,
      width: 6,
      height: 100,
      backgroundColor: '#64748B',
      alignItems: 'center',
    },
    badmintonNetTopTape: {
      width: 14,
      height: 8,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
    },
    badmintonNetMeshPattern: {
      width: 4,
      height: 70,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginTop: 2,
    },
    badmintonNetPost: {
      position: 'absolute',
      bottom: 0,
      width: 10,
      height: 6,
      backgroundColor: '#334155',
    },
    shuttlecockWrap: {
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
      borderTopWidth: 22,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#FFFFFF',
    },
    shuttleRibbon: {
      width: 14,
      height: 3,
      backgroundColor: '#38BDF8',
      marginTop: -4,
    },
    shuttleCork: {
      width: 13,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#94A3B8',
    },
    badmintonImpactShock: {
      position: 'absolute',
      right: 28,
      top: 55,
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#38BDF8',
    },

    // 🏓 3. Pickleball Styles
    pickleballStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickleballCourtFloor: {
      position: 'absolute',
      bottom: 20,
      left: 10,
      right: 10,
      height: 5,
      backgroundColor: '#0284C7',
      borderRadius: 2,
    },
    pickleballKitchenLine: {
      position: 'absolute',
      left: 50,
      right: 50,
      height: 2,
      backgroundColor: '#FFFFFF',
      top: 1,
    },
    pickleballPaddleWrap: {
      position: 'absolute',
      alignItems: 'center',
    },
    pickleballPaddleHead: {
      width: 38,
      height: 46,
      borderRadius: 12,
      backgroundColor: '#0F766E',
      borderWidth: 2,
      borderColor: '#14B8A6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paddleEdgeGuard: {
      width: 32,
      height: 40,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: '#0D9488',
    },
    pickleballPaddleHandle: {
      width: 7,
      height: 22,
      backgroundColor: '#D97706',
      borderRadius: 2,
    },
    pickleballNet: {
      position: 'absolute',
      right: 32,
      bottom: 20,
      width: 5,
      height: 60,
      backgroundColor: '#475569',
      alignItems: 'center',
    },
    pickleballNetTape: {
      width: 12,
      height: 6,
      backgroundColor: '#FFFFFF',
    },
    pickleballNetCenterStrap: {
      width: 2,
      height: 54,
      backgroundColor: '#94A3B8',
    },
    wiffleBall: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#A3E635',
      borderWidth: 1.5,
      borderColor: '#65A30D',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#A3E635',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 3,
    },
    wiffleHole1: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
      top: 5,
      left: 6,
    },
    wiffleHole2: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
      top: 6,
      right: 6,
    },
    wiffleHole3: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
      bottom: 5,
      left: 7,
    },
    wiffleHole4: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
      bottom: 5,
      right: 7,
    },
    pickleballImpactShock: {
      position: 'absolute',
      right: 26,
      top: 80,
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 2,
      borderColor: '#84CC16',
    },

    // 🏓 4. Table Tennis Styles
    tableTennisStage: {
      width: 240,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pingPongTable: {
      position: 'absolute',
      bottom: 30,
      width: 210,
      height: 12,
      backgroundColor: '#1E40AF',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      borderRadius: 2,
      alignItems: 'center',
    },
    pingPongCenterLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: '#FFFFFF',
    },
    pingPongNet: {
      position: 'absolute',
      top: -26,
      width: 4,
      height: 26,
      backgroundColor: '#1E293B',
      alignItems: 'center',
    },
    pingPongNetTopWhite: {
      width: 10,
      height: 4,
      backgroundColor: '#FFFFFF',
    },
    pingPongPaddleWrap: {
      position: 'absolute',
      alignItems: 'center',
    },
    pingPongRubberRed: {
      width: 36,
      height: 40,
      borderRadius: 18,
      backgroundColor: '#DC2626',
      borderWidth: 2,
      borderColor: '#B91C1C',
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
    },
    pingPongWoodHandle: {
      width: 7,
      height: 20,
      backgroundColor: '#B45309',
      borderRadius: 2,
    },
    pingPongBall: {
      position: 'absolute',
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#CBD5E1',
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
      elevation: 2,
    },
    pingPongImpactShock: {
      position: 'absolute',
      right: 38,
      top: 75,
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#38BDF8',
    },

    // Text & Actions
    textContainer: {
      alignItems: 'center',
      width: '100%',
    },
    celebrationTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: Colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    celebrationSubtitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : Colors.primary.main,
      marginTop: 4,
      textAlign: 'center',
    },
    bookingBadgeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      marginBottom: 16,
    },
    badgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? '#111827' : 'rgba(15, 23, 42, 0.05)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    badgeItemText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    proceedButton: {
      width: '100%',
      backgroundColor: Colors.primary.main,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
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
