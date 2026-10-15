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
            label="College email"
            placeholder="1nt22ad015.druva@nmit.ac.in"
            leftIcon="mail-outline"
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
        )}

        {/* Options Row: Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <Checkbox label="Remember me" checked={rememberMe} onToggle={setRememberMe} />

          <Pressable
            onPress={() => Alert.alert('Forgot Password', 'Password reset instructions sent.')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Primary Sign In Button */}
        <Button
          title={alumniMode ? 'Submit for approval' : 'Sign In to Portal'}
          variant="primary"
          size="lg"
          loading={alumniMode ? claiming : isLoading}
          onPress={alumniMode ? onClaimPress : onLoginPress}
          style={styles.signInButton}
        />

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
