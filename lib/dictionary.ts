import type { DictionaryDefinition } from '../types';

type FreeDictResponse = Array<{
  word: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}>;

type WiktionaryResponse = Record<
  string,
  Array<{
    partOfSpeech: string;
    language: string;
    definitions: Array<{
      definition: string;
      examples?: string[];
    }>;
  }>
>;

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function lookupFreeDict(word: string): Promise<DictionaryDefinition[]> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Dictionary API error: ${res.status}`);
  const data = (await res.json()) as FreeDictResponse;
  const flat: DictionaryDefinition[] = [];
  for (const entry of data) {
    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions) {
        flat.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example,
        });
      }
    }
  }
  return flat;
}

async function lookupWiktionary(word: string): Promise<DictionaryDefinition[]> {
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) return [];
  const data = (await res.json()) as WiktionaryResponse;
  const en = data['en'];
  if (!en) return [];
  const flat: DictionaryDefinition[] = [];
  for (const group of en) {
    for (const def of group.definitions) {
      const cleaned = stripHtml(def.definition);
      if (!cleaned) continue;
      flat.push({
        partOfSpeech: group.partOfSpeech.toLowerCase(),
        definition: cleaned,
        example: def.examples?.length ? stripHtml(def.examples[0]) : undefined,
      });
    }
  }
  return flat;
}

export async function lookupWord(raw: string): Promise<DictionaryDefinition[]> {
  const word = raw.trim().toLowerCase();
  if (!word) return [];
  const primary = await lookupFreeDict(word);
  if (primary.length > 0) return primary;
  return lookupWiktionary(word);
}

type DatamuseSuggestion = { word: string; score?: number };

export async function suggestWords(prefix: string, max = 8): Promise<string[]> {
  const p = prefix.trim().toLowerCase();
  if (p.length < 2) return [];
  const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(p)}&max=${max}`);
  if (!res.ok) return [];
  const data = (await res.json()) as DatamuseSuggestion[];
  return data.map((d) => d.word);
}
