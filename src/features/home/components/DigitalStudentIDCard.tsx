import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface DigitalStudentIDCardProps {
  studentName: string;
  studentId: string;
  department: string;
  academicYear: string;
  campusName: string;
}

export function DigitalStudentIDCard({
  studentName,
  studentId,
  department,
  academicYear,
  campusName,
}: DigitalStudentIDCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const handleShowFullPass = () => {
    Alert.alert(
      'Digital Campus Pass',
      `Student: ${studentName}\nID: ${studentId}\nStatus: Active & Verified\nAuthorized for Turnstile Gates, Library, & Sports Complex.`
    );
  };

  return (
    <Pressable
      onPress={handleShowFullPass}
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}>
      {/* Background Holographic Glow Elements */}
      <View style={styles.holoLightTop} pointerEvents="none" />
      <View style={styles.holoLightBottom} pointerEvents="none" />
      <View style={styles.diagonalHoloLine} pointerEvents="none" />

      {/* Top Row: Institution Tag + Verified Active Chip */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.institutionGroup}>
          <View style={styles.hatIconBox}>
            <Ionicons name="school" size={14} color={Colors.text.accent} />
          </View>
          <Text style={styles.institutionText}>{campusName}</Text>
        </View>

        <View style={styles.activeVerifiedPill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>VERIFIED</Text>
        </View>
      </View>

      {/* Middle Row: Student Details & Chip */}
      <View style={styles.cardBodyRow}>
        <View style={styles.studentInfoColumn}>
          <Text style={styles.studentNameText}>{studentName}</Text>
          <Text style={styles.departmentText}>{department}</Text>
          <Text style={styles.batchText}>{academicYear}</Text>
        </View>

        {/* Smart Chip / NFC Graphic */}
        <View style={styles.smartChip}>
          <Ionicons name="hardware-chip-outline" size={26} color="#FBBF24" />
          <Ionicons name="wifi" size={14} color="#A5B4FC" style={styles.nfcIcon} />
        </View>
      </View>

      {/* Bottom Bar: Barcode / ID String & Quick Expand Pass CTA */}
      <View style={styles.cardFooterRow}>
        <View style={styles.idCodeContainer}>
          <Text style={styles.idCodeLabel}>STUDENT ID</Text>
          <Text style={styles.idCodeValue}>{studentId}</Text>
        </View>

        <View style={styles.expandPassPill}>
          <Ionicons name="qr-code-outline" size={14} color="#C7D2FE" />
          <Text style={styles.expandPassText}>Gate Pass</Text>
          <Ionicons name="arrow-forward" size={12} color="#C7D2FE" />
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.background.surface,
    borderRadius: 24,
    borderWidth: 1.4,
    borderColor: 'rgba(129, 140, 248, 0.35)',
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  holoLightTop: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  holoLightBottom: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(14, 165, 233, 0.18)',
  },
  diagonalHoloLine: {
    position: 'absolute',
    top: -60,
    left: '25%',
    width: 6,
    height: 350,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '35deg' }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  institutionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hatIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  institutionText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  activeVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  activeText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: '#34D399',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  studentInfoColumn: {
    flex: 1,
    paddingRight: 12,
  },
  studentNameText: {
    fontFamily: Typography.black,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  departmentText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: Colors.text.accent,
    fontWeight: '600',
    marginBottom: 2,
  },
  batchText: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  smartChip: {
    width: 44,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nfcIcon: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    transform: [{ rotate: '45deg' }],
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  idCodeContainer: {
    justifyContent: 'center',
  },
  idCodeLabel: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  idCodeValue: {
    fontFamily: Typography.bold,
    fontSize: 13,
    color: Colors.text.primary,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  expandPassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  expandPassText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: Colors.text.onBrand,
    fontWeight: '700',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
}
