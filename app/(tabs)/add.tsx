import { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/Button';
import { CardStack } from '../../components/CardStack';
import { ensureSignedIn } from '../../lib/supabase';
import { createWord, listBooks } from '../../lib/db';
import { lookupWord, suggestWords } from '../../lib/dictionary';
import { colors, radius, spacing, type } from '../../constants/theme';
import type { Book, DictionaryDefinition } from '../../types';

export default function AddWordScreen() {
  const router = useRouter();
  const { bookId: initialBookId } = useLocalSearchParams<{ bookId?: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [word, setWord] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [defs, setDefs] = useState<DictionaryDefinition[] | null>(null);
  const [selectedDef, setSelectedDef] = useState<number | null>(null);
  const [showAllDefs, setShowAllDefs] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualPos, setManualPos] = useState('');
  const [manualDef, setManualDef] = useState('');
  const [manualExample, setManualExample] = useState('');
  const [bookId, setBookId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const suggestSeqRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      ensureSignedIn()
        .then(listBooks)
        .then(setBooks)
        .catch(() => {});
      if (initialBookId) setBookId(initialBookId);
    }, [initialBookId]),
  );

  useEffect(() => {
    if (defs || manualMode) {
      setSuggestions([]);
      return;
    }
    const w = word.trim();
    if (w.length < 2) {
      setSuggestions([]);
      return;
    }
    const seq = ++suggestSeqRef.current;
    const handle = setTimeout(async () => {
      try {
        const results = await suggestWords(w);
        if (seq === suggestSeqRef.current) setSuggestions(results);
      } catch {
        if (seq === suggestSeqRef.current) setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [word, defs, manualMode]);

  function reset() {
    setWord('');
    setSuggestions([]);
    setDefs(null);
    setSelectedDef(null);
    setShowAllDefs(false);
    setNotFound(false);
    setManualMode(false);
    setManualPos('');
    setManualDef('');
    setManualExample('');
    setBookId(null);
    setNotes('');
  }

  async function runLookup(target?: string) {
    const w = (target ?? word).trim();
    if (!w) return;
    if (target) setWord(target);
    setLookingUp(true);
    setSuggestions([]);
    setDefs(null);
    setSelectedDef(null);
    setShowAllDefs(false);
    setNotFound(false);
    setManualMode(false);
    try {
      const results = await lookupWord(w);
      if (results.length === 0) {
        setNotFound(true);
      } else {
        setDefs(results);
        setSelectedDef(0);
      }
    } catch (e: any) {
      Alert.alert('Lookup failed', e.message ?? String(e));
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSave() {
    let pos: string | null;
    let definition: string;
    let example: string | null;

    if (manualMode) {
      if (!manualDef.trim()) {
        Alert.alert('Definition required', 'Write a definition before saving.');
        return;
      }
      pos = manualPos.trim() || null;
      definition = manualDef.trim();
      example = manualExample.trim() || null;
    } else if (defs && selectedDef !== null) {
      const def = defs[selectedDef];
      pos = def.partOfSpeech ?? null;
      definition = def.definition;
      example = def.example ?? null;
    } else {
      Alert.alert('Pick a definition', 'Look up the word and choose a definition first.');
      return;
    }

    setSaving(true);
    try {
      const userId = await ensureSignedIn();
      await createWord(userId, {
        word: word.trim(),
        part_of_speech: pos,
        definition,
        example,
        user_notes: notes.trim() || null,
        book_id: bookId,
      });
      reset();
      router.push('/library');
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  const showTagAndNotes = (defs && selectedDef !== null) || manualMode;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Add Word" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.lookupRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={word}
              onChangeText={(t) => {
                setWord(t);
                setDefs(null);
                setNotFound(false);
                setManualMode(false);
              }}
              placeholder="Type a word"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => runLookup()}
            />
            <Pressable
              onPress={() => runLookup()}
              disabled={lookingUp || !word.trim()}
              style={({ pressed }) => [
                styles.lookupBtn,
                (pressed || lookingUp || !word.trim()) && { opacity: 0.6 },
              ]}
            >
              {lookingUp ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Ionicons name="search" size={20} color={colors.accent} />
              )}
            </Pressable>
          </View>

          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => runLookup(s)}
                  style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.accentMuted }]}
                >
                  <Ionicons name="search" size={14} color={colors.textSubtle} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!word.trim() && !defs && !notFound && !manualMode ? (
            <View style={styles.emptyWrap}>
              <CardStack size="lg" />
              <Text style={styles.emptyTitle}>Caught a new word?</Text>
              <Text style={styles.emptyBody}>
                Type any word above — from a novel, an article, a stray sentence — and we'll pull the
                definition. Tag it to a book, add a note, and it'll come back at the right moment.
              </Text>
            </View>
          ) : null}

          {notFound && !manualMode ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.notFound}>No definition found for "{word.trim()}".</Text>
              <Button
                title="Write my own definition"
                variant="secondary"
                onPress={() => {
                  setManualMode(true);
                  setNotFound(false);
                }}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : null}

          {defs && !manualMode ? (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.label}>Choose a definition</Text>
              {(showAllDefs ? defs : defs.slice(0, 5)).map((d, i) => {
                const selected = selectedDef === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedDef(i)}
                    style={[styles.defCard, selected && styles.defCardSelected]}
                  >
                    <View style={styles.defHeader}>
                      <Text style={styles.posBadge}>{d.partOfSpeech}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
                    </View>
                    <Text style={styles.defText}>{d.definition}</Text>
                    {d.example ? <Text style={styles.defExample}>"{d.example}"</Text> : null}
                  </Pressable>
                );
              })}

              {defs.length > 5 && !showAllDefs ? (
                <Pressable onPress={() => setShowAllDefs(true)} style={styles.linkBtn}>
                  <Ionicons name="chevron-down" size={16} color={colors.accent} />
                  <Text style={styles.linkBtnText}>Show {defs.length - 5} more</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => {
                  setManualMode(true);
                  setSelectedDef(null);
                }}
                style={styles.linkBtn}
              >
                <Ionicons name="create-outline" size={16} color={colors.accent} />
                <Text style={styles.linkBtnText}>None of these — write my own</Text>
              </Pressable>
            </View>
          ) : null}

          {manualMode ? (
            <View style={{ marginTop: spacing.lg }}>
              {defs ? (
                <Pressable
                  onPress={() => setManualMode(false)}
                  style={[styles.linkBtn, { marginTop: 0, marginBottom: spacing.md }]}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.accent} />
                  <Text style={styles.linkBtnText}>Back to the {defs.length} suggested definitions</Text>
                </Pressable>
              ) : null}
              <Text style={styles.label}>Part of speech (optional)</Text>
              <TextInput
                style={styles.input}
                value={manualPos}
                onChangeText={setManualPos}
                placeholder="noun, verb, adjective…"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { marginTop: spacing.md }]}>Definition *</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={manualDef}
                onChangeText={setManualDef}
                placeholder="Write the definition in your own words"
                placeholderTextColor={colors.textSubtle}
                multiline
              />

              <Text style={[styles.label, { marginTop: spacing.md }]}>Example (optional)</Text>
              <TextInput
                style={styles.input}
                value={manualExample}
                onChangeText={setManualExample}
                placeholder="A sentence using the word"
                placeholderTextColor={colors.textSubtle}
              />
            </View>
          ) : null}

          {showTagAndNotes ? (
            <>
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

              <Text style={[styles.label, { marginTop: spacing.lg }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Context from your reading, your own gloss, etc."
                placeholderTextColor={colors.textSubtle}
                multiline
              />

              <Button
                title={saving ? 'Saving…' : 'Save Card'}
                onPress={handleSave}
                disabled={saving}
                style={{ marginTop: spacing.xl }}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  lookupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...type.body,
    color: colors.text,
  },
  lookupBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { ...type.body, color: colors.text },
  notFound: { ...type.small, color: colors.textMuted, fontStyle: 'italic' },
  label: { ...type.label, color: colors.textMuted, marginBottom: spacing.sm },
  defCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  defCardSelected: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  defHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  posBadge: { ...type.label, color: colors.accent },
  defText: { ...type.body, color: colors.text, lineHeight: 22 },
  defExample: { ...type.small, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.xs },
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
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  linkBtnText: { ...type.small, color: colors.accent, fontWeight: '600' },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    ...type.title,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
