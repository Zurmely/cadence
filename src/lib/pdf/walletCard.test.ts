import { describe, expect, it } from 'vitest';
import { createEmptyProfile } from '../profile/schema';
import { generateWalletCardPdf } from './walletCard';

function sampleProfile() {
  const profile = createEmptyProfile();
  profile.person.fullName = 'Ana Beatriz Souza';
  profile.person.bloodType = 'O+';
  profile.allergies.push({ id: 'a1', name: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' });
  profile.conditions.push({ id: 'c1', name: 'Hypertension', icd10: 'I10', notes: '' });
  profile.emergencyContacts.push({
    id: 'e1',
    name: 'Marcos Souza',
    relation: 'Spouse',
    phone: '+55 11 98888-1111',
    isPrimary: true,
  });
  return profile;
}

describe('generateWalletCardPdf (Template A)', () => {
  it('produces a single-page PDF with both panels on one sheet', async () => {
    const doc = await generateWalletCardPdf(sampleProfile(), {
      siteOrigin: 'https://cadence.zurmely.com',
      locale: 'en-US',
    });

    expect(doc.getNumberOfPages()).toBe(1);

    const bytes = doc.output('arraybuffer');
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0, 5))).toBe('%PDF-');
  });

  it('produces a landscape sheet twice the card width (front + back panels)', async () => {
    const doc = await generateWalletCardPdf(sampleProfile(), {
      siteOrigin: 'https://cadence.zurmely.com',
      locale: 'pt-BR',
    });

    const size = doc.internal.pageSize;
    expect(size.getWidth()).toBeGreaterThan(size.getHeight());
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('works with an empty profile', async () => {
    const doc = await generateWalletCardPdf(createEmptyProfile(), {
      siteOrigin: 'https://cadence.zurmely.com',
      locale: 'en-US',
    });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
