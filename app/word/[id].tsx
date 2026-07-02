import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/Button';
import { ensureSignedIn } from '../../lib/supabase';
import { deleteWord, getWord, listBooks, updateWord } from '../../lib/db';
import { colors, radius, spacing, type } from '../../constants/theme';
import type { Book, Word } from '../../types';

export default function EditWordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState<Word | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  const [pos, setPos] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [bookId, setBookId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const userId = await ensureSignedIn();
      const [w, bs] = await Promise.all([getWord(id), listBooks(userId)]);
      setWord(w);
      setBooks(bs);
      if (w) {
        setPos(w.part_of_speech ?? '');
        setDefinition(w.definition);
        setExample(w.example ?? '');
        setBookId(w.book_id);
        setNotes(w.user_notes ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSave() {
    if (!word) return;
    if (!definition.trim()) {
      Alert.alert('Definition required', 'A card needs a definition.');
      return;
    }
    setSaving(true);
    try {
      await updateWord(word.id, {
        part_of_speech: pos.trim() || null,
        definition: definition.trim(),
        example: example.trim() || null,
        user_notes: notes.trim() || null,
        book_id: bookId,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!word) return;
    Alert.alert('Delete word?', `Remove "${word.word}" and its review history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWord(word.id);
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: '' }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </>
    );
  }

  if (!word) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: '' }} />
        <View style={styles.loadingWrap}>
          <Text style={styles.notFound}>Word not found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={12} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.word}>{word.word}</Text>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Part of speech</Text>
          <TextInput
            style={styles.input}
            value={pos}
            onChangeText={setPos}
            placeholder="noun, verb, adjective…"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Definition</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={definition}
            onChangeText={setDefinition}
            multiline
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Example</Text>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            value={example}
            onChangeText={setExample}
            placeholder="(optional)"
            placeholderTextColor={colors.textSubtle}
            multiline
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Tag to book</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookChips}
            keyboardShouldPersistTaps="handled"
          >
            <BookChip label="No book" selected={bookId === null} onPress={() => setBookId(null)} />
            {books.map((b) => (
              <BookChip
                key={b.id}
                label={b.title}
                selected={bookId === b.id}
                onPress={() => setBookId(b.id)}
              />
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="(optional)"
            placeholderTextColor={colors.textSubtle}
            multiline
          />

          <Button
            title={saving ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function BookChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: { ...type.body, color: colors.textMuted },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  word: { ...type.display, color: colors.text },
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
  bookChips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 200,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { ...type.small, color: colors.text },
  chipLabelSelected: { color: '#fff', fontWeight: '600' },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});
