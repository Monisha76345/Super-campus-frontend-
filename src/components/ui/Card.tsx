import React, { ReactNode, useMemo } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  card: {
    backgroundColor: Colors.background.surface,
    borderColor: Colors.border.card,
    borderWidth: 1.2,
    borderRadius: 26,
    padding: 22,
    ...(Platform.OS === 'android'
      ? { elevation: 0 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45,
          shadowRadius: 24,
        }),
  },
});
}
