import type { MedicalId } from "@/lib/types";
import { CARD_H, CARD_W, WalletCardBack, WalletCardFront } from "./wallet-card";

export const FOLD_W = CARD_W;
export const FOLD_H = CARD_H * 2;

/**
 * One sheet, two panels. Fold along the dashed line so the front and back
 * face outward — no gluing two cards together.
 */
export function FoldCard({ id }: { id: MedicalId }) {
  return (
    <section
      className="print-doc relative bg-white"
      style={{ width: `${FOLD_W}mm`, height: `${FOLD_H}mm` }}
      aria-label="Fold-over Medical ID card"
    >
      <div style={{ transform: "rotate(180deg)" }}>
        <WalletCardFront id={id} />
      </div>
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 flex items-center"
        style={{
          top: `${CARD_H}mm`,
          borderTop: "0.3mm dashed #888",
        }}
      >
        <span
          className="mx-auto bg-white px-2"
          style={{ fontSize: "6pt", color: "#666", transform: "translateY(-50%)" }}
        >
          fold here
        </span>
      </div>
      <WalletCardBack id={id} />
    </section>
  );
}
