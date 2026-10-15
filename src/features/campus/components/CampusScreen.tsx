import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { HomeBottomTabs, TabKey } from '@/features/home/components/HomeBottomTabs';

import { openTab } from '../navigation';

interface CampusScreenProps {
  title: string;
  subtitle?: string;
  activeTab: TabKey;
  children: ReactNode;
}

export function CampusScreen({ title, subtitle, activeTab, children }: CampusScreenProps) {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => router.replace('/home')}
          hitSlop={8}
          style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={Colors.text.accent} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
      <HomeBottomTabs
        activeTab={activeTab}
        onTabChange={(tab) => openTab(router, tab)}
        onCenterActionPress={() => router.push('/scan')}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 128,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 2,
  },
  backText: {
    fontFamily: Typography.semiBold,
    color: Colors.text.accent,
    fontSize: 14,
  },
  title: {
    fontFamily: Typography.bold,
    color: Colors.text.primary,
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    fontSize: 15,
    marginBottom: 18,
    lineHeight: 21,
  },
});
}
