import type { Locale } from '../i18n';

/** Datasets the search worker can index. Each maps to public/data/<dataset>/. */
export const SEARCH_DATASETS = ['icd10', 'meds'] as const;
export type SearchDataset = (typeof SEARCH_DATASETS)[number];

/** Raw ICD-10 / CID-10 chunk row as stored in public/data/icd10/<letter>.json. */
export interface Icd10Entry {
  code: string;
  chapter: string;
  en: string;
  pt: string;
}

/** Raw medication chunk row as stored in public/data/meds/<letter>.json. */
export interface MedEntry {
  id: string;
  en: string;
  pt: string;
  strengths: string[];
  forms: string[];
}

export type DatasetEntry<D extends SearchDataset> = D extends 'icd10' ? Icd10Entry : MedEntry;

/** Manifest listing the chunk keys that exist for a dataset (public/data/<dataset>/index.json). */
export interface ChunkManifest {
  chunks: string[];
}

/** Normalized, locale-aware result rendered by the combobox. */
export interface SearchResultItem {
  /** Value stored on the profile (ICD-10 code, or medication catalog id). */
  value: string;
  /** Localized primary label shown to the user. */
  label: string;
  /** Localized secondary text (e.g. the code, or strengths/forms). */
  sublabel: string;
}

export interface SearchRequestMessage {
  type: 'search';
  requestId: number;
  dataset: SearchDataset;
  query: string;
  locale: Locale;
  limit: number;
}

export interface SearchResultMessage {
  type: 'result';
  requestId: number;
  items: SearchResultItem[];
}

export interface SearchErrorMessage {
  type: 'error';
  requestId: number;
  message: string;
}

export type SearchWorkerRequest = SearchRequestMessage;
export type SearchWorkerResponse = SearchResultMessage | SearchErrorMessage;
