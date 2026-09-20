import type { MedicationGlyphParams } from '../../lib/profile/schema';
import { buildGlyphGeometry, describeGlyph, type GlyphShape } from './geometry';

export interface RenderGlyphOptions {
  /** Rendered width/height in CSS px (viewBox stays fixed, so it's always crisp). */
  size?: number;
  /** Accessible label; defaults to an auto-generated English description. */
  label?: string;
  /** Override the generated `id` used to link `<title>` via `aria-labelledby`. */
  titleId?: string;
}

const DEFAULT_SIZE = 40;

/**
 * Pure function: params in, standalone `<svg>` markup string out. No DOM
 * required, so this can run in the PDF pipeline, a Web Worker, or Node
 * (Vitest) exactly the same way it runs in the browser.
 */
export function renderGlyphSvgString(
  params: MedicationGlyphParams,
  options: RenderGlyphOptions = {},
): string {
  const size = options.size ?? DEFAULT_SIZE;
  const label = options.label ?? describeGlyph(params);
  const titleId = options.titleId ?? `glyph-title-${slug(params)}`;
  const { viewBox, shapes } = buildGlyphGeometry(params);

  const body = shapes.map(renderShape).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" ` +
    `role="img" aria-labelledby="${titleId}">` +
    `<title id="${titleId}">${escapeXml(label)}</title>` +
    body +
    `</svg>`
  );
}

/**
 * Rasterizes the glyph to a PNG data URL at `px` x `px` for consumers (the
 * jsPDF templates) that need a raster image rather than embedded SVG.
 * Browser-only (uses `Image`/`canvas`); throws in non-DOM environments.
 */
export async function glyphToPngDataUrl(
  params: MedicationGlyphParams,
  px = 128,
): Promise<string> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('glyphToPngDataUrl requires a browser environment');
  }
  const svg = renderGlyphSvgString(params, { size: px });
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = await loadImage(svgUrl);

  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.clearRect(0, 0, px, px);
  ctx.drawImage(image, 0, 0, px, px);
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to rasterize medication glyph'));
    image.src = src;
  });
}

function renderShape(shape: GlyphShape): string {
  const opacity = shape.opacity !== undefined ? ` opacity="${shape.opacity}"` : '';
  switch (shape.kind) {
    case 'circle':
      return (
        `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}"` +
        fillStroke(shape) +
        opacity +
        `/>`
      );
    case 'ellipse':
      return (
        `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}"` +
        fillStroke(shape) +
        opacity +
        `/>`
      );
    case 'rect':
      return (
        `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}"` +
        (shape.rx !== undefined ? ` rx="${shape.rx}"` : '') +
        (shape.ry !== undefined ? ` ry="${shape.ry}"` : '') +
        fillStroke(shape) +
        (shape.strokeDasharray ? ` stroke-dasharray="${shape.strokeDasharray}"` : '') +
        opacity +
        `/>`
      );
    case 'line':
      return (
        `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ` +
        `stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"` +
        (shape.strokeLinecap ? ` stroke-linecap="${shape.strokeLinecap}"` : '') +
        (shape.strokeDasharray ? ` stroke-dasharray="${shape.strokeDasharray}"` : '') +
        opacity +
        `/>`
      );
    case 'path':
      return (
        `<path d="${shape.d}"` +
        fillStroke(shape) +
        (shape.strokeLinecap ? ` stroke-linecap="${shape.strokeLinecap}"` : '') +
        (shape.strokeDasharray ? ` stroke-dasharray="${shape.strokeDasharray}"` : '') +
        opacity +
        `/>`
      );
    default:
      return '';
  }
}

function fillStroke(shape: {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}): string {
  let out = ` fill="${shape.fill ?? 'none'}"`;
  if (shape.stroke) out += ` stroke="${shape.stroke}"`;
  if (shape.strokeWidth !== undefined) out += ` stroke-width="${shape.strokeWidth}"`;
  return out;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function slug(params: MedicationGlyphParams): string {
  return `${params.form}-${params.scoring}`.replace(/[^a-z0-9-]/gi, '');
}
