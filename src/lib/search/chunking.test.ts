import { describe, expect, it } from 'vitest';
import {
  chunkUrl,
  icd10ResultLabel,
  manifestUrl,
  medResultLabel,
  normalizeText,
  resolveChunkKey,
} from './chunking';
import type { Icd10Entry, MedEntry } from './types';

describe('resolveChunkKey', () => {
  it('routes a plain lowercase query to its first letter', () => {
    expect(resolveChunkKey('amoxicillin')).toBe('a');
  });

  it('is case-insensitive', () => {
    expect(resolveChunkKey('Diabetes')).toBe('d');
  });

  it('strips accents so pt-BR queries route the same as en-US', () => {
    expect(resolveChunkKey('Ácido fólico')).toBe('a');
    expect(resolveChunkKey('acido folico')).toBe('a');
  });

  it('skips leading digits or punctuation to find the first letter', () => {
    expect(resolveChunkKey('  500mg amoxicillin')).toBe('m');
    expect(resolveChunkKey('J45')).toBe('j');
  });

  it('returns null when the query has no a-z character', () => {
    expect(resolveChunkKey('123')).toBeNull();
    expect(resolveChunkKey('   ')).toBeNull();
    expect(resolveChunkKey('')).toBeNull();
  });
});

describe('normalizeText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeText('Hipertensão Essencial')).toBe('hipertensao essencial');
  });
});

describe('chunkUrl / manifestUrl', () => {
  it('builds dataset-scoped chunk and manifest paths', () => {
    expect(chunkUrl('', 'icd10', 'a')).toBe('/data/icd10/a.json');
    expect(chunkUrl('/cadence', 'meds', 'b')).toBe('/cadence/data/meds/b.json');
    expect(manifestUrl('', 'meds')).toBe('/data/meds/index.json');
  });
});

describe('result label builders', () => {
  const condition: Icd10Entry = { code: 'J45', chapter: 'X', en: 'Asthma', pt: 'Asma' };
  const med: MedEntry = {
    id: 'amoxicillin',
    en: 'Amoxicillin',
    pt: 'Amoxicilina',
    strengths: ['250 mg', '500 mg'],
    forms: ['capsule'],
  };

  it('localizes ICD-10 labels and keeps the code as the stored value', () => {
    expect(icd10ResultLabel(condition, 'en-US')).toEqual({
      value: 'J45',
      label: 'Asthma',
      sublabel: 'J45',
    });
    expect(icd10ResultLabel(condition, 'pt-BR')).toEqual({
      value: 'J45',
      label: 'Asma',
      sublabel: 'J45',
    });
  });

  it('localizes medication labels and surfaces strengths as the sublabel', () => {
    expect(medResultLabel(med, 'en-US')).toEqual({
      value: 'amoxicillin',
      label: 'Amoxicillin',
      sublabel: '250 mg, 500 mg',
    });
    expect(medResultLabel(med, 'pt-BR').label).toBe('Amoxicilina');
  });
});
