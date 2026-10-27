import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useColors } from '@/theme/app-theme';
import { referralStorage } from '../referralStorage';
import {
  generateReferralLink,
  parseReferralCode,
  shareReferralInvite,
} from '../referralUtils';

interface ReferralInputSectionProps {
  initialCode?: string;
  forceOpen?: boolean;
  onCodeApplied?: (code: string) => void;
}

export function ReferralInputSection({
  initialCode,
  forceOpen = false,
  onCodeApplied,
}: ReferralInputSectionProps) {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const [expanded, setExpanded] = useState(forceOpen);
  const [inputText, setInputText] = useState(initialCode || '');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing referral on mount
  useEffect(() => {
    referralStorage.getReferral().then((saved) => {
      if (saved?.code) {
        setAppliedCode(saved.code);
        onCodeApplied?.(saved.code);
      } else if (initialCode) {
        const parsed = parseReferralCode(initialCode);
        if (parsed.length >= 3) {
          handleApply(parsed);
        }
      }
    });
  }, [initialCode]);

  useEffect(() => {
    if (forceOpen) {
      setExpanded(true);
    }
  }, [forceOpen]);

  const handleApply = async (codeToApply?: string) => {
    setErrorMsg(null);
    const target = codeToApply || inputText;
    const parsed = parseReferralCode(target);

    if (!parsed || parsed.length < 3) {
      setErrorMsg('Please enter a valid referral code or invite link');
      return;
    }

    await referralStorage.saveReferral({
      code: parsed,
      appliedAt: new Date().toISOString(),
      sourceUrl: target.includes('://') ? target : undefined,
    });

    setAppliedCode(parsed);
    setInputText(parsed);
    onCodeApplied?.(parsed);
    Alert.alert('Referral Applied! 🎉', `Referral code "${parsed}" was successfully linked to your session.`);
  };

  const handleRemove = async () => {
    await referralStorage.clear();
    setAppliedCode(null);
    setInputText('');
    setErrorMsg(null);
  };

  const handleShare = async () => {
    const code = appliedCode || 'CAMPUS2026';
    await shareReferralInvite(code);
  };

  const handleCopyLink = () => {
    const link = generateReferralLink(appliedCode || 'CAMPUS2026');
    Alert.alert('Referral Link', `Share this link with your classmates:\n\n${link}`);
  };

  if (appliedCode) {
    return (
      <View style={styles.appliedCard}>
        <View style={styles.appliedHeaderRow}>
          <View style={styles.appliedIconCircle}>
            <Ionicons name="gift" size={16} color="#38BDF8" />
          </View>
          <View style={styles.appliedTextWrapper}>
            <Text style={styles.appliedTitle}>Referral Link Active</Text>
            <Text style={styles.appliedSubtitle}>Campus Community Welcome Bonus linked</Text>
          </View>
          <View style={styles.codePill}>
            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
            <Text style={styles.codePillText}>{appliedCode}</Text>
          </View>
        </View>

        <View style={styles.appliedActionsRow}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
            onPress={handleShare}>
            <Ionicons name="share-social-outline" size={14} color="#38BDF8" />
            <Text style={styles.shareBtnText}>Share Invite</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}
            onPress={handleRemove}>
            <Text style={styles.changeBtnText}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {!expanded ? (
        <Pressable
          style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
          onPress={() => setExpanded(true)}>
          <View style={styles.expandLeft}>
            <Ionicons name="gift-outline" size={16} color="#38BDF8" />
            <Text style={styles.expandText}>Have a referral code or invite link?</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </Pressable>
      ) : (
        <View style={styles.expandedContainer}>
          <View style={styles.expandedHeader}>
            <View style={styles.expandLeft}>
              <Ionicons name="gift" size={16} color="#38BDF8" />
              <Text style={styles.expandedTitle}>Enter Referral Code or Link</Text>
            </View>
            <Pressable
              onPress={() => setExpanded(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={16} color="#94A3B8" />
            </Pressable>
          </View>

          <Text style={styles.helperText}>
            Paste your friend&apos;s campus invite URL or referral code below.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. SC-NMIT2026 or paste invite link"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              autoCorrect={false}
              value={inputText}
              onChangeText={(val) => {
                setInputText(val);
                if (errorMsg) setErrorMsg(null);
              }}
            />
            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.pressed,
                !inputText.trim() && styles.applyButtonDisabled,
              ]}
              disabled={!inputText.trim()}
              onPress={() => handleApply()}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.expandedFooter}>
            <Pressable
              style={({ pressed }) => [styles.linkAction, pressed && styles.pressed]}
              onPress={handleShare}>
              <Ionicons name="share-outline" size={13} color="#38BDF8" />
              <Text style={styles.linkActionText}>Invite Classmates</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.linkAction, pressed && styles.pressed]}
              onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={13} color="#A78BFA" />
              <Text style={styles.linkActionText}>View Referral Link</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    wrapper: {
      marginVertical: 6,
      width: '100%',
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(56, 189, 248, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.22)',
    },
    expandLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    expandText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: '#38BDF8',
    },
    expandedContainer: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    expandedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    expandedTitle: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: '#F8FAFC',
      fontWeight: '600',
    },
    helperText: {
      fontFamily: Typography.regular,
      fontSize: 11.5,
      color: '#94A3B8',
      marginBottom: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    input: {
      flex: 1,
      height: 40,
      backgroundColor: '#111827',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#1E293B',
      paddingHorizontal: 12,
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: '#F8FAFC',
    },
    applyButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 16,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonDisabled: {
      opacity: 0.5,
    },
    applyButtonText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    errorText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#EF4444',
      marginTop: 6,
    },
    expandedFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#1E293B',
    },
    linkAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    linkActionText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: '#94A3B8',
    },
    appliedCard: {
      marginVertical: 6,
      padding: 12,
      borderRadius: 14,
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    appliedHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    appliedIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appliedTextWrapper: {
      flex: 1,
    },
    appliedTitle: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    appliedSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#94A3B8',
    },
    codePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.16)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    codePillText: {
      fontFamily: Typography.bold,
      fontSize: 11.5,
      fontWeight: '700',
      color: '#34D399',
    },
    appliedActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: 'rgba(16, 185, 129, 0.15)',
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    shareBtnText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: '#38BDF8',
    },
    changeBtn: {
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    changeBtnText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#94A3B8',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
