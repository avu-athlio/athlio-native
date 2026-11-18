import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { AppleLogo, CheckSquare, Square } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import {
  ensureProfileRow,
  formatAuthError,
  getRetrySeconds,
  isAppleSignInAvailable,
  isAuthRateLimitError,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, type } from '@/theme';
import { validateEmail } from '@/utils/validate';

const googleIcon = require('@/assets/logos/Google.svg');

// Sign-in and sign-up. On success we only create the profile row: the root
// layout's guards then move the user to onboarding or the app.
export default function Auth() {
  const params = useLocalSearchParams();
  const [mode, setMode] = useState(params.mode === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => setCooldownLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  const isSignup = mode === 'signup';
  const signupBlocked = isSignup && cooldownLeft > 0;

  function showError(message) {
    setInfo('');
    setErr(message);
  }

  async function submit() {
    if (isSubmitting || signupBlocked) return;
    setErr('');
    setInfo('');

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) return showError('Please enter a valid email address.');
    if (isSignup && !agreeTerms) {
      return showError('Please accept the Terms and Conditions and Privacy Policy.');
    }
    if (isSignup && password !== confirmPassword) return showError('Passwords do not match.');

    setIsSubmitting(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });

        if (error && isAuthRateLimitError(error)) {
          // Supabase rate-limits signup emails. The account may already exist
          // from an earlier attempt, so try logging in before giving up.
          const { data: fallback, error: fallbackErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!fallbackErr && fallback?.user?.id) {
            await ensureProfileRow(fallback.user.id);
            return;
          }
          setMode('login');
          setCooldownLeft(getRetrySeconds(error));
          return showError(
            'Signup limit reached. If you already signed up, log in below. Otherwise wait a moment and try again.',
          );
        }
        if (error) return showError(formatAuthError(error));

        if (data?.session && data.user?.id) {
          await ensureProfileRow(data.user.id);
          return;
        }

        // No session: email confirmation is on in Supabase.
        setMode('login');
        setInfo('Check your email to confirm your account, then log in.');
        return;
      }

      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (loginErr) {
        if (isAuthRateLimitError(loginErr)) setCooldownLeft(getRetrySeconds(loginErr));
        return showError(formatAuthError(loginErr));
      }
      await ensureProfileRow(loginData?.user?.id);
    } catch (e) {
      showError(formatAuthError(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function social(signIn) {
    if (isSubmitting) return;
    setErr('');
    setInfo('');
    setIsSubmitting(true);
    try {
      await signIn();
    } catch (e) {
      showError(formatAuthError(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <Logo variant="small" height={48} style={styles.logo} />

          <View style={styles.header}>
            <Text style={[type['heading-5xl-italic'], styles.title]}>
              {isSignup ? 'Create account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Get access to the biggest database of athletes.'
                : 'Welcome back. Enter your credentials to continue.'}
            </Text>
          </View>

          <View style={styles.inputs}>
            <AuthField
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              submitBehavior="submit"
            />
            <AuthField
              ref={passwordRef}
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              textContentType={isSignup ? 'newPassword' : 'password'}
              returnKeyType={isSignup ? 'next' : 'go'}
              onSubmitEditing={isSignup ? () => confirmRef.current?.focus() : submit}
              submitBehavior={isSignup ? 'submit' : 'blurAndSubmit'}
            />
            {isSignup ? (
              <AuthField
                ref={confirmRef}
                placeholder="Confirm password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            ) : null}

            {isSignup ? (
              <Pressable
                style={styles.terms}
                onPress={() => setAgreeTerms((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreeTerms }}>
                {agreeTerms ? (
                  <CheckSquare size={20} weight="fill" color={colors.primary.default} />
                ) : (
                  <Square size={20} color={colors.neutral[700]} />
                )}
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Pressable>
            ) : null}

            {err ? <Text style={styles.error}>{err}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Button
              size="big"
              label={
                signupBlocked
                  ? `Try again in ${cooldownLeft}s`
                  : isSignup
                    ? 'Create an account'
                    : 'Log in'
              }
              onPress={submit}
              disabled={isSubmitting || signupBlocked}
            />
          </View>

          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>
              or {isSignup ? 'sign up' : 'log in'} with
            </Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
              onPress={() => social(signInWithGoogle)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google">
              <Image source={googleIcon} style={styles.socialIcon} contentFit="contain" />
            </Pressable>
            {appleAvailable ? (
              <Pressable
                style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
                onPress={() => social(signInWithApple)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple">
                <AppleLogo size={22} weight="fill" color={colors.black} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Button
              type="subtle"
              size="small"
              label={isSignup ? 'Log in' : 'Sign up'}
              onPress={() => {
                setErr('');
                setInfo('');
                setMode((m) => (m === 'signup' ? 'login' : 'signup'));
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AuthField({ ref, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.neutral[700]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.field, focused && styles.fieldFocused]}
      accessibilityLabel={props.placeholder?.replace(' *', '')}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28 },
  logo: { marginBottom: 26 },
  header: { marginBottom: 26, alignItems: 'center' },
  title: { color: colors.black, textAlign: 'center', letterSpacing: -1.5, lineHeight: 44 },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 19,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  inputs: { alignSelf: 'stretch', gap: 16 },
  field: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.black,
  },
  fieldFocused: { backgroundColor: colors.neutral[300], borderColor: colors.primary.default },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2 },
  termsText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.neutral[700] },
  termsLink: { fontFamily: fonts.medium, color: colors.primary.default },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.negative.default },
  info: { fontFamily: fonts.regular, fontSize: 14, color: colors.success.default },
  separator: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 34,
    marginBottom: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.neutral[300] },
  separatorText: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700] },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 4 },
  socialButton: {
    width: 56,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { width: 22, height: 22 },
  pressed: { opacity: 0.6 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  toggleText: { fontFamily: fonts.regular, fontSize: 16, color: colors.neutral[700] },
});
