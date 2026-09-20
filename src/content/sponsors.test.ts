import { describe, expect, it } from 'vitest';
import { sponsors, validateSponsor, validateSponsors, type Sponsor } from './sponsors';

const validSponsor: Sponsor = {
  id: 'example-sponsor',
  link: 'https://example.org/sponsor',
  copy: {
    'en-US': { title: 'Example Sponsor', body: 'Supporting local-first health tools.' },
    'pt-BR': { title: 'Patrocinador Exemplo', body: 'Apoiando ferramentas de sa\u00fade locais.' },
  },
};

describe('sponsors config', () => {
  it('ships with an empty default config', () => {
    expect(sponsors).toEqual([]);
    expect(validateSponsors(sponsors)).toEqual([]);
  });

  it('accepts a fully specified sponsor', () => {
    expect(validateSponsor(validSponsor)).toEqual([]);
  });

  it('rejects a missing id', () => {
    const errors = validateSponsor({ ...validSponsor, id: '' });
    expect(errors.some((e) => e.includes('missing an id'))).toBe(true);
  });

  it('rejects non-https links', () => {
    const errors = validateSponsor({ ...validSponsor, link: 'http://example.org' });
    expect(errors.some((e) => e.includes('https://'))).toBe(true);
  });

  it('rejects missing locale copy', () => {
    const errors = validateSponsor({
      ...validSponsor,
      copy: { 'en-US': validSponsor.copy['en-US'], 'pt-BR': { title: '', body: '' } },
    });
    expect(errors.some((e) => e.includes('pt-BR'))).toBe(true);
  });

  it('flags duplicate ids across the list', () => {
    const errors = validateSponsors([validSponsor, validSponsor]);
    expect(errors.some((e) => e.includes('Duplicate sponsor id'))).toBe(true);
  });
});
