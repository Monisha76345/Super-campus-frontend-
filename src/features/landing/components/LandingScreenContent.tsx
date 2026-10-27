import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/fonts';
import { LandingHero } from './LandingHero';

/**
 * Opening screen: animated emblem, Super Campus title,
 * and direct referral link / invite code entrance.
 */
export function LandingScreenContent() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  const openLogin = () => {
    if (hasNavigated.current) {
      return;
    }
    hasNavigated.current = true;
    router.replace('/login');
  };

  const openReferral = (e?: any) => {
    e?.stopPropagation?.();
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace('/(auth)/login?openReferral=true');
  };

  useEffect(() => {
    const timer = setTimeout(openLogin, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={openLogin} style={styles.container}>
      <LandingHero />

      <View style={styles.footerWrapper}>
        <Pressable
          onPress={openReferral}
          style={({ pressed }) => [styles.referralPill, pressed && styles.pressed]}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift" size={13} color="#38BDF8" />
          </View>
          <Text style={styles.referralText}>Have a referral code or invite link?</Text>
          <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  footerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  referralPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralText: {
    fontFamily: Typography.medium,
    fontSize: 12.5,
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
