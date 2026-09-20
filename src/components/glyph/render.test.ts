import { describe, expect, it } from 'vitest';
import type { MedicationGlyphParams } from '../../lib/profile/schema';
import { MEDICATION_FORMS } from '../../lib/profile/schema';
import { renderGlyphSvgString } from './render';

function paramsFor(form: MedicationGlyphParams['form'], scoring: MedicationGlyphParams['scoring'] = 0): MedicationGlyphParams {
  return { form, primaryColor: '#0b5fa8', secondaryColor: '#ffffff', scoring };
}

describe('renderGlyphSvgString', () => {
  it('renders a well-formed, accessible SVG for every medication form', () => {
    for (const form of MEDICATION_FORMS) {
      const svg = renderGlyphSvgString(paramsFor(form));
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('role="img"');
      expect(svg).toMatch(/<title id="[^"]+">[^<]+<\/title>/);
      expect(svg).toContain('viewBox="0 0 64 64"');
      expect(svg.endsWith('</svg>')).toBe(true);
    }
  });

  it('sizes the svg from the size option and defaults to 40', () => {
    const params = paramsFor('tablet-round');
    expect(renderGlyphSvgString(params)).toContain('width="40" height="40"');
    expect(renderGlyphSvgString(params, { size: 128 })).toContain('width="128" height="128"');
  });

  it('draws no score line for scoring 0', () => {
    const svg = renderGlyphSvgString(paramsFor('tablet-round', 0));
    expect(svg).not.toContain('<line');
  });

  it('draws a single score line for scoring 1', () => {
    const svg = renderGlyphSvgString(paramsFor('tablet-round', 1));
    expect(svg.match(/<line/g)?.length).toBe(1);
  });

  it('draws a cross score for scoring 2 and treats legacy 4 the same way', () => {
    const cross = renderGlyphSvgString(paramsFor('tablet-round', 2));
    const legacy = renderGlyphSvgString(paramsFor('tablet-round', 4));
    expect(cross.match(/<line/g)?.length).toBe(2);
    expect(legacy.match(/<line/g)?.length).toBe(2);
  });

  it('does not score non-tablet forms even when scoring is requested', () => {
    const unscored = renderGlyphSvgString(paramsFor('capsule', 0));
    const scored = renderGlyphSvgString(paramsFor('capsule', 2));
    expect(scored.match(/<line/g)?.length).toBe(unscored.match(/<line/g)?.length);
  });

  it('renders the capsule as two-tone using primary and secondary colors', () => {
    const svg = renderGlyphSvgString(paramsFor('capsule'));
    expect(svg).toContain('fill="#0b5fa8"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it('renders a dashed backing for the transdermal patch', () => {
    const svg = renderGlyphSvgString(paramsFor('patch'));
    expect(svg).toContain('stroke-dasharray');
  });

  it('renders a dropper bulb and bottle body for the liquid form', () => {
    const svg = renderGlyphSvgString(paramsFor('liquid'));
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('<rect');
  });

  it('uses a caller-supplied label verbatim and escapes it', () => {
    const svg = renderGlyphSvgString(paramsFor('tablet-round'), {
      label: 'Metformin & "Friends"',
    });
    expect(svg).toContain('Metformin &amp; &quot;Friends&quot;');
  });

  it('falls back to an auto-generated English description', () => {
    const svg = renderGlyphSvgString(paramsFor('tablet-round', 1));
    expect(svg).toContain('Round tablet, single score');
  });

  it('produces deterministic output for identical params', () => {
    const params = paramsFor('inhaler', 0);
    expect(renderGlyphSvgString(params)).toBe(renderGlyphSvgString(params));
  });
});
