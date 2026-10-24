import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Input } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { useAppTheme } from '@/theme/app-theme';
import { authApi } from '../api/authApi';
import { useAuthSession } from '../session/AuthSessionProvider';

type Step = 'email' | 'otp' | 'password' | 'success';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { scheme, colors: Colors } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const { signIn } = useAuthSession();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend Countdown Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your college email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await authApi.requestForgotPasswordOtp(trimmed);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      setResendCooldown(45);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyForgotPasswordOtp(email, trimmedOtp);
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password & Auto-login
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const session = await authApi.resetPassword(resetToken, newPassword);
      await signIn(session, true);
      setStep('success');
      setTimeout(() => {
        router.replace('/home');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP action
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.requestForgotPasswordOtp(email);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      setResendCooldown(45);
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back to Login link */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={12}>
        <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </Pressable>

      {/* Brand Icon with Glow */}
      <View style={styles.iconGlowWrapper}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              step === 'email'
                ? 'key-outline'
                : step === 'otp'
                  ? 'shield-checkmark-outline'
                  : step === 'password'
                    ? 'lock-closed-outline'
                    : 'checkmark-circle-outline'
            }
            size={32}
            color={step === 'success' ? '#10B981' : Colors.primary.light}
          />
        </View>
      </View>

      {/* Badge */}
      <View style={styles.badge}>
        <View style={styles.statusDot} />
        <Text style={styles.badgeText}>ACCOUNT RECOVERY</Text>
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.title}>
        {step === 'email' && 'Forgot Password?'}
        {step === 'otp' && 'Verify Your Identity'}
        {step === 'password' && 'Set New Password'}
        {step === 'success' && 'Password Updated!'}
      </Text>

      <Text style={styles.subtitle}>
        {step === 'email' &&
          'Enter your registered college email and we will send you a 6-digit verification code.'}
        {step === 'otp' &&
          `Enter the 6-digit code sent to ${email}.`}
        {step === 'password' &&
          'Create a secure password with at least 8 characters for your campus account.'}
        {step === 'success' &&
          'Your password has been changed successfully. Redirecting you to the portal...'}
      </Text>

      {/* Step Indicators */}
      {step !== 'success' && (
        <View style={styles.stepsRow}>
          <View style={[styles.stepDot, styles.stepActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={[styles.stepLine, (step === 'otp' || step === 'password') && styles.stepLineActive]} />
          <View style={[styles.stepDot, (step === 'otp' || step === 'password') && styles.stepActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={[styles.stepLine, step === 'password' && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 'password' && styles.stepActive]}>
            <Text style={styles.stepNum}>3</Text>
          </View>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Step 1: Email Form */}
      {step === 'email' && (
        <View style={styles.formSection}>
          <Input
            label="College email"
            placeholder="1nt22ad015.druva@nmit.ac.in"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
          />

          <Button
            title="Send Verification Code"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleRequestOtp}
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* Step 2: OTP Form */}
      {step === 'otp' && (
        <View style={styles.formSection}>
          {debugOtp && (
            <Pressable
              onPress={() => setOtp(debugOtp)}
              style={styles.devPill}>
              <Ionicons name="flask-outline" size={15} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.devPillText}>
                Dev OTP: <Text style={{ fontWeight: '800' }}>{debugOtp}</Text> (Tap to fill)
              </Text>
            </Pressable>
          )}

          <Input
            label="6-Digit Verification Code"
            placeholder="• • • • • •"
            leftIcon="keypad-outline"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setError(null);
            }}
          />

          <View style={styles.resendRow}>
            {resendCooldown > 0 ? (
              <Text style={styles.cooldownText}>Resend code in {resendCooldown}s</Text>
            ) : (
              <Pressable onPress={handleResendOtp} hitSlop={8}>
                <Text style={styles.resendLink}>Didn't receive code? Resend</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setStep('email');
                setError(null);
              }}
              hitSlop={8}>
              <Text style={styles.changeEmailLink}>Change email</Text>
            </Pressable>
          </View>

          <Button
            title="Verify Code"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleVerifyOtp}
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* Step 3: Password Form */}
      {step === 'password' && (
        <View style={styles.formSection}>
          <Input
            label="New password"
            placeholder="At least 8 characters"
            leftIcon="lock-closed-outline"
            isPassword
            autoCapitalize="none"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError(null);
            }}
          />

          <Input
            label="Confirm new password"
            placeholder="Re-enter your password"
            leftIcon="lock-closed-outline"
            isPassword
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
          />

          <Button
            title="Update Password & Sign In"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleResetPassword}
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* Step 4: Success State */}
      {step === 'success' && (
        <View style={styles.successBox}>
          <ActivityIndicator size="large" color={Colors.primary.main} style={{ marginTop: 20 }} />
          <Text style={styles.redirectText}>Opening your campus portal...</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(Colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 4,
      paddingTop: 10,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      alignSelf: 'flex-start',
    },
    backButtonText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: Colors.text.secondary,
      marginLeft: 6,
    },
    iconGlowWrapper: {
      alignSelf: 'center',
      padding: 6,
      borderRadius: 30,
      backgroundColor: isDark ? 'rgba(79, 70, 229, 0.25)' : 'rgba(49, 52, 145, 0.1)',
      marginBottom: 16,
    },
    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: 24,
      backgroundColor: isDark ? Colors.background.elevated : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(129, 140, 248, 0.5)' : 'rgba(49, 52, 145, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.65 : 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(49, 52, 145, 0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(49, 52, 145, 0.16)',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      marginBottom: 14,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? Colors.primary.cyan : Colors.primary.main,
      marginRight: 6,
    },
    badgeText: {
      color: isDark ? Colors.primary.cyan : Colors.primary.main,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: Typography.bold,
      fontSize: 26,
      fontWeight: '800',
      color: Colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.secondary,
      textAlign: 'center',
      maxWidth: 320,
      alignSelf: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    stepsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? '#334155' : '#CBD5E1',
    },
    stepActive: {
      backgroundColor: '#2563EB',
      borderColor: '#38BDF8',
    },
    stepNum: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#FFFFFF',
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
      marginHorizontal: 4,
    },
    stepLineActive: {
      backgroundColor: '#2563EB',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      marginBottom: 16,
    },
    errorText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#EF4444',
      flex: 1,
    },
    formSection: {
      gap: 14,
    },
    actionBtn: {
      marginTop: 8,
    },
    devPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.25)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 4,
    },
    devPillText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: -4,
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    cooldownText: {
      fontFamily: Typography.regular,
      fontSize: 12.5,
      color: Colors.text.tertiary,
    },
    resendLink: {
      fontFamily: Typography.semiBold,
      fontSize: 12.5,
      color: isDark ? '#38BDF8' : Colors.primary.main,
    },
    changeEmailLink: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.secondary,
    },
    successBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    redirectText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      color: Colors.text.secondary,
      marginTop: 14,
    },
  });
}
