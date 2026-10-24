import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Checkbox, Input } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

import { authApi } from '../api/authApi';
import { useLogin } from '../hooks/useLogin';
import { AuthHeader } from './AuthHeader';
import { SocialLoginRow } from './SocialLoginRow';

export function LoginForm() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const [alumniMode, setAlumniMode] = React.useState(false);
  const [superAdminMode, setSuperAdminMode] = React.useState(false);
  const [usn, setUsn] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [claimError, setClaimError] = React.useState<string | null>(null);
  const [claiming, setClaiming] = React.useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    errors,
    serverError,
    isLoading,
    handleSubmit,
  } = useLogin();

  const onLoginPress = () => {
    handleSubmit(
      () => {
        router.replace('/home');
      },
      superAdminMode,
    );
  };

  const onToggleSuperAdmin = () => {
    const next = !superAdminMode;
    setSuperAdminMode(next);
    if (next) {
      setAlumniMode(false);
      setClaimError(null);
      if (!email) setEmail('superadmin@supercampus.io');
      if (!password) setPassword('SuperAdmin@2026');
    } else {
      if (email === 'superadmin@supercampus.io') setEmail('');
      if (password === 'SuperAdmin@2026') setPassword('');
    }
  };

  const onClaimPress = async () => {
    setClaimError(null);
    if (!/^[a-zA-Z0-9]{5,32}$/.test(usn.trim())) {
      setClaimError('Enter the USN from your college record');
      return;
    }
    if (mobile.replace(/\D/g, '').length < 10) {
      setClaimError('Enter the mobile number an admin should verify');
      return;
    }
    setClaiming(true);
    try {
      await authApi.claimAlumni(usn, mobile);
      Alert.alert('Submitted', 'An admin will verify this USN and mobile number.');
      setAlumniMode(false);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Could not submit the alumni request');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(520).springify().damping(16)} style={styles.container}>
      <AuthHeader />

      <Card style={styles.card}>
        {superAdminMode && (
          <View style={styles.superAdminHeaderBadge}>
            <View style={styles.superAdminBadgePill}>
              <Ionicons name="shield-checkmark" size={14} color="#38BDF8" />
              <Text style={styles.superAdminHeaderTitle}>SUPER ADMIN CONSOLE</Text>
            </View>
            <Text style={styles.superAdminHeaderSubtitle}>
              Multi-tenant root access & campus directory management
            </Text>
          </View>
        )}

        {(alumniMode ? claimError : serverError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{alumniMode ? claimError : serverError}</Text>
          </View>
        )}

        {alumniMode ? (
          <Input
            label="USN"
            placeholder="1NT22AD015"
            leftIcon="school-outline"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            value={usn}
            onChangeText={setUsn}
          />
        ) : (
          <Input
            label={superAdminMode ? 'Super Admin Account' : 'College email'}
            placeholder={superAdminMode ? 'superadmin@supercampus.io' : '1nt22ad015.druva@nmit.ac.in'}
            leftIcon={superAdminMode ? 'shield-outline' : 'mail-outline'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
        )}

        {alumniMode ? (
          <Input
            label="Mobile number"
            placeholder="9876543210"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            value={mobile}
            onChangeText={setMobile}
          />
        ) : (
          <Input
            label={superAdminMode ? 'Master Security Key' : 'Password'}
            placeholder={superAdminMode ? '••••••••••••' : 'Enter your password'}
            leftIcon="lock-closed-outline"
            isPassword
            autoCapitalize="none"
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
        )}

        {/* Options Row: Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <Checkbox label="Remember me" checked={rememberMe} onToggle={setRememberMe} />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Primary Sign In Button */}
        <Button
          title={
            alumniMode
              ? 'Submit for approval'
              : superAdminMode
                ? 'Enter Super Admin Console ⚡'
                : 'Sign In to Portal'
          }
          variant="primary"
          size="lg"
          loading={alumniMode ? claiming : isLoading}
          onPress={alumniMode ? onClaimPress : onLoginPress}
          style={styles.signInButton}
        />

        {!superAdminMode && (
          <>
            <Pressable
              onPress={() => {
                setAlumniMode((current) => !current);
                setClaimError(null);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.alumniSwitch}>
              <Text style={styles.forgotPasswordText}>
                {alumniMode ? 'College email login' : 'Alumni? Submit USN and mobile'}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <SocialLoginRow
              onGooglePress={() => Alert.alert('Google Sign-In', 'Google authentication initiated.')}
              onApplePress={() => Alert.alert('Apple Sign-In', 'Apple authentication initiated.')}
            />
          </>
        )}

        {/* Discreet Super Admin Portal Access */}
        <Pressable
          onPress={onToggleSuperAdmin}
          style={styles.superAdminToggleBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={superAdminMode ? 'chevron-back' : 'shield-half-outline'}
            size={13}
            color={superAdminMode ? '#38BDF8' : Colors.text.tertiary}
          />
          <Text
            style={[
              styles.superAdminToggleText,
              superAdminMode && styles.superAdminToggleTextActive,
            ]}>
            {superAdminMode ? 'Return to Student / Faculty Login' : 'Super Admin Portal'}
          </Text>
        </Pressable>
      </Card>

      {/* Footer Registration Link */}
      <View style={styles.footerRow}>
        {!superAdminMode ? (
          <>
            <Text style={styles.footerText}>New to Supercampus? </Text>
            <Pressable
              onPress={() => Alert.alert('Registration', 'Redirecting to Student Registration...')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.footerAdminText}>
            Supercampus System Governance • Isolated Per-Campus Schemas
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  card: {
    padding: 24,
  },
  superAdminHeaderBadge: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  superAdminBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  superAdminHeaderTitle: {
    fontFamily: Typography.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  superAdminHeaderSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: Colors.status.errorBackground,
    borderColor: Colors.status.error,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: Typography.medium,
    color: Colors.status.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: Typography.semiBold,
    color: Colors.primary.cyan,
    fontSize: 13,
    fontWeight: '600',
  },
  signInButton: {
    marginBottom: 12,
  },
  alumniSwitch: {
    alignItems: 'center',
    marginBottom: 16,
  },
  superAdminToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
  },
  superAdminToggleText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: Colors.text.tertiary,
    letterSpacing: 0.2,
  },
  superAdminToggleTextActive: {
    color: '#38BDF8',
    fontFamily: Typography.semiBold,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.subtle,
  },
  dividerText: {
    fontFamily: Typography.medium,
    color: Colors.text.tertiary,
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    fontSize: 14,
  },
  footerAdminText: {
    fontFamily: Typography.regular,
    color: Colors.text.tertiary,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  signUpLink: {
    fontFamily: Typography.bold,
    color: Colors.primary.light,
    fontSize: 14,
    fontWeight: '700',
  },
});
}
