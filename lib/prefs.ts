import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReviewPace = 'tight' | 'default' | 'loose';

export const PACE_MULTIPLIER: Record<ReviewPace, number> = {
  tight: 0.7,
  default: 1.0,
  loose: 1.4,
};

const PACE_KEY = 'miacarta.reviewPace';

export async function getReviewPace(): Promise<ReviewPace> {
  const raw = await AsyncStorage.getItem(PACE_KEY);
  if (raw === 'tight' || raw === 'loose') return raw;
  return 'default';
}

export async function setReviewPace(pace: ReviewPace): Promise<void> {
  await AsyncStorage.setItem(PACE_KEY, pace);
}
