import { StatusBar } from 'expo-status-bar';
import { ReactNode, useMemo } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ColorTokens } from '@/constants/colors';
import { useAppTheme } from '@/theme/app-theme';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform screen container for iOS & Android.
 * - Handles notch / Dynamic Island and Android system bars via SafeAreaView & insets.
 * - Automatically configures light status bar on the obsidian dark canvas.
 * - Keeps the keyboard open while a field is focused. Drag the screen to dismiss it.
 */
export function ScreenContainer({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors: Colors, scheme } = useAppTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      bounces={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Orbs stay behind the form and never take taps. */}
      <View style={styles.orbLayer} pointerEvents="none">
        <View style={styles.ambientOrbTop} />
        <View style={styles.ambientOrbBottom} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.innerContainer}>{content}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
  },
  orbLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: Colors.primary.glow,
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: Colors.primary.ambientRing,
  },
  keyboardAvoid: {
    flex: 1,
    zIndex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  staticContent: {
    flex: 1,
  },
});
}
