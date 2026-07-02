import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, spacing, type } from '../constants/theme';
import { ensureSignedIn } from '../lib/supabase';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSignedIn()
      .then(() => setReady(true))
      .catch((e) => setError(e.message ?? String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.errWrap}>
        <Text style={styles.errTitle}>Couldn't connect</Text>
        <Text style={styles.errBody}>{error}</Text>
        <Text style={styles.errHint}>
          If this is your first run, double-check that anonymous sign-ins are enabled in your Supabase
          project (Authentication → Providers → Anonymous → Enabled).
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="book/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="word/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.text,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errWrap: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  errTitle: { ...type.title, color: colors.text },
  errBody: { ...type.body, color: colors.danger },
  errHint: { ...type.small, color: colors.textMuted },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
