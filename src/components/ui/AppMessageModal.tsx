import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';

export type AppMessageType = 'error' | 'success' | 'warning' | 'info';

export interface AppMessageModalProps {
  visible: boolean;
  type?: AppMessageType;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

export function AppMessageModal({
  visible,
  type = 'info',
  title,
  message,
  primaryButtonText = 'OK',
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  onClose,
}: AppMessageModalProps) {
  const Colors = useColors();
  const styles = createStyles(Colors, type);

  const handlePrimary = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSecondary = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return {
          name: 'alert-circle' as const,
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'warning':
        return {
          name: 'warning' as const,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 'info':
      default:
        return {
          name: 'information-circle' as const,
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || handlePrimary}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Status Icon */}
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: iconConfig.bg, borderColor: iconConfig.border },
            ]}
          >
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {secondaryButtonText && (
              <Pressable
                accessibilityRole="button"
                onPress={handleSecondary}
                style={[styles.btn, styles.secondaryBtn]}
              >
                <Text style={styles.secondaryBtnText}>{secondaryButtonText}</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={handlePrimary}
              style={[
                styles.btn,
                styles.primaryBtn,
                type === 'error' && styles.primaryBtnError,
                type === 'success' && styles.primaryBtnSuccess,
              ]}
            >
              <Text style={styles.primaryBtnText}>{primaryButtonText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(Colors: any, type: AppMessageType) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      zIndex: 9999,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: '#0F172A',
      borderRadius: 24,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 12,
    },
    iconWrapper: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      marginBottom: 16,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 19,
      fontWeight: '700',
      color: '#F8FAFC',
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: '#94A3B8',
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
    },
    btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtn: {
      backgroundColor: '#2563EB',
    },
    primaryBtnError: {
      backgroundColor: '#DC2626',
    },
    primaryBtnSuccess: {
      backgroundColor: '#10B981',
    },
    primaryBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    secondaryBtn: {
      backgroundColor: '#1E293B',
      borderWidth: 1,
      borderColor: '#334155',
    },
    secondaryBtnText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      fontWeight: '600',
      color: '#CBD5E1',
    },
  });
}
