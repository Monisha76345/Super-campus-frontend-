import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

interface CampusCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  meta?: string;
  accent?: string;
  onPress?: () => void;
}

export function CampusCard({
  icon,
  title,
  detail,
  meta,
  accent,
  onPress,
}: CampusCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const tint = accent ?? Colors.primary.cyan;
  const body = (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {meta ? <Text style={[styles.meta, { color: tint }]}>{meta}</Text> : null}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.card,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.semiBold,
    color: Colors.text.primary,
    fontSize: 15,
    marginBottom: 2,
  },
  detail: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
}
