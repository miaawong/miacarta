import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/Button';
import { ensureSignedIn } from '../../lib/supabase';
import { countWordsByBook, createBook, deleteBook, listBooks } from '../../lib/db';
import { colors, radius, spacing, type } from '../../constants/theme';
import type { Book } from '../../types';

export default function LibraryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await ensureSignedIn();
      const [bs, cs] = await Promise.all([listBooks(userId), countWordsByBook(userId)]);
      setBooks(bs);
      setCounts(cs);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreate() {
    if (!newTitle.trim()) {
      Alert.alert('Title required', 'Give your book a title before saving.');
      return;
    }
    setSaving(true);
    try {
      const userId = await ensureSignedIn();
      await createBook(userId, newTitle, newAuthor || undefined);
      setNewTitle('');
      setNewAuthor('');
      setModalOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteBook(b: Book) {
    Alert.alert(
      `Delete "${b.title}"?`,
      'Words tagged to this book will become untagged (not deleted).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(b.id);
            await load();
          },
        },
      ],
    );
  }

  const untaggedCount = counts['__untagged__'] ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Library" subtitle={`${books.length} ${books.length === 1 ? 'book' : 'books'}`} />
        <Pressable onPress={() => setModalOpen(true)} style={styles.addBtn} hitSlop={12}>
          <Ionicons name="add" size={26} color={colors.accent} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {untaggedCount > 0 ? (
            <Pressable onPress={() => router.push('/book/untagged')} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Untagged words</Text>
                <Text style={styles.rowSub}>
                  {untaggedCount} {untaggedCount === 1 ? 'word' : 'words'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
            </Pressable>
          ) : null}

          {books.map((b) => {
            const c = counts[b.id] ?? 0;
            return (
              <Swipeable
                key={b.id}
                containerStyle={styles.swipeContainer}
                renderRightActions={() => (
                  <Pressable
                    onPress={() => handleDeleteBook(b)}
                    style={styles.deleteAction}
                  >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                    <Text style={styles.deleteLabel}>Delete</Text>
                  </Pressable>
                )}
                overshootRight={false}
                rightThreshold={40}
              >
                <Pressable onPress={() => router.push(`/book/${b.id}`)} style={styles.rowFlat}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{b.title}</Text>
                    <Text style={styles.rowSub}>
                      {b.author ? `${b.author} · ` : ''}
                      {c} {c === 1 ? 'word' : 'words'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
                </Pressable>
              </Swipeable>
            );
          })}

          {books.length === 0 && untaggedCount === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No books yet</Text>
              <Text style={styles.emptyBody}>
                Add a book to start grouping the words you collect from it.
              </Text>
            </View>
          ) : null}

          {books.length > 0 ? (
            <Text style={styles.hint}>Swipe a book to the left to delete it.</Text>
          ) : null}
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalOpen(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Book</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Pride and Prejudice"
              placeholderTextColor={colors.textSubtle}
              autoFocus
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Author (optional)</Text>
            <TextInput
              style={styles.input}
              value={newAuthor}
              onChangeText={setNewAuthor}
              placeholder="Jane Austen"
              placeholderTextColor={colors.textSubtle}
            />

            <Button
              title={saving ? 'Saving…' : 'Save Book'}
              onPress={handleCreate}
              disabled={saving}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  addBtn: {
    marginRight: spacing.xl,
    marginBottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowFlat: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeContainer: {
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  rowTitle: { ...type.bodyStrong, color: colors.text },
  rowSub: { ...type.small, color: colors.textMuted, marginTop: 2 },
  empty: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.md },
  emptyTitle: { ...type.title, color: colors.text, marginBottom: spacing.sm },
  emptyBody: { ...type.body, color: colors.textMuted },
  hint: { ...type.small, color: colors.textSubtle, textAlign: 'center', marginTop: spacing.md },
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
});
