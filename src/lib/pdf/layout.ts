/** Shared colors and helpers for jsPDF templates. Values as RGB triples (0-255). */
export const PDF_COLORS = {
  ink: [16, 21, 26] as const,
  muted: [90, 100, 110] as const,
  border: [200, 205, 210] as const,
  primary: [11, 95, 168] as const,
  danger: [178, 32, 32] as const,
  dangerBg: [252, 231, 231] as const,
  dangerContrast: [255, 255, 255] as const,
  paper: [255, 255, 255] as const,
} as const;

/** Wallet card dimensions in inches — standard credit-card / ID-card size. */
export const CARD_WIDTH_IN = 3.375;
export const CARD_HEIGHT_IN = 2.125;

export type PageFormat = 'a4' | 'letter';

export function pageSizeIn(format: PageFormat): [number, number] {
  return format === 'a4' ? [8.2677, 11.6929] : [8.5, 11];
}

type JsPdf = import('jspdf').jsPDF;

/** Draws a dashed line — used for fold and cut guides. */
export function drawDashedLine(
  doc: JsPdf,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash = 0.05,
  gap = 0.05,
): void {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.floor(length / (dash + gap)));
  const dx = (x2 - x1) / length;
  const dy = (y2 - y1) / length;
  let travelled = 0;
  for (let i = 0; i < steps; i += 1) {
    const startX = x1 + dx * travelled;
    const startY = y1 + dy * travelled;
    const segLen = Math.min(dash, length - travelled);
    const endX = startX + dx * segLen;
    const endY = startY + dy * segLen;
    doc.line(startX, startY, endX, endY);
    travelled += dash + gap;
  }
}

export type TextOptions = Parameters<JsPdf['text']>[3];

/**
 * A drawing surface for one panel of the wallet card. When `rotated` is
 * true, every call is flipped 180° around the panel center before being
 * handed to jsPDF, so callers can write the same "top-left, reads normally"
 * drawing code for both the front and the back panel. The back panel is
 * rotated in the artwork so that after the sheet is folded along the shared
 * edge, its content reads right-side up from the reverse side.
 */
export type PanelContext = {
  rect(lx: number, ly: number, w: number, h: number, style?: string): void;
  roundedRect(
    lx: number,
    ly: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ): void;
  image(dataUrl: string, format: string, lx: number, ly: number, w: number, h: number): void;
  text(text: string | string[], lx: number, ly: number, options?: TextOptions): void;
  line(lx1: number, ly1: number, lx2: number, ly2: number): void;
};

export function createPanelContext(
  doc: JsPdf,
  panelX: number,
  panelY: number,
  width: number,
  height: number,
  rotated: boolean,
): PanelContext {
  const point = (lx: number, ly: number): [number, number] =>
    rotated ? [panelX + width - lx, panelY + height - ly] : [panelX + lx, panelY + ly];
  const topLeft = (lx: number, ly: number, w: number, h: number): [number, number] =>
    rotated ? [panelX + width - lx - w, panelY + height - ly - h] : [panelX + lx, panelY + ly];

  return {
    rect(lx, ly, w, h, style) {
      const [x, y] = topLeft(lx, ly, w, h);
      doc.rect(x, y, w, h, style);
    },
    roundedRect(lx, ly, w, h, rx, ry, style) {
      const [x, y] = topLeft(lx, ly, w, h);
      doc.roundedRect(x, y, w, h, rx, ry, style);
    },
    image(dataUrl, format, lx, ly, w, h) {
      const [x, y] = topLeft(lx, ly, w, h);
      doc.addImage(dataUrl, format, x, y, w, h);
    },
    text(text, lx, ly, options) {
      const [x, y] = point(lx, ly);
      doc.text(text, x, y, rotated ? { ...options, angle: 180 } : options);
    },
    line(lx1, ly1, lx2, ly2) {
      const [x1, y1] = point(lx1, ly1);
      const [x2, y2] = point(lx2, ly2);
      doc.line(x1, y1, x2, y2);
    },
  };
}
