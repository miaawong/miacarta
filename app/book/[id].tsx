import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ensureSignedIn } from '../../lib/supabase';
import { deleteBook, deleteWord, listBooks, listWords } from '../../lib/db';
import { colors, radius, spacing, type } from '../../constants/theme';
import type { Book, Word } from '../../types';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isUntagged = id === 'untagged';

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [words, setWords] = useState<Word[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await ensureSignedIn();
      if (isUntagged) {
        const ws = await listWords(userId, null);
        setBook(null);
        setWords(ws);
      } else {
        const [allBooks, ws] = await Promise.all([listBooks(userId), listWords(userId, id)]);
        setBook(allBooks.find((b) => b.id === id) ?? null);
        setWords(ws);
      }
    } finally {
      setLoading(false);
    }
  }, [id, isUntagged]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDeleteWord(w: Word) {
    Alert.alert('Delete word?', `Remove "${w.word}" and its review history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWord(w.id);
          load();
        },
      },
    ]);
  }

  async function handleDeleteBook() {
    if (!book) return;
    Alert.alert(
      'Delete book?',
      'Words tagged to this book will become untagged (not deleted).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            isUntagged ? null : (
              <Pressable onPress={handleDeleteBook} hitSlop={12} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
              </Pressable>
            ),
        }}
      />
      <View style={styles.wrap}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>{isUntagged ? 'Untagged' : book?.title ?? 'Book not found'}</Text>
            {!isUntagged && book?.author ? <Text style={styles.author}>{book.author}</Text> : null}
            <Text style={styles.count}>
              {words.length} {words.length === 1 ? 'word' : 'words'}
            </Text>

            {words.length === 0 ? (
              <Text style={styles.empty}>No words here yet.</Text>
            ) : (
              words.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => router.push(`/word/${w.id}`)}
                  onLongPress={() => handleDeleteWord(w)}
                  style={({ pressed }) => [styles.wordRow, pressed && { opacity: 0.7 }]}
                >
                  <View style={styles.wordHeader}>
                    <Text style={styles.word}>{w.word}</Text>
                    {w.part_of_speech ? <Text style={styles.pos}>{w.part_of_speech}</Text> : null}
                  </View>
                  <Text style={styles.definition} numberOfLines={2}>
                    {w.definition}
                  </Text>
                  {w.example ? (
                    <Text style={styles.exampleLine} numberOfLines={1}>
                      "{w.example}"
                    </Text>
                  ) : null}
                </Pressable>
              ))
            )}

            {words.length > 0 ? (
              <Text style={styles.hint}>Tap a word to edit. Long-press to delete.</Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...type.display, color: colors.text },
  author: { ...type.body, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  count: { ...type.small, color: colors.textSubtle, marginTop: spacing.sm, marginBottom: spacing.lg },
  empty: { ...type.body, color: colors.textMuted, marginTop: spacing.xl },
  wordRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  wordHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.xs },
  word: { ...type.bodyStrong, color: colors.text },
  pos: { ...type.small, color: colors.accent, fontStyle: 'italic' },
  definition: { ...type.small, color: colors.textMuted, lineHeight: 20 },
  exampleLine: { ...type.small, color: colors.textSubtle, fontStyle: 'italic', marginTop: 4 },
  hint: { ...type.small, color: colors.textSubtle, textAlign: 'center', marginTop: spacing.lg },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});
