export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  created_at: string;
};

export type Word = {
  id: string;
  user_id: string;
  book_id: string | null;
  word: string;
  part_of_speech: string | null;
  definition: string;
  example: string | null;
  user_notes: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  last_quality: number | null;
  created_at: string;
};

export type DictionaryDefinition = {
  partOfSpeech: string;
  definition: string;
  example?: string;
};

export type ReviewQuality = 0 | 3 | 4 | 5;
