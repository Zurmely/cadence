import { describe, expect, it, vi } from 'vitest';
import { createEmptyMedication, createEmptyProfile } from '../profile/schema';
import { generateDailyIntakePdf } from './dailyIntake';

// `glyphToPngDataUrl` (src/components/glyph/render.ts) rasterizes via the
// browser Canvas/Image APIs and throws outside a DOM, so the Node test
// runner gets a tiny fixed PNG instead of a real render. Browser-side
// rendering is covered by the PDF engine's manual visual verification.
vi.mock('../../components/glyph/render', () => ({
  glyphToPngDataUrl: vi
    .fn()
    .mockResolvedValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    ),
}));

function medication(overrides: Partial<ReturnType<typeof createEmptyMedication>>) {
  return { ...createEmptyMedication(), ...overrides };
}

function sampleProfile() {
  const profile = createEmptyProfile();
  profile.person.fullName = 'Ana Beatriz Souza';
  profile.medications.push(
    medication({
      id: 'm1',
      name: 'Losartan',
      dose: '50 mg',
      instructions: 'Take with food',
      slots: { morning: true, afternoon: false, evening: true, bedtime: false },
    }),
    medication({
      id: 'm2',
      name: 'Sertraline',
      dose: '100 mg',
      instructions: 'Take at bedtime',
      slots: { morning: false, afternoon: false, evening: false, bedtime: true },
    }),
  );
  return profile;
}

describe('generateDailyIntakePdf (Template B)', () => {
  it('produces an A4 PDF with the expected page count for a small profile', async () => {
    const doc = await generateDailyIntakePdf(sampleProfile(), { locale: 'en-US', format: 'a4' });
    expect(doc.getNumberOfPages()).toBe(1);

    const bytes = doc.output('arraybuffer');
    expect(new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0, 5))).toBe('%PDF-');
  });

  it('produces a Letter PDF with the expected page count for a small profile', async () => {
    const doc = await generateDailyIntakePdf(sampleProfile(), { locale: 'pt-BR', format: 'letter' });
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('paginates when there are enough medications to overflow one page', async () => {
    const profile = createEmptyProfile();
    for (let i = 0; i < 40; i += 1) {
      profile.medications.push(
        medication({
          id: `med-${i}`,
          name: `Medication ${i}`,
          dose: '10 mg',
          instructions: 'Take as directed by your clinician for chronic condition management',
          slots: { morning: true, afternoon: true, evening: true, bedtime: true },
        }),
      );
    }

    const doc = await generateDailyIntakePdf(profile, { locale: 'en-US', format: 'letter' });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('shows an empty state and stays a single page when no medications have a time slot', async () => {
    const doc = await generateDailyIntakePdf(createEmptyProfile(), { locale: 'en-US', format: 'a4' });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
