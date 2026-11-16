import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// ─── Error helpers (same rules as the web Auth page) ─────────────────────────

export function formatAuthError(err) {
  const message = typeof err === 'string' ? err : err?.message;
  if (!message) return 'An error occurred';
  const lower = message.toLowerCase();

  if (err?.status === 429 || lower.includes('rate') || lower.includes('too many')) {
    return 'Email rate limit reached. If you already signed up, switch to Log in or use Google sign-in.';
  }
  if (lower.includes('password') && /\d+/.test(message)) {
    return 'Password must be at least 6 characters';
  }
  if (lower.includes('missing email')) {
    return 'Please enter your email';
  }
  return message;
}

export function isAuthRateLimitError(err) {
  const message = (typeof err === 'string' ? err : err?.message || '').toLowerCase();
  return err?.status === 429 || message.includes('rate') || message.includes('too many');
}

export function getRetrySeconds(err) {
  const message = typeof err === 'string' ? err : err?.message || '';
  const match = message.match(/(\d+)\s*(second|sec|minute|min)/i);
  if (!match) return 60;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 60;
  return match[2].toLowerCase().startsWith('min') ? amount * 60 : amount;
}

// Every signed-in user needs a profiles row before onboarding writes to it.
export async function ensureProfileRow(uid) {
  if (!uid) return;
  await supabase.from('profiles').upsert({ id: uid }, { onConflict: 'id' });
}

// ─── Google (OAuth in an in-app browser sheet) ───────────────────────────────

// athlio://auth/callback in builds. Must be in Supabase → Auth → URL Configuration
// → Redirect URLs (add `athlio://**`).
const redirectTo = Linking.createURL('auth/callback');

// Supabase returns tokens in the URL fragment (implicit flow) or a `code`
// in the query (PKCE flow). Handle both.
async function createSessionFromUrl(url) {
  const params = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    for (const [k, v] of new URLSearchParams(part)) params[k] = v;
  }

  if (params.error_description || params.error) {
    throw new Error(params.error_description || params.error);
  }
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return;
  }
  throw new Error('Sign-in was not completed.');
}

/** Returns true if the user signed in, false if they closed the sheet. */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  await createSessionFromUrl(result.url);
  const { data: userData } = await supabase.auth.getUser();
  await ensureProfileRow(userData?.user?.id);
  return true;
}

// ─── Apple (native sheet, iOS only) ──────────────────────────────────────────

export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/** Returns true if the user signed in, false if they cancelled. */
export async function signInWithApple() {
  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }

  if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only sends the name on the very first sign-in, so keep it in the
  // user's metadata; the onboarding wizard pre-fills the name step from it.
  const { givenName, middleName, familyName } = credential.fullName ?? {};
  const fullName = [givenName, middleName, familyName].filter(Boolean).join(' ');
  if (fullName) {
    await supabase.auth.updateUser({
      data: { full_name: fullName, given_name: givenName, family_name: familyName },
    });
  }

  await ensureProfileRow(data?.user?.id);
  return true;
}
