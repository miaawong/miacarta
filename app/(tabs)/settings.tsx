import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, radius, spacing, type } from '../../constants/theme';
import {
  getAccountInfo,
  linkOAuthIdentity,
  sendPasswordReset,
  signOut,
  upgradeWithEmail,
  type AccountInfo,
} from '../../lib/auth-helpers';
import { getReviewPace, setReviewPace, type ReviewPace } from '../../lib/prefs';
import { ensureSignedIn } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pace, setPace] = useState<ReviewPace>('default');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureSignedIn();
      const [p, info] = await Promise.all([getReviewPace(), getAccountInfo()]);
      setPace(p);
      setAccount(info);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  async function handlePaceChange(next: ReviewPace) {
    setPace(next);
    await setReviewPace(next);
  }

  async function handleLinkOAuth(provider: 'google' | 'apple') {
    setWorking(true);
    try {
      await linkOAuthIdentity(provider);
      await load();
    } catch (e: any) {
      Alert.alert(`${provider === 'apple' ? 'Apple' : 'Google'} sign in failed`, e.message ?? String(e));
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign out?',
      account?.isAnonymous
        ? 'This will reset this device to a new empty anonymous account. Your existing data will only be recoverable if you linked an email or OAuth account.'
        : 'You can sign back in to recover your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            await load();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Review pace */}
        <Section title="Review pace">
          <Text style={styles.sectionDesc}>
            Tighter pace brings cards back sooner. Looser spreads them out. Applied at your next review.
          </Text>
          <View style={styles.segmented}>
            {(['tight', 'default', 'loose'] as ReviewPace[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => handlePaceChange(p)}
                style={[styles.segment, pace === p && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, pace === p && styles.segmentLabelActive]}>
                  {p === 'tight' ? 'Tight' : p === 'loose' ? 'Loose' : 'Default'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Account */}
        <Section title="Account">
          {account?.isAnonymous ? (
            <>
              <Text style={styles.sectionDesc}>
                You're signed in anonymously on this device. Link an account to sync your words across devices.
              </Text>
              <ProviderButton
                label="Continue with Google"
                icon="logo-google"
                onPress={() => handleLinkOAuth('google')}
                disabled={working}
              />
              <ProviderButton
                label="Add email and password"
                icon="mail-outline"
                onPress={() => setEmailModal(true)}
                disabled={working}
              />
              <Pressable style={styles.linkRow} onPress={() => router.push('/sign-in')}>
                <Text style={styles.linkText}>I already have an account · Sign in</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.accountRow}>
                <Ionicons name="person-circle-outline" size={32} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountLabel}>Signed in as</Text>
                  <Text style={styles.accountEmail}>{account?.email ?? 'No email'}</Text>
                  {account?.providers && account.providers.length > 0 ? (
                    <Text style={styles.providerList}>via {account.providers.join(', ')}</Text>
                  ) : null}
                </View>
              </View>
              {account?.providers?.includes('email') ? (
                <Button title="Reset password" variant="secondary" onPress={() => setResetModal(true)} style={{ marginTop: spacing.md }} />
              ) : null}
              <Button title="Sign out" variant="ghost" onPress={handleSignOut} style={{ marginTop: spacing.sm }} />
            </>
          )}
        </Section>

        <Section title="About">
          <Text style={styles.sectionDesc}>Miacarta v1.0</Text>
        </Section>
      </ScrollView>

      <EmailUpgradeModal
        visible={emailModal}
        onClose={() => setEmailModal(false)}
        onSuccess={async () => {
          setEmailModal(false);
          await load();
        }}
      />

      <PasswordResetModal
        visible={resetModal}
        defaultEmail={account?.email ?? ''}
        onClose={() => setResetModal(false)}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ProviderButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.providerBtn,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.providerLabel}>{label}</Text>
    </Pressable>
  );
}

function EmailUpgradeModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Invalid input', 'Email is required and password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await upgradeWithEmail(email.trim(), password);
      Alert.alert(
        'Check your inbox',
        `We sent a verification link to ${email.trim()}. Tap it to confirm and finish linking your account.`,
      );
      setEmail('');
      setPassword('');
      onSuccess();
    } catch (e: any) {
      Alert.alert('Could not link email', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Add Email</Text>
          <View style={{ width: 60 }} />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoFocus
            />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
            />
            <Button
              title={busy ? 'Linking…' : 'Link account'}
              onPress={handleSubmit}
              disabled={busy}
              style={{ marginTop: spacing.xl }}
            />
            <Text style={styles.smallNote}>
              We'll email a verification link. Your current words are preserved.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function PasswordResetModal({
  visible,
  defaultEmail,
  onClose,
}: {
  visible: boolean;
  defaultEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email to receive a reset link.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('Reset email sent', `Check ${email.trim()} for a link to reset your password.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Could not send reset email', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />
          <Button
            title={busy ? 'Sending…' : 'Send reset link'}
            onPress={handleSubmit}
            disabled={busy}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...type.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionBody: { padding: spacing.lg, paddingTop: 0 },
  sectionDesc: { ...type.small, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmentLabel: { ...type.small, color: colors.textMuted },
  segmentLabelActive: { color: colors.text, fontWeight: '600' },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  providerLabel: { ...type.bodyStrong, color: colors.text },
  linkRow: { paddingVertical: spacing.md, alignItems: 'center' },
  linkText: { ...type.small, color: colors.accent },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  accountLabel: { ...type.label, color: colors.textMuted },
  accountEmail: { ...type.bodyStrong, color: colors.text },
  providerList: { ...type.small, color: colors.textSubtle, marginTop: 2 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...type.bodyStrong, color: colors.text },
  modalCancel: { ...type.body, color: colors.accent, width: 60 },
  modalBody: { padding: spacing.xl },
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
  smallNote: { ...type.small, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
});
