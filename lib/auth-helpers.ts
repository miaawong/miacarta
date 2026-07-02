import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type Provider = 'google' | 'apple';

export function getRedirectUrl(): string {
  const url = AuthSession.makeRedirectUri({ scheme: 'miacarta', path: 'auth-callback' });
  if (__DEV__) console.log('[auth] redirect URL ->', url);
  return url;
}

async function completeOAuth(
  url: string,
  redirectTo: string,
  allowServerSideFallback = false,
): Promise<void> {
  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);

  if (result.type === 'success') {
    const parsed = new URL(result.url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return;
    }
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      return;
    }
    throw new Error('No auth code returned from provider');
  }

  // Non-success result (browser dismissed) — for linkIdentity in Expo Go, the
  // server-side link may still have completed. Refresh session and verify.
  if (allowServerSideFallback) {
    await new Promise((r) => setTimeout(r, 400));
    await supabase.auth.refreshSession().catch(() => {});
    const { data } = await supabase.auth.getUser();
    const linked = data.user && data.user.is_anonymous === false;
    if (linked) return;
  }

  throw new Error('Sign in cancelled');
}

const googleQueryParams = {
  prompt: 'select_account',
  access_type: 'offline',
};

export async function linkOAuthIdentity(provider: Provider): Promise<void> {
  const redirectTo = getRedirectUrl();
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? googleQueryParams : undefined,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');
  await completeOAuth(data.url, redirectTo, true);
}

export async function signInWithOAuth(provider: Provider): Promise<void> {
  const redirectTo = getRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? googleQueryParams : undefined,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');
  await completeOAuth(data.url, redirectTo);
}

export async function upgradeWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl(),
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export type AccountInfo = {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
  providers: string[];
};

export async function getAccountInfo(): Promise<AccountInfo | null> {
  // Force a session refresh so we pick up server-side changes since last check
  // (e.g. user just verified their email on the web page).
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    await supabase.auth.refreshSession().catch(() => {});
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const providers = (data.user.identities ?? []).map((i) => i.provider);
  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    isAnonymous: data.user.is_anonymous ?? false,
    providers,
  };
}
