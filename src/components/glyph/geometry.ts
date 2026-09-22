import type { MedicationForm } from '../../lib/profile/schema';

/**
 * Shared vector shape IR for the parametric medication glyph.
 *
 * `renderGlyphSvgString` (render.ts) and the `MedicationGlyph` React island
 * both draw from `buildGlyphGeometry` so the SVG markup, the JSX preview, and
 * the rasterized PNG used by the PDF templates can never drift apart.
 */
export type GlyphShape =
  | {
      kind: 'circle';
      cx: number;
      cy: number;
      r: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  | {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  | {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
      opacity?: number;
    }
  | {
      kind: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
      strokeLinecap?: 'round' | 'butt' | 'square';
      strokeDasharray?: string;
      opacity?: number;
    }
  | {
      kind: 'path';
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
      strokeLinecap?: 'round' | 'butt' | 'square';
      opacity?: number;
    };

/** The viewBox every glyph is drawn on. Fixed so scaling stays crisp. */
export const GLYPH_VIEW_BOX = '0 0 64 64';

/**
 * A tri-state scoring style. Backward compatible with the numeric
 * `MedicationGlyphParams['scoring']` union stored on disk/URL:
 *   0 -> 'none', 1 -> 'single', 2 | 4 -> 'cross'.
 */
export const SCORING_STYLES = ['none', 'single', 'cross'] as const;
export type ScoringStyle = (typeof SCORING_STYLES)[number];

export function scoringToStyle(scoring: number): ScoringStyle {
  if (scoring >= 2) return 'cross';
  if (scoring === 1) return 'single';
  return 'none';
}

/** Canonical numeric value to persist for a given scoring style. */
export function styleToScoring(style: ScoringStyle): 0 | 1 | 2 {
  if (style === 'cross') return 2;
  if (style === 'single') return 1;
  return 0;
}

export const FORM_LABELS_EN: Record<MedicationForm, string> = {
  'tablet-round': 'Round tablet',
  'tablet-scored': 'Scored tablet',
  'tablet-oval': 'Oval tablet',
  caplet: 'Caplet',
  capsule: 'Two-tone capsule',
  liquid: 'Oral liquid',
  inhaler: 'Inhaler',
  pen: 'Injector pen',
  patch: 'Transdermal patch',
};

const SCORING_LABELS_EN: Record<ScoringStyle, string> = {
  none: 'no score',
  single: 'single score',
  cross: 'cross score',
};

/** Forms where a pharmaceutical "score line" is meaningful to draw. */
const SCORABLE_FORMS = new Set<MedicationForm>(['tablet-round', 'tablet-scored', 'tablet-oval', 'caplet']);

export interface GlyphParamsInput {
  form: MedicationForm;
  primaryColor: string;
  secondaryColor: string;
  scoring: number;
}

/** Plain-English description used as the default `aria-label`/`<title>`. */
export function describeGlyph({ form, scoring }: GlyphParamsInput): string {
  const style = scoringToStyle(scoring);
  const base = FORM_LABELS_EN[form] ?? 'Medication';
  if (!SCORABLE_FORMS.has(form) || style === 'none') return base;
  return `${base}, ${SCORING_LABELS_EN[style]}`;
}

export function buildGlyphGeometry({
  form,
  primaryColor,
  secondaryColor,
  scoring,
}: GlyphParamsInput): { viewBox: string; shapes: GlyphShape[] } {
  const outline = 'rgba(16, 21, 26, 0.35)';
  const grooveColor = darken(primaryColor, 0.22);
  const style = SCORABLE_FORMS.has(form) ? scoringToStyle(scoring) : 'none';

  const shapes: GlyphShape[] =
    form === 'tablet-round'
      ? roundTablet(primaryColor, outline)
      : form === 'tablet-scored'
        ? roundTablet(primaryColor, outline)
        : form === 'tablet-oval'
          ? ovalTablet(primaryColor, outline)
          : form === 'caplet'
            ? capletTablet(primaryColor, outline)
            : form === 'capsule'
              ? capsule(primaryColor, secondaryColor, outline)
              : form === 'liquid'
                ? liquidDropper(primaryColor, secondaryColor, outline)
                : form === 'inhaler'
                  ? inhaler(primaryColor, secondaryColor, outline)
                  : form === 'pen'
                    ? pen(primaryColor, secondaryColor, outline)
                    : patch(primaryColor, secondaryColor, outline);

  if (style !== 'none') {
    shapes.push(...scoreLines(form, style, grooveColor));
  }

  return { viewBox: GLYPH_VIEW_BOX, shapes };
}

function roundTablet(fill: string, outline: string): GlyphShape[] {
  return [{ kind: 'circle', cx: 32, cy: 32, r: 23, fill, stroke: outline, strokeWidth: 1.5 }];
}

function ovalTablet(fill: string, outline: string): GlyphShape[] {
  return [{ kind: 'ellipse', cx: 32, cy: 32, rx: 26, ry: 16, fill, stroke: outline, strokeWidth: 1.5 }];
}

function capletTablet(fill: string, outline: string): GlyphShape[] {
  return [{ kind: 'ellipse', cx: 32, cy: 32, rx: 28, ry: 12, fill, stroke: outline, strokeWidth: 1.5 }];
}

function scoreLines(form: MedicationForm, style: ScoringStyle, stroke: string): GlyphShape[] {
  const isOval = form === 'tablet-oval' || form === 'caplet';
  const half = form === 'caplet' ? 20 : isOval ? 18 : 16;
  const shapes: GlyphShape[] = [
    {
      kind: 'line',
      x1: 32 - half,
      y1: 32,
      x2: 32 + half,
      y2: 32,
      stroke,
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      opacity: 0.85,
    },
  ];
  if (style === 'cross' && !isOval) {
    shapes.push({
      kind: 'line',
      x1: 32,
      y1: 32 - half,
      x2: 32,
      y2: 32 + half,
      stroke,
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      opacity: 0.85,
    });
  } else if (style === 'cross' && isOval) {
    shapes.push({
      kind: 'line',
      x1: 32,
      y1: 32 - (form === 'caplet' ? 8 : 10),
      x2: 32,
      y2: 32 + (form === 'caplet' ? 8 : 10),
      stroke,
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      opacity: 0.85,
    });
  }
  return shapes;
}

function capsule(primary: string, secondary: string, outline: string): GlyphShape[] {
  return [
    { kind: 'path', d: 'M32,20 H44 A12,12 0 0 1 44,44 H32 Z', fill: secondary },
    { kind: 'path', d: 'M32,20 H20 A12,12 0 0 0 20,44 H32 Z', fill: primary },
    {
      kind: 'path',
      d: 'M20,20 H44 A12,12 0 0 1 44,44 H20 A12,12 0 0 1 20,20 Z',
      stroke: outline,
      strokeWidth: 1.5,
      fill: 'none',
    },
    { kind: 'line', x1: 32, y1: 21, x2: 32, y2: 43, stroke: outline, strokeWidth: 1, opacity: 0.6 },
  ];
}

function liquidDropper(primary: string, secondary: string, outline: string): GlyphShape[] {
  return [
    { kind: 'ellipse', cx: 32, cy: 11, rx: 7, ry: 6, fill: secondary, stroke: outline, strokeWidth: 1.3 },
    { kind: 'rect', x: 28, y: 15, width: 8, height: 13, fill: secondary, stroke: outline, strokeWidth: 1.2 },
    {
      kind: 'rect',
      x: 18,
      y: 26,
      width: 28,
      height: 30,
      rx: 6,
      ry: 6,
      fill: primary,
      stroke: outline,
      strokeWidth: 1.5,
    },
    {
      kind: 'rect',
      x: 18,
      y: 42,
      width: 28,
      height: 14,
      rx: 4,
      ry: 4,
      fill: darken(primary, 0.18),
      opacity: 0.65,
    },
    { kind: 'line', x1: 24, y1: 30, x2: 24, y2: 52, stroke: 'rgba(255,255,255,0.55)', strokeWidth: 2, strokeLinecap: 'round' },
  ];
}

function inhaler(primary: string, secondary: string, outline: string): GlyphShape[] {
  return [
    {
      kind: 'rect',
      x: 14,
      y: 44,
      width: 36,
      height: 14,
      rx: 5,
      ry: 5,
      fill: secondary,
      stroke: outline,
      strokeWidth: 1.4,
    },
    {
      kind: 'rect',
      x: 22,
      y: 8,
      width: 20,
      height: 38,
      rx: 7,
      ry: 7,
      fill: primary,
      stroke: outline,
      strokeWidth: 1.5,
    },
    { kind: 'rect', x: 26, y: 4, width: 12, height: 6, rx: 2, ry: 2, fill: darken(primary, 0.15) },
    { kind: 'line', x1: 27, y1: 20, x2: 37, y2: 20, stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2 },
  ];
}

function pen(primary: string, secondary: string, outline: string): GlyphShape[] {
  return [
    {
      kind: 'rect',
      x: 8,
      y: 26,
      width: 38,
      height: 12,
      rx: 6,
      ry: 6,
      fill: primary,
      stroke: outline,
      strokeWidth: 1.4,
    },
    {
      kind: 'rect',
      x: 12,
      y: 28,
      width: 12,
      height: 8,
      rx: 2,
      ry: 2,
      fill: 'rgba(255,255,255,0.45)',
    },
    { kind: 'path', d: 'M46,26 H52 L58,32 L52,38 H46 Z', fill: secondary, stroke: outline, strokeWidth: 1.2 },
    { kind: 'line', x1: 58, y1: 32, x2: 62, y2: 32, stroke: outline, strokeWidth: 1.4, strokeLinecap: 'round' },
  ];
}

function patch(primary: string, secondary: string, outline: string): GlyphShape[] {
  return [
    {
      kind: 'rect',
      x: 9,
      y: 9,
      width: 46,
      height: 46,
      rx: 12,
      ry: 12,
      fill: secondary,
      stroke: outline,
      strokeWidth: 1.4,
      strokeDasharray: '3 3',
    },
    {
      kind: 'rect',
      x: 19,
      y: 19,
      width: 26,
      height: 26,
      rx: 8,
      ry: 8,
      fill: primary,
      stroke: outline,
      strokeWidth: 1.3,
    },
    { kind: 'circle', cx: 32, cy: 32, r: 5, fill: 'rgba(255,255,255,0.5)' },
  ];
}

/** Darkens a `#rrggbb` hex color by `amount` (0-1); passthrough for anything else. */
function darken(hex: string, amount: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const scale = 1 - Math.min(Math.max(amount, 0), 1);
  const clamp = (channel: number) => Math.round(Math.max(0, Math.min(255, channel * scale)));
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
}
