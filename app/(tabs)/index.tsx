import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/Button';
import { CardStack } from '../../components/CardStack';
import { ensureSignedIn } from '../../lib/supabase';
import { applyReviewToWord, listDueWords } from '../../lib/db';
import { QUALITY, applyReview } from '../../lib/srs';
import { PACE_MULTIPLIER, getReviewPace, type ReviewPace } from '../../lib/prefs';
import { colors, radius, spacing, type } from '../../constants/theme';
import type { ReviewQuality, Word } from '../../types';

const READING_QUOTES = [
  { text: 'A word after a word after a word is power.', author: 'Margaret Atwood' },
  { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: "I read a book one day and my whole life was changed.", author: 'Orhan Pamuk' },
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  { text: 'Show me a family of readers, and I will show you the people who move the world.', author: 'Napoléon' },
];

function pickQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return READING_QUOTES[dayOfYear % READING_QUOTES.length];
}

export default function ReviewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Word[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pace, setPace] = useState<ReviewPace>('default');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await ensureSignedIn();
      const [due, p] = await Promise.all([listDueWords(userId), getReviewPace()]);
      setQueue(due);
      setPace(p);
      setRevealed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const current = queue[0];

  async function handleRate(quality: ReviewQuality) {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      const update = applyReview(current, quality, PACE_MULTIPLIER[pace]);
      await applyReviewToWord(current.id, update, quality);
      setQueue((q) => q.slice(1));
      setRevealed(false);
    } finally {
      setSubmitting(false);
    }
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

  if (!current) {
    const quote = pickQuote();
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Review" subtitle="Nothing due right now" />
        <View style={styles.emptyWrap}>
          <CardStack size="lg" style={{ marginBottom: spacing.xl, alignSelf: 'center' }} />
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyBody}>
            You've reviewed every card due today. Old cards return on their own quiet schedule.
          </Text>
          <View style={styles.quoteWrap}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
          <Button title="Add a new word" onPress={() => router.push('/add')} style={{ marginTop: spacing.lg, alignSelf: 'stretch' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Review" subtitle={`${queue.length} due`} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={() => setRevealed(true)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
        >
          <Text style={styles.word}>{current.word}</Text>
          {current.part_of_speech ? <Text style={styles.pos}>{current.part_of_speech}</Text> : null}

          {current.example ? (
            <Text style={styles.contextExample}>"{current.example}"</Text>
          ) : null}

          {revealed ? (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.definition}>{current.definition}</Text>
              {current.user_notes ? (
                <View style={styles.notesWrap}>
                  <Text style={styles.notesLabel}>Note</Text>
                  <Text style={styles.notes}>{current.user_notes}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.tapHint}>Tap to reveal the definition</Text>
          )}
        </Pressable>
      </ScrollView>

      {revealed ? (
        <View style={styles.actions}>
          <RateButton label="Again" color={colors.again} onPress={() => handleRate(QUALITY.AGAIN)} disabled={submitting} />
          <RateButton label="Hard" color={colors.hard} onPress={() => handleRate(QUALITY.HARD)} disabled={submitting} />
          <RateButton label="Good" color={colors.good} onPress={() => handleRate(QUALITY.GOOD)} disabled={submitting} />
          <RateButton label="Easy" color={colors.easy} onPress={() => handleRate(QUALITY.EASY)} disabled={submitting} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function RateButton({
  label,
  color,
  onPress,
  disabled,
}: {
  label: string;
  color: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.rate,
        { backgroundColor: color },
        (pressed || disabled) && { opacity: 0.7 },
      ]}
    >
      <Text style={styles.rateLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, alignItems: 'flex-start' },
  emptyTitle: { ...type.title, color: colors.text, marginBottom: spacing.sm, alignSelf: 'stretch', textAlign: 'center' },
  emptyBody: { ...type.body, color: colors.textMuted, alignSelf: 'stretch', textAlign: 'center' },
  quoteWrap: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.accentMuted,
    borderRadius: 6,
    alignSelf: 'stretch',
  },
  quoteText: { ...type.body, fontStyle: 'italic', color: colors.text, lineHeight: 24 },
  quoteAuthor: { ...type.small, color: colors.textMuted, marginTop: spacing.sm },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 240,
  },
  word: { ...type.display, color: colors.text },
  pos: { ...type.small, color: colors.accent, fontStyle: 'italic', marginTop: spacing.xs },
  tapHint: { ...type.small, color: colors.textSubtle, marginTop: spacing.xl },
  definition: { ...type.body, color: colors.text, lineHeight: 24 },
  contextExample: {
    ...type.body,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.lg,
    lineHeight: 24,
  },
  notesWrap: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.md,
  },
  notesLabel: { ...type.label, color: colors.accent, marginBottom: spacing.xs },
  notes: { ...type.body, color: colors.text },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  rate: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rateLabel: { ...type.bodyStrong, color: '#fff' },
});
