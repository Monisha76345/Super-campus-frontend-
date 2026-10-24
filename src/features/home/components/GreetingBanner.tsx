import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface GreetingBannerProps {
  userName: string;
  subtitle?: string;
}

export function GreetingBanner({
  userName,
  subtitle = 'Your people. Your campus. Your next step.',
}: GreetingBannerProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING,';
    if (hour < 17) return 'GOOD AFTERNOON,';
    return 'GOOD EVENING,';
  }, []);

  return (
    <View style={styles.container}>
      {/* Left Greeting & Subtitle */}
      <View style={styles.leftColumn}>
        <Text style={styles.salutation}>{timeGreeting}</Text>
        <Text style={styles.userName} numberOfLines={1}>
          {userName}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Right Floating Tilted Violet Card ("Learn Build Belong") */}
      <View style={styles.mottoWrapper}>
        <View style={styles.mottoCard}>
          <View style={styles.sparkleRow}>
            <Ionicons name="sparkles" size={12} color="#FACC15" />
            <Text style={styles.mottoSuper}>SUPER</Text>
          </View>
          <Text style={styles.mottoText}>Learn</Text>
          <Text style={styles.mottoText}>Build</Text>
          <Text style={[styles.mottoText, styles.mottoAccent]}>Belong</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  salutationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  salutation: {
    fontFamily: Typography.bold,
    fontSize: 11,
    color: Colors.text.accent,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 2,
  },
  livePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  pulseText: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: '#10B981',
    fontWeight: '700',
  },
  userName: {
    fontFamily: Typography.black,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  waveEmoji: {
    fontSize: 20,
  },
  subtitle: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  mottoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mottoCard: {
    backgroundColor: '#312E81',
    borderWidth: 1,
    borderColor: 'rgba(199, 210, 254, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    transform: [{ rotate: '2.5deg' }],
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 2,
  },
  mottoSuper: {
    fontFamily: Typography.black,
    fontSize: 8,
    color: '#FACC15',
    letterSpacing: 1,
    fontWeight: '900',
  },
  mottoText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 15,
  },
  mottoAccent: {
    color: '#A5B4FC',
    textDecorationLine: 'underline',
    textDecorationColor: '#818CF8',
  },
});
}
