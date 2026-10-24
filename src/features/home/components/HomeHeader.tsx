import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';
import { initials } from '@/features/auth/profile';

interface HomeHeaderProps {
  campusName: string;
  userName: string;
  onNotificationPress?: () => void;
  onCampusPress?: () => void;
  onProfilePress?: () => void;
}

export function HomeHeader({
  campusName,
  userName,
  onNotificationPress,
  onCampusPress,
  onProfilePress,
}: HomeHeaderProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <View style={styles.headerContainer}>
      {/* Left: User Avatar + Name Greeting */}
      <Pressable
        onPress={onProfilePress || (() => Alert.alert('Profile', `Logged in as ${userName}`))}
        style={({ pressed }) => [styles.profileSection, pressed && styles.pressed]}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{initials(userName)}</Text>
          </View>
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.greetingColumn}>
          <Text style={styles.salutationText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
      </Pressable>

      {/* Right Controls: Campus Pill & Glass Notification Bell */}
      <View style={styles.rightSection}>
        {/* Campus Location Pill */}
        <Pressable
          onPress={
            onCampusPress || (() => Alert.alert('Campus Selected', `Active campus: ${campusName}`))
          }
          style={({ pressed }) => [styles.campusPill, pressed && styles.pressed]}>
          <View style={styles.locationDot} />
          <Text style={styles.campusNameText} numberOfLines={1}>
            {campusName}
          </Text>
          <Ionicons name="chevron-down" size={12} color={Colors.text.secondary} />
        </Pressable>

        {/* Notification Bell */}
        <Pressable
          onPress={
            onNotificationPress ||
            (() => Alert.alert('Notifications', 'You are all caught up! 2 campus alerts active.'))
          }
          style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={20} color={Colors.text.primary} />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    backgroundColor: Colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: Typography.bold,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary.lavender,
    letterSpacing: 0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981', // Emerald online dot
    borderWidth: 2,
    borderColor: Colors.background.canvas,
  },
  greetingColumn: {
    justifyContent: 'center',
  },
  salutationText: {
    fontFamily: Typography.medium,
    fontSize: 11,
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  userNameText: {
    fontFamily: Typography.black,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  campusNameText: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
    maxWidth: 95,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    borderWidth: 1.5,
    borderColor: Colors.background.canvas,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
}
