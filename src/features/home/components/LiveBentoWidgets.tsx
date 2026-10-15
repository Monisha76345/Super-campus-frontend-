import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

export function LiveBentoWidgets() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const handleSchedulePress = () => {
    Alert.alert(
      'Class Schedule',
      'Course: Cloud Architecture & DevOps (CS501)\nProfessor: Dr. V. Rao\nRoom: LH-302, Academic Block B\nToday: 10:30 AM - 11:20 AM'
    );
  };

  const handleAttendancePress = () => {
    Alert.alert(
      'Attendance Summary',
      'Overall Attendance: 92.4%\n• CS501 (Cloud): 96%\n• CS502 (Algorithms): 89%\n• CS503 (Networks): 92%\n\nYou are safely above the 75% university eligibility requirement.'
    );
  };

  const handleGatePassPress = () => {
    router.push('/outpass');
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.sectionTitle}>Campus Pulse</Text>
          <Text style={styles.sectionSub}>Live academic widgets</Text>
        </View>
        <View style={styles.liveIndicatorPill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveText}>SYNCED</Text>
        </View>
      </View>

      {/* Bento Item 1: Wide Next Class Schedule */}
      <Pressable
        onPress={handleSchedulePress}
        style={({ pressed }) => [styles.bentoWideCard, pressed && styles.cardPressed]}>
        <View style={styles.wideCardTop}>
          <View style={styles.timeTagRow}>
            <View style={styles.clockIconBox}>
              <Ionicons name="time" size={14} color="#38BDF8" />
            </View>
            <Text style={styles.timeTagText}>NEXT LECTURE • 10:30 AM</Text>
          </View>

          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>in 35m</Text>
          </View>
        </View>

        <Text style={styles.courseTitle}>Cloud Architecture & DevOps</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color="#818CF8" />
          <Text style={styles.locationText}>Lecture Hall 302 • Academic Block B</Text>
        </View>
      </Pressable>

      {/* Bento Row: Asymmetric 2 Square Widgets */}
      <View style={styles.bentoRow}>
        {/* Bento Item 2 (Left): Attendance Tracker */}
        <Pressable
          onPress={handleAttendancePress}
          style={({ pressed }) => [styles.bentoSquareCard, styles.attendanceCard, pressed && styles.cardPressed]}>
          <View style={styles.squareTopRow}>
            <View style={[styles.squareIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="pie-chart" size={16} color="#34D399" />
            </View>
            <View style={styles.statusPillGreen}>
              <Text style={styles.statusPillGreenText}>SAFE</Text>
            </View>
          </View>

          <View style={styles.squareBody}>
            <Text style={styles.metricNumber}>92.4%</Text>
            <Text style={styles.metricTitle}>Attendance</Text>
            <Text style={styles.metricSub}>36 / 39 lectures</Text>
          </View>
        </Pressable>

        {/* Bento Item 3 (Right): Gate Outpass Widget */}
        <Pressable
          onPress={handleGatePassPress}
          style={({ pressed }) => [styles.bentoSquareCard, styles.gatePassCard, pressed && styles.cardPressed]}>
          <View style={styles.squareTopRow}>
            <View style={[styles.squareIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
              <Ionicons name="qr-code" size={16} color="#38BDF8" />
            </View>
            <View style={styles.statusPillBlue}>
              <Text style={styles.statusPillBlueText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.squareBody}>
            <Text style={styles.gatePassTitle}>Gate Outpass</Text>
            <Text style={styles.gatePassSub}>Main Campus Gate</Text>
            <Text style={styles.gatePassTime}>Valid till 10:30 PM</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.black,
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#818CF8',
  },
  liveText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: Colors.text.accent,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bentoWideCard: {
    backgroundColor: Colors.background.surface,
    borderWidth: 1.2,
    borderColor: 'rgba(129, 140, 248, 0.22)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  wideCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTagText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#38BDF8',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  countdownBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countdownText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: Colors.text.accent,
    fontWeight: '700',
  },
  courseTitle: {
    fontFamily: Typography.black,
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoSquareCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    minHeight: 126,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  attendanceCard: {
    backgroundColor: Colors.background.surface,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  gatePassCard: {
    backgroundColor: Colors.background.surface,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  squareTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  squareIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillGreenText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: '#34D399',
    fontWeight: '800',
  },
  statusPillBlue: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillBlueText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: '#38BDF8',
    fontWeight: '800',
  },
  squareBody: {
    justifyContent: 'flex-end',
  },
  metricNumber: {
    fontFamily: Typography.black,
    fontSize: 22,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricTitle: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 1,
  },
  metricSub: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  gatePassTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  gatePassSub: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: '#38BDF8',
    marginBottom: 1,
  },
  gatePassTime: {
    fontFamily: Typography.regular,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
}
