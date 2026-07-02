import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithOAuth,
} from '../lib/auth-helpers';
import { colors, radius, spacing, type } from '../constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleEmailSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/settings');
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setBusy(true);
    try {
      await signInWithOAuth(provider);
      router.replace('/settings');
    } catch (e: any) {
      const msg = e.message ?? String(e);
      if (/cancel/i.test(msg)) {
        Alert.alert(
          "Couldn't finish sign-in",
          "OAuth sign-in on a fresh device only works in a real build (TestFlight or App Store). In Expo Go, the browser can't hand the session back to the app.\n\nIf you completed Google sign-in just now, it worked on Google's side but can't propagate to Expo Go. Options: (1) use email/password if you added one to this account, or (2) build a dev-client with EAS to test OAuth sign-in end-to-end.",
        );
      } else {
        Alert.alert(`${provider === 'apple' ? 'Apple' : 'Google'} sign in failed`, msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email first', 'Type your email above so we know where to send the reset link.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('Reset email sent', `Check ${email.trim()} for a link to reset your password.`);
    } catch (e: any) {
      Alert.alert('Could not send reset email', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to recover your words. This will sign you out of the anonymous account on this device.
            </Text>

            <Text style={[styles.label, { marginTop: spacing.xl }]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title={busy ? 'Signing in…' : 'Sign in with email'}
              onPress={handleEmailSignIn}
              disabled={busy}
              style={{ marginTop: spacing.lg }}
            />

            <Pressable onPress={handleForgotPassword} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => handleOAuth('google')}
              disabled={busy}
              style={({ pressed }) => [styles.providerBtn, (pressed || busy) && { opacity: 0.6 }]}
            >
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={styles.providerLabel}>Continue with Google</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted, marginTop: spacing.sm },
  label: { ...type.label, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...type.body,
    color: colors.text,
  },
  forgotRow: { paddingVertical: spacing.md, alignItems: 'center' },
  forgotText: { ...type.small, color: colors.accent },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...type.small, color: colors.textSubtle },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  providerLabel: { ...type.bodyStrong, color: colors.text },
});
