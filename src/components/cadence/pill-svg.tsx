import type { Medication } from "@/lib/types";

type Props = {
  med: Pick<Medication, "shape" | "color" | "secondaryColor" | "marking" | "imageDataUrl" | "name">;
  size?: number | string;
  className?: string;
};

function textColor(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#000";
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#000" : "#fff";
}

/** Simple, high-contrast pill drawing. Falls back to an uploaded photo when present. */
export function PillSvg({ med, size = 64, className }: Props) {
  const label = `${med.name || "Pill"}: ${med.shape}, ${med.marking ? `marked ${med.marking}` : "no marking"}`;

  if (med.imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={med.imageDataUrl}
        alt={`Photo of ${med.name || "pill"}`}
        width={typeof size === "number" ? size : undefined}
        height={typeof size === "number" ? size : undefined}
        style={{ width: size, height: size, objectFit: "contain" }}
        className={className}
      />
    );
  }

  const fill = med.color;
  const fill2 = med.secondaryColor || med.color;
  const stroke = "#1f2937";
  const tc = textColor(fill);
  const marking = med.marking.slice(0, 6);

  let shape: React.ReactNode;
  switch (med.shape) {
    case "oval":
      shape = <ellipse cx="50" cy="50" rx="44" ry="28" fill={fill} stroke={stroke} strokeWidth="3" />;
      break;
    case "capsule":
      shape = (
        <>
          <clipPath id="cap-left">
            <rect x="0" y="0" width="50" height="100" />
          </clipPath>
          <rect x="6" y="28" width="88" height="44" rx="22" fill={fill2} stroke={stroke} strokeWidth="3" />
          <rect x="6" y="28" width="88" height="44" rx="22" fill={fill} clipPath="url(#cap-left)" />
          <rect x="6" y="28" width="88" height="44" rx="22" fill="none" stroke={stroke} strokeWidth="3" />
        </>
      );
      break;
    case "oblong":
      shape = <rect x="6" y="30" width="88" height="40" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />;
      break;
    case "triangle":
      shape = <polygon points="50,10 92,84 8,84" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
      break;
    case "square":
      shape = <rect x="14" y="14" width="72" height="72" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />;
      break;
    default:
      shape = <circle cx="50" cy="50" r="42" fill={fill} stroke={stroke} strokeWidth="3" />;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      {shape}
      {marking && (
        <text
          x="50"
          y={med.shape === "triangle" ? 66 : 56}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize={marking.length > 3 ? 18 : 24}
          fill={med.shape === "capsule" ? textColor(fill2) : tc}
        >
          {marking}
        </text>
      )}
    </svg>
  );
}
