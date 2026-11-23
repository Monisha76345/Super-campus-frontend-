import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Checkbox, Input } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

import { authApi } from '../api/authApi';
import { useLogin } from '../hooks/useLogin';
import { useAuthSession } from '../session/AuthSessionProvider';
import { AuthHeader } from './AuthHeader';
import { SocialLoginRow } from './SocialLoginRow';
import { ReferralInputSection } from '@/features/referral';
import { copyReferralLink } from '@/features/referral/referralUtils';

export function LoginForm() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; openReferral?: string }>();
  const { user, isReady, signIn } = useAuthSession();
  const [alumniMode, setAlumniMode] = React.useState(false);
  const [alumniSubMode, setAlumniSubMode] = React.useState<'claim' | 'verify'>('claim');
  const [usn, setUsn] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [claimError, setClaimError] = React.useState<string | null>(null);
  const [claiming, setClaiming] = React.useState(false);

  // If already logged in with an active 7-day session, route directly to home
  React.useEffect(() => {
    if (isReady && user) {
      router.replace('/home');
    }
  }, [isReady, user, router]);

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
    handleSubmit(() => {
      router.replace('/home');
    });
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
      Alert.alert('Submitted 🎉', 'An admin will verify this USN and mobile number. Once approved, return here to activate your account.');
      setAlumniSubMode('verify');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err || '');
      if (msg.includes('already approved')) {
        Alert.alert('Already Approved! ✨', 'Your alumni account is already approved. Request a code to activate and set your password.');
        setAlumniSubMode('verify');
      } else {
        setClaimError(msg || 'Could not submit the alumni request');
      }
    } finally {
      setClaiming(false);
    }
  };

  const onRequestAlumniOtp = async () => {
    setClaimError(null);
    if (!/^[a-zA-Z0-9]{5,32}$/.test(usn.trim())) {
      setClaimError('Enter your valid alumni USN');
      return;
    }
    if (mobile.replace(/\D/g, '').length < 10) {
      setClaimError('Enter your verified 10-digit mobile number');
      return;
    }
    setClaiming(true);
    try {
      const res = await authApi.requestAlumniOtp(usn, mobile);
      setOtpSent(true);
      if (res?.debugOtp) {
        setOtp(res.debugOtp);
        Alert.alert('Code Sent! 📲', `A verification code has been generated.\n\nCode: ${res.debugOtp}`);
      } else {
        Alert.alert('Code Sent! 📲', `A verification code has been sent to your registered mobile number ending in ${res?.destination?.slice(-4) || 'phone'}.`);
      }
    } catch (err: any) {
      setClaimError(err?.message || 'Could not send verification code. Ensure your claim was approved by admin.');
    } finally {
      setClaiming(false);
    }
  };

  const onVerifyAlumni = async () => {
    setClaimError(null);
    if (!otp.trim()) {
      setClaimError('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setClaimError('Password must be at least 6 characters');
      return;
    }
    setClaiming(true);
    try {
      const userSession = await authApi.verifyAlumniAndSetPassword({
        usn,
        mobile,
        otp,
        password: newPassword,
      });
      await signIn(userSession, true);
      Alert.alert('Welcome Back! 🎓', 'Your alumni account has been activated.');
      router.replace('/home');
    } catch (err: any) {
      setClaimError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyAlumniReferral = async () => {
    const code = usn.trim().toUpperCase() || 'ALUMNI2026';
    const link = await copyReferralLink(code);
    Alert.alert(
      'Referral Link Copied! 📋',
      `Your personal invite link:\n\n${link}\n\nCopied to clipboard! Share it with fellow alumni and students.`,
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(520).springify().damping(16)} style={styles.container}>
      <AuthHeader />

      <Card style={styles.card}>
        {alumniMode && (
          <View style={styles.alumniTabSelector}>
            <Pressable
              onPress={() => {
                setAlumniSubMode('claim');
                setClaimError(null);
              }}
              style={[styles.alumniTab, alumniSubMode === 'claim' && styles.alumniTabActive]}>
              <Text style={[styles.alumniTabText, alumniSubMode === 'claim' && styles.alumniTabTextActive]}>
                1. New Claim
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setAlumniSubMode('verify');
                setClaimError(null);
              }}
              style={[styles.alumniTab, alumniSubMode === 'verify' && styles.alumniTabActive]}>
              <Text style={[styles.alumniTabText, alumniSubMode === 'verify' && styles.alumniTabTextActive]}>
                2. Activate Account
              </Text>
            </Pressable>
          </View>
        )}

        {(alumniMode ? claimError : serverError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{alumniMode ? claimError : serverError}</Text>
          </View>
        )}

        {alumniMode ? (
          <>
            <Input
              label="Alumni USN"
              placeholder="1NT18CS001"
              leftIcon="school-outline"
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              value={usn}
              onChangeText={setUsn}
            />

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

            {alumniSubMode === 'verify' && otpSent && (
              <>
                <Input
                  label="6-Digit Verification Code"
                  placeholder="Enter code received"
                  leftIcon="key-outline"
                  keyboardType="number-pad"
                  autoComplete="off"
                  value={otp}
                  onChangeText={setOtp}
                />

                <Input
                  label="Create New Password"
                  placeholder="At least 6 characters"
                  leftIcon="lock-closed-outline"
                  isPassword
                  autoCapitalize="none"
                  autoComplete="off"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Input
              label="USN / Username"
              placeholder="1NT22AD015 or student@nmit.ac.in"
              leftIcon="person-outline"
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

            <Input
              label="Password"
              placeholder="Enter your password"
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
          </>
        )}

        {/* Options Row: Remember Me & Forgot Password (Only on standard login) */}
        {!alumniMode && (
          <View style={styles.optionsRow}>
            <Checkbox label="Remember me" checked={rememberMe} onToggle={setRememberMe} />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </View>
        )}

        {/* Action Button */}
        <Button
          title={
            !alumniMode
              ? 'Sign In to Portal'
              : alumniSubMode === 'claim'
                ? 'Submit for Approval'
                : !otpSent
                  ? 'Request Verification Code'
                  : 'Activate & Sign In'
          }
          variant="primary"
          size="lg"
          loading={alumniMode ? claiming : isLoading}
          onPress={
            !alumniMode
              ? onLoginPress
              : alumniSubMode === 'claim'
                ? onClaimPress
                : !otpSent
                  ? onRequestAlumniOtp
                  : onVerifyAlumni
          }
          style={styles.signInButton}
        />

        {/* Alumni Copy Referral Link Button */}
        {alumniMode && (
          <Pressable
            onPress={handleCopyAlumniReferral}
            style={({ pressed }) => [styles.copyAlumniReferralBtn, pressed && styles.btnPressed]}>
            <Ionicons name="copy-outline" size={15} color="#38BDF8" />
            <Text style={styles.copyAlumniReferralText}>Copy My Referral Link</Text>
          </Pressable>
        )}

        <ReferralInputSection
          initialCode={params.ref}
          forceOpen={params.openReferral === 'true' || Boolean(params.ref)}
        />

        <Pressable
          onPress={() => {
            setAlumniMode((current) => !current);
            setClaimError(null);
            setOtpSent(false);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.alumniSwitch}>
          <Text style={styles.forgotPasswordText}>
            {alumniMode ? 'Back to standard login (USN / Password)' : 'Alumni portal (Claim or Activate)'}
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
      </Card>

      {/* Footer Registration Link */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>New to Supercampus? </Text>
        <Pressable
          onPress={() => Alert.alert('Registration', 'Redirecting to Student Registration...')}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.signUpLink}>Create Account</Text>
        </Pressable>
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
    alumniTabSelector: {
      flexDirection: 'row',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
      borderRadius: 10,
      padding: 3,
      marginBottom: 16,
    },
    alumniTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    alumniTabActive: {
      backgroundColor: '#2563EB',
    },
    alumniTabText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    alumniTabTextActive: {
      fontFamily: Typography.bold,
      color: '#FFFFFF',
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
    copyAlumniReferralBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      marginBottom: 12,
      borderRadius: 10,
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    copyAlumniReferralText: {
      fontFamily: Typography.semiBold,
      fontSize: 13,
      color: '#38BDF8',
      fontWeight: '600',
    },
    btnPressed: {
      opacity: 0.7,
    },
    alumniSwitch: {
      alignItems: 'center',
      marginBottom: 16,
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
    signUpLink: {
      fontFamily: Typography.bold,
      color: Colors.primary.light,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
