import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

const TARGET_LINE_WIDTH = 230;

interface LandingHeroProps {
  exiting?: boolean;
  onTransitionComplete?: () => void;
}

export function LandingHero({ exiting = false, onTransitionComplete }: LandingHeroProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  // Logo & Aura animations
  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  // Exit Zoom Animation for the Centered Icon (Portal Zoom Effect)
  const exitZoomScale = useSharedValue(1);
  const exitGlowScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  // Text & underline fade-out on exit
  const textExitOpacity = useSharedValue(1);

  // Radar ripple 1 & 2
  const rippleScale1 = useSharedValue(1);
  const rippleOpacity1 = useSharedValue(0.6);
  const rippleScale2 = useSharedValue(1);
  const rippleOpacity2 = useSharedValue(0.4);

  // Rotating halo
  const rotateDeg = useSharedValue(0);

  // Animated Underline Line
  const drawWidth = useSharedValue(30);
  const lineGlowOpacity = useSharedValue(0.7);

  // Graduation Hat Icon animations
  const hatScale = useSharedValue(0.6);
  const hatRotate = useSharedValue(0);

  useEffect(() => {
    // 1. Smooth Floating levitation on the center emblem
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 2. Center glow pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Radar ripple wave 1
    rippleScale1.value = withRepeat(
      withTiming(1.5, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    rippleOpacity1.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 400 }),
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );

    // 4. Radar ripple wave 2
    setTimeout(() => {
      rippleScale2.value = withRepeat(
        withTiming(1.6, { duration: 2200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      rippleOpacity2.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400 }),
          withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }, 800);

    // 5. Halo 360 rotation
    rotateDeg.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );

    // 6. Draw underline line from left to right (snappy 600ms)
    drawWidth.value = withDelay(
      80,
      withTiming(TARGET_LINE_WIDTH, {
        duration: 550,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    );

    // 7. Hat icon arrives, springs and does a celebratory zoom-out pop
    hatScale.value = withDelay(
      120,
      withSequence(
        withSpring(1.35, { damping: 7, stiffness: 140 }), // Energetic zoom out pop
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) }) // Settles
      )
    );

    // Continuous breathing glow on the underline
    lineGlowOpacity.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

  }, [
    floatY,
    glowScale,
    glowOpacity,
    rippleScale1,
    rippleOpacity1,
    rippleScale2,
    rippleOpacity2,
    rotateDeg,
    drawWidth,
    hatScale,
    lineGlowOpacity,
    hatRotate,
    exitZoomScale,
    exitGlowScale,
    exitOpacity,
    textExitOpacity,
  ]);

  useEffect(() => {
    if (!exiting) {
      return;
    }

    textExitOpacity.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.ease) });
    exitZoomScale.value = withTiming(3.2, {
      duration: 480,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    exitGlowScale.value = withTiming(4, {
      duration: 480,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    exitOpacity.value = withDelay(
      100,
      withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }, (finished) => {
        'worklet';
        if (finished && onTransitionComplete) {
          runOnJS(onTransitionComplete)();
        }
      })
    );
  }, [exiting, exitGlowScale, exitOpacity, exitZoomScale, onTransitionComplete, textExitOpacity]);

  const animatedFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value * exitGlowScale.value }],
    opacity: glowOpacity.value * exitOpacity.value,
  }));

  const animatedRipple1Style = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale1.value }],
    opacity: rippleOpacity1.value * exitOpacity.value,
  }));

  const animatedRipple2Style = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale2.value }],
    opacity: rippleOpacity2.value * exitOpacity.value,
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateDeg.value}deg` }],
    opacity: exitOpacity.value,
  }));

  // Style for the Centered Icon with the dramatic Zoom effect
  const animatedCenteredIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exitZoomScale.value }],
    opacity: exitOpacity.value,
  }));

  // Style for text and underline fading out during zoom
  const animatedTextExitStyle = useAnimatedStyle(() => ({
    opacity: textExitOpacity.value,
  }));

  // Animated underline line style
  const animatedLineStyle = useAnimatedStyle(() => ({
    width: drawWidth.value,
    opacity: lineGlowOpacity.value,
  }));

  // Animated graduation hat icon style
  const animatedHatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hatScale.value }, { rotate: `${hatRotate.value}deg` }],
  }));

  return (
    <View style={styles.centerContainer}>
      {/* Concentric Illuminated Touch-Control Emblem with Portal Zoom Animation */}
      <Animated.View style={[styles.logoAnchor, animatedCenteredIconStyle]}>
        {/* Outward Expanding Radar Ripple 2 */}
        <Animated.View style={[styles.radarWave, animatedRipple2Style]} />

        {/* Outward Expanding Radar Ripple 1 */}
        <Animated.View style={[styles.radarWave, animatedRipple1Style]} />

        {/* Diffuse Center Glow Aura */}
        <Animated.View style={[styles.diffuseGlow, animatedGlowStyle]} />

        {/* Rotating Geometric Halo Ring */}
        <Animated.View style={[styles.rotatingHalo, animatedRotateStyle]} />

        {/* Middle Frosted Glass Ring with Spring Entrance */}
        <Animated.View entering={ZoomIn.springify().damping(11).stiffness(90)} style={styles.middleGlassRing}>
          {/* Inner Floating Midnight Indigo Squircle Emblem */}
          <Animated.View style={[styles.emblemContainer, animatedFloatStyle]}>
            <View style={styles.innerLitGlass}>
              <Ionicons name="school" size={52} color={Colors.text.primary} />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Two-Tone Typography and Underline (Fades smoothly as icon zooms) */}
      <Animated.View entering={FadeInDown.delay(150).springify().damping(12)}>
        <Animated.View style={[styles.textContainer, animatedTextExitStyle]}>
          <View style={styles.titleRow}>
            <Text style={styles.titleSuper}>SUPER</Text>
            <Text style={styles.titleCampus}>CAMPUS</Text>
          </View>

          {/* Animated Underline: Draws from left and ends with graduation hat icon */}
          <View style={styles.underlineTrackWrapper}>
            <Animated.View style={[styles.animatedLineTrack, animatedLineStyle]}>
              <View style={styles.lineGlowingBar} />
              <Animated.View style={[styles.hatBadge, animatedHatStyle]}>
                <Ionicons name="school" size={17} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoAnchor: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  radarWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  diffuseGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(79, 70, 229, 0.32)',
  },
  rotatingHalo: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(165, 180, 252, 0.3)',
  },
  middleGlassRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.background.surfaceGlass,
    borderWidth: 1.2,
    borderColor: Colors.border.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  emblemContainer: {
    width: 100,
    height: 100,
    borderRadius: 34,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 12,
  },
  innerLitGlass: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: Colors.background.input,
    borderWidth: 1,
    borderColor: Colors.border.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titleSuper: {
    fontFamily: Typography.black,
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  titleCampus: {
    fontFamily: Typography.black,
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text.accent,
    letterSpacing: 2,
  },
  underlineTrackWrapper: {
    width: TARGET_LINE_WIDTH,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  animatedLineTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  lineGlowingBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  hatBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#313491',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
});
}
