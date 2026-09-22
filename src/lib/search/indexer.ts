import MiniSearch from 'minisearch';
import type { SearchResult } from 'minisearch';
import { normalizeText, resultLabel } from './chunking';
import type { Icd10Entry, MedEntry, SearchDataset, SearchResultItem } from './types';
import type { Locale } from '../i18n';

/**
 * Shared MiniSearch options: fuzzy + prefix matching over both localized
 * description fields plus the code/id, with light diacritic normalization so
 * "diabetes" and "diabete" (or accented pt-BR terms) still match.
 */
const SEARCH_OPTIONS = {
  fuzzy: 0.2,
  prefix: true,
  boost: { code: 2, id: 2 },
} as const;

export function buildIcd10Index(entries: Icd10Entry[]): MiniSearch<Icd10Entry> {
  const index = new MiniSearch<Icd10Entry>({
    idField: 'code',
    fields: ['code', 'en', 'pt'],
    storeFields: ['code', 'chapter', 'en', 'pt'],
    processTerm: (term) => normalizeText(term),
  });
  index.addAll(entries);
  return index;
}

export function buildMedIndex(entries: MedEntry[]): MiniSearch<MedEntry> {
  const index = new MiniSearch<MedEntry>({
    idField: 'id',
    fields: ['id', 'en', 'pt'],
    storeFields: ['id', 'en', 'pt', 'strengths', 'forms'],
    processTerm: (term) => normalizeText(term),
  });
  index.addAll(entries);
  return index;
}

function toEntry<T>(result: SearchResult): T {
  // Stored fields (code/id/en/pt/...) come back alongside MiniSearch's own
  // score/terms/match/queryTerms metadata; only strip the metadata, since a
  // dataset's own primary key field (e.g. medication "id") must survive.
  const { score, terms, match, queryTerms, ...rest } = result;
  return rest as unknown as T;
}

export function searchIcd10(
  index: MiniSearch<Icd10Entry>,
  query: string,
  locale: Locale,
  limit: number,
): SearchResultItem[] {
  if (!query.trim()) return [];
  return index
    .search(query, SEARCH_OPTIONS)
    .slice(0, limit)
    .map((result) => resultLabel('icd10', toEntry<Icd10Entry>(result), locale));
}

export function searchMeds(
  index: MiniSearch<MedEntry>,
  query: string,
  locale: Locale,
  limit: number,
): SearchResultItem[] {
  if (!query.trim()) return [];
  return index
    .search(query, SEARCH_OPTIONS)
    .slice(0, limit)
    .map((result) => resultLabel('meds', toEntry<MedEntry>(result), locale));
}

export type AnyIndex = MiniSearch<Icd10Entry> | MiniSearch<MedEntry>;

export function buildIndex(dataset: SearchDataset, entries: unknown[]): AnyIndex {
  if (dataset === 'icd10') return buildIcd10Index(entries as Icd10Entry[]);
  return buildMedIndex(entries as MedEntry[]);
}

export function searchIndex(
  dataset: SearchDataset,
  index: AnyIndex,
  query: string,
  locale: Locale,
  limit: number,
): SearchResultItem[] {
  if (dataset === 'icd10') {
    return searchIcd10(index as MiniSearch<Icd10Entry>, query, locale, limit);
  }
  return searchMeds(index as MiniSearch<MedEntry>, query, locale, limit);
}
