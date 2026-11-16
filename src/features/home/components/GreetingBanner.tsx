import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

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
    <View style={styles.outer}>
      {/* Soft organic top wash like the reference shroud */}
      <View style={styles.topWave} pointerEvents="none" />

      <View style={styles.card}>
        <Image
          source={require('../../../../assets/images/campus-hero.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ top: '20%', left: '50%' }}
        />

        {/* Frosted blue/purple blur overlay (image 1 look) */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 28 : 40}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            'rgba(37, 99, 235, 0.28)',
            'rgba(79, 70, 229, 0.42)',
            'rgba(15, 23, 42, 0.72)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.contentRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.salutation}>{timeGreeting}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.mottoWrapper}>
            <View style={styles.mottoCard}>
              <View style={styles.sparkleRow}>
                <Ionicons name="sparkles" size={11} color="#FACC15" />
                <Text style={styles.mottoSuper}>SUPER</Text>
              </View>
              <Text style={styles.mottoText}>Learn</Text>
              <Text style={styles.mottoText}>Build</Text>
              <Text style={[styles.mottoText, styles.mottoAccent]}>Belong</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Soft curved bottom transition into the page */}
      <View style={styles.bottomCurve} pointerEvents="none" />
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    outer: {
      marginHorizontal: -16,
      marginBottom: 8,
      paddingTop: 6,
    },
    topWave: {
      position: 'absolute',
      top: -28,
      right: -40,
      width: 220,
      height: 120,
      borderRadius: 110,
      backgroundColor: 'rgba(37, 99, 235, 0.16)',
      transform: [{ rotate: '-18deg' }],
      zIndex: 0,
    },
    card: {
      marginHorizontal: 16,
      height: 198,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 52,
      borderBottomLeftRadius: 42,
      borderBottomRightRadius: 28,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      borderWidth: 1,
      borderColor: 'rgba(147, 197, 253, 0.22)',
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.35,
      shadowRadius: 22,
      elevation: 10,
      zIndex: 1,
    },
    contentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingBottom: 22,
      paddingTop: 24,
      zIndex: 2,
    },
    leftColumn: {
      flex: 1,
      paddingRight: 12,
    },
    salutation: {
      fontFamily: Typography.bold,
      fontSize: 11,
      color: '#BFDBFE',
      letterSpacing: 1.3,
      fontWeight: '700',
      marginBottom: 4,
    },
    userName: {
      fontFamily: Typography.black,
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginBottom: 5,
      textShadowColor: 'rgba(15, 23, 42, 0.45)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    subtitle: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: 'rgba(241, 245, 249, 0.9)',
      lineHeight: 17,
      maxWidth: 220,
    },
    mottoWrapper: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 2,
    },
    mottoCard: {
      backgroundColor: 'rgba(55, 48, 163, 0.92)',
      borderWidth: 1,
      borderColor: 'rgba(199, 210, 254, 0.45)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 11,
      transform: [{ rotate: '3deg' }],
      shadowColor: '#818CF8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    sparkleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginBottom: 3,
    },
    mottoSuper: {
      fontFamily: Typography.black,
      fontSize: 8,
      color: '#FACC15',
      letterSpacing: 1.1,
      fontWeight: '900',
    },
    mottoText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      fontWeight: '800',
      fontStyle: 'italic',
      color: '#EEF2FF',
      textAlign: 'center',
      lineHeight: 16,
    },
    mottoAccent: {
      color: '#C7D2FE',
      textDecorationLine: 'underline',
      textDecorationColor: '#A5B4FC',
    },
    bottomCurve: {
      alignSelf: 'center',
      marginTop: -18,
      width: '78%',
      height: 28,
      borderBottomLeftRadius: 80,
      borderBottomRightRadius: 80,
      backgroundColor: Colors.background.canvas,
      opacity: 0.95,
      zIndex: 2,
    },
  });
}
