-- Miacarta database schema.
-- Run this once in your Supabase SQL editor (Dashboard → SQL Editor → New query).

create extension if not exists "uuid-ossp";

-- Books
create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  author text,
  created_at timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books(user_id);

-- Words
create table if not exists public.words (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  book_id uuid references public.books on delete set null,
  word text not null,
  part_of_speech text,
  definition text not null,
  example text,
  user_notes text,
  ease_factor real not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  next_review_date date not null default current_date,
  last_reviewed_at timestamptz,
  last_quality integer,
  created_at timestamptz not null default now()
);

create index if not exists words_user_id_idx on public.words(user_id);
create index if not exists words_book_id_idx on public.words(book_id);
create index if not exists words_due_idx on public.words(user_id, next_review_date);

-- Row Level Security
alter table public.books enable row level security;
alter table public.words enable row level security;

-- Books policies
drop policy if exists "books_select_own" on public.books;
create policy "books_select_own" on public.books
  for select using (auth.uid() = user_id);

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books
  for insert with check (auth.uid() = user_id);

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books
  for update using (auth.uid() = user_id);

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books
  for delete using (auth.uid() = user_id);

-- Words policies
drop policy if exists "words_select_own" on public.words;
create policy "words_select_own" on public.words
  for select using (auth.uid() = user_id);

drop policy if exists "words_insert_own" on public.words;
create policy "words_insert_own" on public.words
  for insert with check (auth.uid() = user_id);

drop policy if exists "words_update_own" on public.words;
create policy "words_update_own" on public.words
  for update using (auth.uid() = user_id);

drop policy if exists "words_delete_own" on public.words;
create policy "words_delete_own" on public.words
  for delete using (auth.uid() = user_id);
