import type { Icd10Entry, MedEntry, SearchDataset, SearchResultItem } from './types';
import type { Locale } from '../i18n';

/**
 * Strip diacritics and lowercase so pt-BR and en-US queries match the same
 * chunk regardless of accents (e.g. "gripe" / "influenza").
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Determine which lazily-loaded chunk file a query should hit first.
 * Chunks are partitioned by the initial character of the dataset's primary
 * key (ICD-10 code letter, medication id) — a single a-z letter — so this is
 * a pure, synchronous, and fully testable routing decision.
 * Returns null when the query has no leading a-z character to route on.
 */
export function resolveChunkKey(query: string): string | null {
  const normalized = normalizeText(query);
  const match = normalized.match(/[a-z]/);
  return match ? match[0] : null;
}

export function icd10ResultLabel(entry: Icd10Entry, locale: Locale): SearchResultItem {
  const label = locale === 'pt-BR' ? entry.pt : entry.en;
  return { value: entry.code, label, sublabel: entry.code };
}

export function medResultLabel(entry: MedEntry, locale: Locale): SearchResultItem {
  const label = locale === 'pt-BR' ? entry.pt : entry.en;
  const strengths = entry.strengths.join(', ');
  return { value: entry.id, label, sublabel: strengths };
}

export function resultLabel<D extends SearchDataset>(
  dataset: D,
  entry: D extends 'icd10' ? Icd10Entry : MedEntry,
  locale: Locale,
): SearchResultItem {
  if (dataset === 'icd10') return icd10ResultLabel(entry as Icd10Entry, locale);
  return medResultLabel(entry as MedEntry, locale);
}

export function chunkUrl(base: string, dataset: SearchDataset, chunkKey: string): string {
  return `${base}/data/${dataset}/${chunkKey}.json`;
}

export function manifestUrl(base: string, dataset: SearchDataset): string {
  return `${base}/data/${dataset}/index.json`;
}
