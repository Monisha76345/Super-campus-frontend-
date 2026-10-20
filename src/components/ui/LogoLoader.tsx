import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Typography } from '@/constants/fonts';

const LOGO_SOURCE = require('@/assets/images/nmit-logo-transparent.png');

export interface AppLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function AppLogo({ size = 36, style }: AppLogoProps) {
  const width = size;
  const height = size * (432 / 371);

  return (
    <View style={[{ width, height, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

export interface LogoLoaderProps {
  size?: number;
  text?: string;
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LogoLoader({
  size = 44,
  text,
  overlay = false,
  style,
}: LogoLoaderProps) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.92,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.75,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [scaleAnim, opacityAnim]);

  const width = size;
  const height = size * (432 / 371);

  const isInline = !overlay && size <= 28;

  const content = (
    <View style={[styles.container, isInline && styles.inlineContainer, style]}>
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Animated pulsating shield logo - pure logo itself without boxes or shades */}
        <Animated.View
          style={[
            {
              width,
              height,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={LOGO_SOURCE}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent animationType="fade" visible statusBarTranslucent>
        <View style={styles.overlayBackdrop}>
          {content}
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  inlineContainer: {
    paddingVertical: 0,
  },
  text: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: '#F8FAFC',
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  overlayBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(8, 11, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
