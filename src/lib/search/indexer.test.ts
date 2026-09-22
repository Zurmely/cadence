import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildIcd10Index, buildMedIndex, searchIcd10, searchMeds } from './indexer';
import type { Icd10Entry, MedEntry } from './types';

const dataRoot = fileURLToPath(new URL('../../../public/data/', import.meta.url));

function loadChunk<T>(dataset: 'icd10' | 'meds', key: string): T[] {
  return JSON.parse(readFileSync(`${dataRoot}${dataset}/${key}.json`, 'utf8')) as T[];
}

const sampleConditions: Icd10Entry[] = [
  { code: 'J45', chapter: 'X', en: 'Asthma', pt: 'Asma' },
  { code: 'J44', chapter: 'X', en: 'Other chronic obstructive pulmonary disease', pt: 'Outras doenças pulmonares obstrutivas crônicas' },
  { code: 'E11', chapter: 'IV', en: 'Non-insulin-dependent diabetes mellitus', pt: 'Diabetes mellitus não-insulino-dependente' },
  { code: 'I10', chapter: 'IX', en: 'Essential (primary) hypertension', pt: 'Hipertensão essencial (primária)' },
];

const sampleMeds: MedEntry[] = [
  { id: 'amoxicillin', en: 'Amoxicillin', pt: 'Amoxicilina', strengths: ['250 mg', '500 mg'], forms: ['capsule'] },
  { id: 'amlodipine', en: 'Amlodipine', pt: 'Anlodipino', strengths: ['5 mg', '10 mg'], forms: ['tablet'] },
  { id: 'ibuprofen', en: 'Ibuprofen', pt: 'Ibuprofeno', strengths: ['200 mg', '400 mg'], forms: ['tablet'] },
];

describe('ICD-10 index queries (in-process MiniSearch)', () => {
  const index = buildIcd10Index(sampleConditions);

  it('matches by exact code', () => {
    const results = searchIcd10(index, 'J45', 'en-US', 5);
    expect(results.map((r) => r.value)).toContain('J45');
  });

  it('matches by code prefix', () => {
    const results = searchIcd10(index, 'J4', 'en-US', 5);
    expect(results.map((r) => r.value).sort()).toEqual(['J44', 'J45']);
  });

  it('matches by English description prefix', () => {
    const results = searchIcd10(index, 'asth', 'en-US', 5);
    expect(results[0]?.value).toBe('J45');
    expect(results[0]?.label).toBe('Asthma');
  });

  it('matches by Portuguese description with fuzzy tolerance for a typo', () => {
    const results = searchIcd10(index, 'hipertenso', 'pt-BR', 5);
    expect(results.map((r) => r.value)).toContain('I10');
    expect(results[0]?.label).toBe('Hipertensão essencial (primária)');
  });

  it('returns nothing for an empty query', () => {
    expect(searchIcd10(index, '   ', 'en-US', 5)).toEqual([]);
  });

  it('respects the limit', () => {
    const results = searchIcd10(index, 'diabetes mellitus dependente', 'pt-BR', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe('medication index queries (in-process MiniSearch)', () => {
  const index = buildMedIndex(sampleMeds);

  it('matches by generic name prefix regardless of locale', () => {
    expect(searchMeds(index, 'amox', 'en-US', 5)[0]?.value).toBe('amoxicillin');
    expect(searchMeds(index, 'amox', 'pt-BR', 5)[0]?.label).toBe('Amoxicilina');
  });

  it('disambiguates similarly-prefixed medications', () => {
    const results = searchMeds(index, 'am', 'en-US', 5).map((r) => r.value);
    expect(results).toEqual(expect.arrayContaining(['amoxicillin', 'amlodipine']));
  });

  it('surfaces strengths as the sublabel', () => {
    const [result] = searchMeds(index, 'ibuprofen', 'en-US', 5);
    expect(result?.sublabel).toBe('200 mg, 400 mg');
  });
});

describe('committed dataset chunks index correctly', () => {
  it('indexes and queries the real public/data/icd10 chunks', () => {
    const entries = loadChunk<Icd10Entry>('icd10', 'j');
    expect(entries.length).toBeGreaterThan(0);
    const index = buildIcd10Index(entries);
    expect(searchIcd10(index, 'asma', 'pt-BR', 5).map((r) => r.value)).toContain('J45');
    expect(searchIcd10(index, 'J45', 'en-US', 5)[0]?.value).toBe('J45');
  });

  it('indexes and queries the real public/data/meds chunks', () => {
    const entries = loadChunk<MedEntry>('meds', 'i');
    expect(entries.length).toBeGreaterThan(0);
    const index = buildMedIndex(entries);
    expect(searchMeds(index, 'ibuprofeno', 'pt-BR', 5).map((r) => r.value)).toContain('ibuprofen');
  });

  it('every chunk file listed in each manifest parses and indexes without error', () => {
    for (const dataset of ['icd10', 'meds'] as const) {
      const manifest = JSON.parse(readFileSync(`${dataRoot}${dataset}/index.json`, 'utf8')) as {
        chunks: string[];
      };
      expect(manifest.chunks.length).toBeGreaterThan(0);
      for (const key of manifest.chunks) {
        const entries = loadChunk<Icd10Entry | MedEntry>(dataset, key);
        expect(entries.length).toBeGreaterThan(0);
        expect(() => (dataset === 'icd10' ? buildIcd10Index(entries as Icd10Entry[]) : buildMedIndex(entries as MedEntry[]))).not.toThrow();
      }
    }
  });
});
