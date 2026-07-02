import { supabase } from './supabase';
import type { Book, Word } from '../types';

export async function listBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBook(userId: string, title: string, author?: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({ user_id: userId, title: title.trim(), author: author?.trim() || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function listWords(userId: string, bookId?: string | null): Promise<Word[]> {
  let q = supabase.from('words').select('*').eq('user_id', userId);
  if (bookId === null) q = q.is('book_id', null);
  else if (bookId) q = q.eq('book_id', bookId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listDueWords(userId: string): Promise<Word[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function countWordsByBook(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('words').select('book_id').eq('user_id', userId);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.book_id ?? '__untagged__';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export type NewWord = {
  word: string;
  part_of_speech: string | null;
  definition: string;
  example: string | null;
  user_notes: string | null;
  book_id: string | null;
};

export async function createWord(userId: string, w: NewWord): Promise<Word> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('words')
    .insert({
      user_id: userId,
      ...w,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_date: today,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from('words').delete().eq('id', id);
  if (error) throw error;
}

export async function getWord(id: string): Promise<Word | null> {
  const { data, error } = await supabase.from('words').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export type WordEdit = {
  word?: string;
  part_of_speech?: string | null;
  definition?: string;
  example?: string | null;
  user_notes?: string | null;
  book_id?: string | null;
};

export async function updateWord(id: string, patch: WordEdit): Promise<void> {
  const { error } = await supabase.from('words').update(patch).eq('id', id);
  if (error) throw error;
}

export async function applyReviewToWord(
  id: string,
  update: {
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_date: string;
  },
  quality: number,
): Promise<void> {
  const { error } = await supabase
    .from('words')
    .update({
      ...update,
      last_quality: quality,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
