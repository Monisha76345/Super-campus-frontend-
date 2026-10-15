import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { LandingHero } from './LandingHero';

/**
 * Opening screen: animated emblem and Super Campus title.
 * It opens the login screen on its own, and a tap opens it immediately.
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

  useEffect(() => {
    const timer = setTimeout(openLogin, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={openLogin} style={styles.container}>
      <LandingHero />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
