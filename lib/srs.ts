import type { ReviewQuality, Word } from '../types';

type SrsState = Pick<Word, 'ease_factor' | 'interval_days' | 'repetitions'>;
type SrsUpdate = SrsState & { next_review_date: string };

export const QUALITY = {
  AGAIN: 0,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
} as const satisfies Record<string, ReviewQuality>;

export function applyReview(
  state: SrsState,
  quality: ReviewQuality,
  paceMultiplier = 1,
): SrsUpdate {
  let { ease_factor, interval_days, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.max(1, Math.round(interval_days * ease_factor));
  }

  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const scheduledInterval = Math.max(1, Math.round(interval_days * paceMultiplier));
  const next = new Date();
  next.setDate(next.getDate() + scheduledInterval);
  const next_review_date = next.toISOString().slice(0, 10);

  return { ease_factor, interval_days, repetitions, next_review_date };
}

export function isDue(word: Pick<Word, 'next_review_date'>, today = new Date()): boolean {
  const todayStr = today.toISOString().slice(0, 10);
  return word.next_review_date <= todayStr;
}
