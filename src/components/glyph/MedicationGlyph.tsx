import { useId } from 'react';
import type { MedicationGlyphParams } from '../../lib/profile/schema';
import { buildGlyphGeometry, describeGlyph, GLYPH_VIEW_BOX, type GlyphShape } from './geometry';

export type { MedicationGlyphParams };

/**
 * Parametric medication glyph. Draws from the same shape geometry as
 * `renderGlyphSvgString` (render.ts) so the on-screen preview, the PDF
 * raster, and the plain SVG string can never disagree. Pure vector output
 * on a fixed viewBox keeps it crisp at any `size`.
 */
export function MedicationGlyph({
  form,
  primaryColor,
  secondaryColor,
  scoring,
  size = 40,
  label,
}: MedicationGlyphParams & { size?: number; label?: string }) {
  const titleId = useId();
  const accessibleLabel = label ?? describeGlyph({ form, primaryColor, secondaryColor, scoring });
  const { viewBox, shapes } = buildGlyphGeometry({ form, primaryColor, secondaryColor, scoring });

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox || GLYPH_VIEW_BOX}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{accessibleLabel}</title>
      {shapes.map((shape, index) => (
        <GlyphShapeNode key={index} shape={shape} />
      ))}
    </svg>
  );
}

function GlyphShapeNode({ shape }: { shape: GlyphShape }) {
  switch (shape.kind) {
    case 'circle':
      return (
        <circle
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.fill ?? 'none'}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={shape.fill ?? 'none'}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      );
    case 'rect':
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          ry={shape.ry}
          fill={shape.fill ?? 'none'}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.strokeDasharray}
          opacity={shape.opacity}
        />
      );
    case 'line':
      return (
        <line
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinecap={shape.strokeLinecap}
          strokeDasharray={shape.strokeDasharray}
          opacity={shape.opacity}
        />
      );
    case 'path':
      return (
        <path
          d={shape.d}
          fill={shape.fill ?? 'none'}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinecap={shape.strokeLinecap}
          strokeDasharray={shape.strokeDasharray}
          opacity={shape.opacity}
        />
      );
    default:
      return null;
  }
}
