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

  // Impact & Confetti
  const impactScale = useRef(new Animated.Value(0)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.85)).current;

  // Dynamic Sport Detection - NEVER defaults to BASKETBALL for other sports
  const sportType: SportType = useMemo(() => {
    if (!booking) return 'BADMINTON';
    const raw = (booking.sportType || '').toString().toUpperCase();
    if (raw.includes('BASKET')) return 'BASKETBALL';
    if (raw.includes('BADMINTON')) return 'BADMINTON';
    if (raw.includes('FOOTBALL') || raw.includes('SOCCER')) return 'FOOTBALL';
    if (raw.includes('PICKLE')) return 'PICKLEBALL';
    if (raw.includes('TABLE') || raw.includes('PING')) return 'TABLE_TENNIS';
    if (raw.includes('TENNIS')) return 'TENNIS';
    if (raw.includes('CRICKET')) return 'CRICKET';

    // Inspect facilityName if sportType wasn't explicit
    const fn = (booking.facilityName || '').toLowerCase();
    if (fn.includes('basket')) return 'BASKETBALL';
    if (fn.includes('badminton')) return 'BADMINTON';
    if (fn.includes('football') || fn.includes('turf') || fn.includes('soccer')) return 'FOOTBALL';
    if (fn.includes('pickle')) return 'PICKLEBALL';
    if (fn.includes('table') || fn.includes('ping') || fn.includes('tt')) return 'TABLE_TENNIS';
    if (fn.includes('tennis')) return 'TENNIS';

    return (raw as SportType) || 'BADMINTON';
  }, [booking]);

  useEffect(() => {
    if (!visible) return;

    // Reset all animation values
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
        Animated.sequence([
          Animated.timing(netWiggle, { toValue: 1.5, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 0.8, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1.15, duration: 110, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start();
        triggerBurstAndText();
      });
    } else if (sportType === 'BADMINTON') {
      // 🏸 BADMINTON: RACQUET POWER SMASH & FEATHERED SHUTTLECOCK FLIGHT
      Animated.sequence([
        Animated.timing(racquetRotate, {
          toValue: -60,
          duration: 220,
          useNativeDriver: true,
        }),
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
    } else if (sportType === 'FOOTBALL') {
      // ⚽ FOOTBALL: KICK ARC, SPINNING SOCCER BALL & TOP-CORNER NET BULGE
      Animated.sequence([
        Animated.timing(racquetRotate, {
          toValue: 35,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 65,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: -18,
            duration: 440,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballRotate, {
            toValue: 2,
            duration: 440,
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 0.78,
            duration: 440,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(netWiggle, { toValue: 1.45, duration: 90, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 0.85, duration: 90, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1.15, duration: 90, useNativeDriver: true }),
          Animated.timing(netWiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        ]).start();
        triggerBurstAndText();
      });
    } else if (sportType === 'PICKLEBALL') {
      // 🏓 PICKLEBALL: SIGNATURE VOLLEY & WIFFLE BALL OVER 34" NET
      Animated.sequence([
        Animated.timing(racquetRotate, {
          toValue: -40,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 20,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateX, {
            toValue: -10,
            duration: 250,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 50,
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
    } else if (sportType === 'TENNIS') {
      // 🎾 TENNIS: POWER ACE SERVE & OPTIC-YELLOW FELT BALL BOUNCE
      Animated.sequence([
        Animated.timing(racquetRotate, {
          toValue: -55,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(racquetRotate, {
            toValue: 30,
            duration: 170,
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
            toValue: 28,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(ballRotate, {
            toValue: 1.5,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        triggerBurstAndText();
      });
    } else {
      // 🏓 TABLE TENNIS: DUAL BOUNCE RALLY ACROSS ITTF BLUE TABLE
      Animated.sequence([
        Animated.timing(racquetRotate, {
          toValue: -45,
          duration: 180,
          useNativeDriver: true,
        }),
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
            toValue: 42,
            duration: 220,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ballTranslateX, {
            toValue: 65,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(ballTranslateY, {
            toValue: 35,
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
      case 'FOOTBALL':
        return 'GOAL! ⚽';
      case 'PICKLEBALL':
        return 'DINK & SMASH! 🏓';
      case 'TENNIS':
        return 'ACE! 🎾';
      case 'TABLE_TENNIS':
        return 'PING PONG ACE! 🏓';
      default:
        return 'BOOKED! 🏆';
    }
  };

  const getCelebrationSubtitle = () => {
    const facilityOrSport =
      booking.facilityName ||
      (sportType === 'BASKETBALL'
        ? 'Basketball Arena'
        : sportType === 'BADMINTON'
        ? 'Badminton Court'
        : sportType === 'FOOTBALL'
        ? 'Football Turf'
        : sportType === 'PICKLEBALL'
        ? 'Pickleball Court'
        : sportType === 'TENNIS'
        ? 'Tennis Court'
        : sportType === 'TABLE_TENNIS'
        ? 'Table Tennis Arena'
        : 'Court');
    return `${facilityOrSport} Booked Successfully!`;
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
                <View style={styles.backboard}>
                  <View style={styles.targetSquare} />
                </View>
                <View style={styles.rimHolder}>
                  <View style={styles.orangeRim} />
                  <Animated.View
                    style={[styles.basketballNet, { transform: [{ scaleY: netWiggle }] }]}
                  >
                    <View style={styles.netLineLeft} />
                    <View style={styles.netLineRight} />
                    <View style={styles.netMeshRow} />
                  </Animated.View>
                </View>
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
                <View style={styles.badmintonFloor} />
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
                <View style={styles.badmintonHighNet}>
                  <View style={styles.badmintonNetTopTape} />
                  <View style={styles.badmintonNetMeshPattern} />
                  <View style={styles.badmintonNetPost} />
                </View>
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
                <Animated.View
                  style={[
                    styles.badmintonImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : sportType === 'FOOTBALL' ? (
              /* ⚽ 3. FOOTBALL ARENA (Emerald Turf, Goal Post, Wiggling Net, Spinning 3D Soccer Ball) */
              <View style={styles.footballStage}>
                <View style={styles.footballTurfFloor} />
                <View style={styles.goalPostWrap}>
                  <View style={styles.goalCrossbar} />
                  <View style={styles.goalLeftPost} />
                  <Animated.View
                    style={[styles.goalNetMesh, { transform: [{ scaleX: netWiggle }] }]}
                  >
                    <View style={styles.goalNetRow1} />
                    <View style={styles.goalNetRow2} />
                  </Animated.View>
                </View>
                {/* Boot strike wedge */}
                <Animated.View
                  style={[
                    styles.footballBootWrap,
                    {
                      transform: [
                        { translateX: -70 },
                        { translateY: 48 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [0, 35],
                            outputRange: ['0deg', '35deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="football" size={20} color="#10B981" />
                </Animated.View>
                {/* Spinning Soccer Ball */}
                <Animated.View
                  style={[
                    styles.soccerBall,
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
                  <View style={styles.soccerPentagonCenter} />
                  <View style={styles.soccerPentagonTop} />
                  <View style={styles.soccerPentagonBottom} />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.footballImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : sportType === 'PICKLEBALL' ? (
              /* 🏓 4. PICKLEBALL ARENA (Ocean Blue Court, Kitchen Line, Low 34" Net, Neon Wiffle Ball) */
              <View style={styles.pickleballStage}>
                <View style={styles.pickleballCourtFloor}>
                  <View style={styles.pickleballKitchenLine} />
                </View>
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
                <View style={styles.pickleballNet}>
                  <View style={styles.pickleballNetTape} />
                  <View style={styles.pickleballNetCenterStrap} />
                </View>
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
                <Animated.View
                  style={[
                    styles.pickleballImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : sportType === 'TENNIS' ? (
              /* 🎾 5. TENNIS ARENA (Championship Hardcourt, Tennis Net, Racket Serve, Optic-Yellow Ball) */
              <View style={styles.tennisStage}>
                <View style={styles.tennisCourtFloor}>
                  <View style={styles.tennisBaseline} />
                </View>
                <Animated.View
                  style={[
                    styles.tennisRacketWrap,
                    {
                      transform: [
                        { translateX: -65 },
                        { translateY: 30 },
                        {
                          rotate: racquetRotate.interpolate({
                            inputRange: [-55, 30],
                            outputRange: ['-55deg', '30deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.tennisRacketHead}>
                    <View style={styles.tennisStringsV} />
                    <View style={styles.tennisStringsH} />
                  </View>
                  <View style={styles.tennisRacketShaft} />
                  <View style={styles.tennisRacketGrip} />
                </Animated.View>
                <View style={styles.tennisNetWrap}>
                  <View style={styles.tennisNetWhiteTop} />
                  <View style={styles.tennisNetMesh} />
                </View>
                <Animated.View
                  style={[
                    styles.tennisBall,
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
                  <View style={styles.tennisBallSeam1} />
                  <View style={styles.tennisBallSeam2} />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.tennisImpactShock,
                    { opacity: impactOpacity, transform: [{ scale: impactScale }] },
                  ]}
                />
              </View>
            ) : (
              /* 🏓 6. TABLE TENNIS ARENA (ITTF Blue Table, White Center Line, Red Paddle, White Ball) */
              <View style={styles.tableTennisStage}>
                <View style={styles.pingPongTable}>
                  <View style={styles.pingPongCenterLine} />
                  <View style={styles.pingPongNet}>
                    <View style={styles.pingPongNetTopWhite} />
                  </View>
                </View>
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
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },
    confettiContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
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
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      marginVertical: 10,
    },

    // 🏀 1. Basketball Stage
    basketballStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    courtFloorLine: {
      position: 'absolute',
      bottom: 12,
      left: 10,
      right: 10,
      height: 2,
      backgroundColor: 'rgba(249, 115, 22, 0.4)',
      borderRadius: 1,
    },
    backboard: {
      position: 'absolute',
      top: 15,
      right: 28,
      width: 58,
      height: 44,
      borderRadius: 4,
      borderWidth: 2.5,
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    targetSquare: {
      width: 26,
      height: 20,
      borderWidth: 1.5,
      borderColor: '#EF4444',
      borderRadius: 2,
    },
    rimHolder: {
      position: 'absolute',
      top: 48,
      right: 48,
      alignItems: 'center',
    },
    orangeRim: {
      width: 32,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F97316',
      borderWidth: 1,
      borderColor: '#EA580C',
      zIndex: 3,
    },
    basketballNet: {
      width: 26,
      height: 26,
      backgroundColor: 'transparent',
      borderLeftWidth: 1.5,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
      borderColor: '#FFFFFF',
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      opacity: 0.9,
      marginTop: -1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    netLineLeft: {
      position: 'absolute',
      top: 4,
      left: 6,
      width: 1,
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    netLineRight: {
      position: 'absolute',
      top: 4,
      right: 6,
      width: 1,
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    netMeshRow: {
      position: 'absolute',
      width: 18,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    basketballBall: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EA580C',
      borderWidth: 1.5,
      borderColor: '#9A3412',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 4,
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    },
    ballSeamHorizontal: {
      position: 'absolute',
      width: '100%',
      height: 1.5,
      backgroundColor: '#7C2D12',
    },
    ballSeamVertical: {
      position: 'absolute',
      width: 1.5,
      height: '100%',
      backgroundColor: '#7C2D12',
    },
    swishShockwave: {
      position: 'absolute',
      top: 40,
      right: 44,
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
    },

    // 🏸 2. Badminton Stage
    badmintonStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    badmintonFloor: {
      position: 'absolute',
      bottom: 12,
      left: 10,
      right: 10,
      height: 3,
      backgroundColor: '#10B981',
      borderRadius: 2,
    },
    badmintonRacquet: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 2,
    },
    racquetHead: {
      width: 24,
      height: 32,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    racquetStringV: {
      position: 'absolute',
      width: 1,
      height: 26,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    racquetStringH: {
      position: 'absolute',
      width: 18,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    racquetShaft: {
      width: 2,
      height: 28,
      backgroundColor: '#94A3B8',
    },
    racquetGrip: {
      width: 4,
      height: 12,
      borderRadius: 1,
      backgroundColor: '#F59E0B',
    },
    badmintonHighNet: {
      position: 'absolute',
      right: 40,
      bottom: 15,
      width: 32,
      height: 75,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
    },
    badmintonNetTopTape: {
      width: '100%',
      height: 4,
      backgroundColor: '#FFFFFF',
    },
    badmintonNetMeshPattern: {
      position: 'absolute',
      top: 15,
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    badmintonNetPost: {
      position: 'absolute',
      right: -2,
      bottom: 0,
      width: 3,
      height: 78,
      backgroundColor: '#64748B',
      borderRadius: 1,
    },
    shuttlecockWrap: {
      position: 'absolute',
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },
    shuttleFeathers: {
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 14,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#FFFFFF',
      opacity: 0.95,
    },
    shuttleRibbon: {
      width: 14,
      height: 2,
      backgroundColor: '#EF4444',
      marginTop: -1,
    },
    shuttleCork: {
      width: 10,
      height: 7,
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
      backgroundColor: '#FDE047',
    },
    badmintonImpactShock: {
      position: 'absolute',
      top: 25,
      right: 35,
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },

    // ⚽ 3. Football Stage
    footballStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    footballTurfFloor: {
      position: 'absolute',
      bottom: 12,
      left: 10,
      right: 10,
      height: 4,
      backgroundColor: '#10B981',
      borderRadius: 2,
    },
    goalPostWrap: {
      position: 'absolute',
      right: 20,
      bottom: 16,
      width: 48,
      height: 64,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    goalCrossbar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: '#FFFFFF',
    },
    goalLeftPost: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 3,
      backgroundColor: '#FFFFFF',
    },
    goalNetMesh: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-evenly',
      paddingHorizontal: 3,
    },
    goalNetRow1: {
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    goalNetRow2: {
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    footballBootWrap: {
      position: 'absolute',
      zIndex: 2,
    },
    soccerBall: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    soccerPentagonCenter: {
      width: 10,
      height: 10,
      backgroundColor: '#0F172A',
      borderRadius: 2,
    },
    soccerPentagonTop: {
      position: 'absolute',
      top: 2,
      width: 6,
      height: 6,
      backgroundColor: '#0F172A',
      borderRadius: 1,
    },
    soccerPentagonBottom: {
      position: 'absolute',
      bottom: 2,
      width: 6,
      height: 6,
      backgroundColor: '#0F172A',
      borderRadius: 1,
    },
    footballImpactShock: {
      position: 'absolute',
      top: 25,
      right: 32,
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },

    // 🏓 4. Pickleball Stage
    pickleballStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    pickleballCourtFloor: {
      position: 'absolute',
      bottom: 12,
      left: 10,
      right: 10,
      height: 4,
      backgroundColor: '#0284C7',
      borderRadius: 2,
      alignItems: 'center',
    },
    pickleballKitchenLine: {
      width: 60,
      height: 2,
      backgroundColor: '#FFFFFF',
    },
    pickleballPaddleWrap: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 2,
    },
    pickleballPaddleHead: {
      width: 28,
      height: 34,
      borderRadius: 6,
      backgroundColor: '#6366F1',
      borderWidth: 2,
      borderColor: '#4338CA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paddleEdgeGuard: {
      width: 24,
      height: 30,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    pickleballPaddleHandle: {
      width: 4,
      height: 16,
      backgroundColor: '#D97706',
      borderRadius: 1,
    },
    pickleballNet: {
      position: 'absolute',
      right: 48,
      bottom: 16,
      width: 24,
      height: 34,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
    },
    pickleballNetTape: {
      width: '100%',
      height: 3,
      backgroundColor: '#FFFFFF',
    },
    pickleballNetCenterStrap: {
      position: 'absolute',
      top: 3,
      width: 2,
      height: 28,
      backgroundColor: '#FFFFFF',
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
      zIndex: 5,
      shadowColor: '#84CC16',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    wiffleHole1: {
      position: 'absolute',
      top: 5,
      left: 7,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
    },
    wiffleHole2: {
      position: 'absolute',
      top: 5,
      right: 7,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
    },
    wiffleHole3: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
    },
    wiffleHole4: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4D7C0F',
    },
    pickleballImpactShock: {
      position: 'absolute',
      top: 35,
      right: 40,
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#A3E635',
      backgroundColor: 'rgba(163, 230, 53, 0.2)',
    },

    // 🎾 5. Tennis Stage
    tennisStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    tennisCourtFloor: {
      position: 'absolute',
      bottom: 12,
      left: 10,
      right: 10,
      height: 4,
      backgroundColor: '#1E3A8A',
      borderRadius: 2,
      alignItems: 'flex-end',
      paddingRight: 20,
    },
    tennisBaseline: {
      width: 40,
      height: 2,
      backgroundColor: '#FFFFFF',
    },
    tennisRacketWrap: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 2,
    },
    tennisRacketHead: {
      width: 26,
      height: 36,
      borderRadius: 13,
      borderWidth: 2.5,
      borderColor: '#E11D48',
      backgroundColor: 'rgba(225, 29, 72, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tennisStringsV: {
      position: 'absolute',
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    tennisStringsH: {
      position: 'absolute',
      width: 20,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    tennisRacketShaft: {
      width: 3,
      height: 22,
      backgroundColor: '#1E293B',
    },
    tennisRacketGrip: {
      width: 5,
      height: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 1,
    },
    tennisNetWrap: {
      position: 'absolute',
      right: 50,
      bottom: 16,
      width: 30,
      height: 44,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    tennisNetWhiteTop: {
      width: '100%',
      height: 4,
      backgroundColor: '#FFFFFF',
    },
    tennisNetMesh: {
      width: '100%',
      height: '100%',
    },
    tennisBall: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#EAB308',
      borderWidth: 1.5,
      borderColor: '#CA8A04',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      shadowColor: '#EAB308',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 5,
    },
    tennisBallSeam1: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    tennisBallSeam2: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      borderLeftColor: 'transparent',
      borderTopColor: 'transparent',
    },
    tennisImpactShock: {
      position: 'absolute',
      top: 32,
      right: 44,
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#FACC15',
      backgroundColor: 'rgba(250, 204, 21, 0.2)',
    },

    // 🏓 6. Table Tennis Stage
    tableTennisStage: {
      width: 220,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    pingPongTable: {
      position: 'absolute',
      bottom: 25,
      width: 140,
      height: 12,
      backgroundColor: '#1E40AF',
      borderTopWidth: 2,
      borderTopColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
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
      top: -16,
      width: 14,
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
    pingPongNetTopWhite: {
      width: '100%',
      height: 2,
      backgroundColor: '#FFFFFF',
    },
    pingPongPaddleWrap: {
      position: 'absolute',
      alignItems: 'center',
      zIndex: 2,
    },
    pingPongRubberRed: {
      width: 26,
      height: 28,
      borderRadius: 13,
      backgroundColor: '#DC2626',
      borderWidth: 2,
      borderColor: '#991B1B',
    },
    pingPongWoodHandle: {
      width: 4,
      height: 14,
      backgroundColor: '#D97706',
      borderRadius: 1,
    },
    pingPongBall: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      zIndex: 5,
    },
    pingPongImpactShock: {
      position: 'absolute',
      bottom: 30,
      right: 60,
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: '#60A5FA',
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
    },

    // Celebration Text & Actions
    textContainer: {
      alignItems: 'center',
      width: '100%',
      marginTop: 6,
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
