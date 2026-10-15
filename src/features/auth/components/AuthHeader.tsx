import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader({
  title = 'Welcome Back',
  subtitle = 'Sign in to access your courses and campus dashboard',
}: AuthHeaderProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <View style={styles.container}>
      {/* Brand Icon with Electric Blue Glow */}
      <View style={styles.iconGlowWrapper}>
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={32} color={Colors.primary.light} />
        </View>
      </View>

      <View style={styles.badge}>
        <View style={styles.statusDot} />
        <Text style={styles.badgeText}>SUPERCAMPUS PORTAL</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 10,
  },
  iconGlowWrapper: {
    padding: 6,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    marginBottom: 16,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.cyan,
    marginRight: 6,
  },
  badgeText: {
    color: Colors.primary.cyan,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
});
}
