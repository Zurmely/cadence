import type { MedicationGlyphParams } from '../../lib/profile';

/**
 * Placeholder SVG. Replace this module with the parametric MedicationGlyph
 * (tablet / capsule / liquid / inhaler / pen / patch) used by cards, timeline,
 * and PDF rasterization.
 */
export function MedicationGlyph({
  form,
  primaryColor,
  secondaryColor,
  scoring,
  size = 40,
}: MedicationGlyphParams & { size?: number }) {
  const label = `${form}${scoring ? `, score ${scoring}` : ''}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={label}
    >
      <rect x="4" y="8" width="32" height="24" rx="12" fill={primaryColor} />
      <rect x="20" y="8" width="16" height="24" rx="12" fill={secondaryColor} />
      {scoring > 0 ? (
        <line x1="20" y1="10" x2="20" y2="30" stroke="#10151a" strokeWidth="2" />
      ) : null}
    </svg>
  );
}

export type { MedicationGlyphParams };
