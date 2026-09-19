import { HeartPulse, Phone } from "lucide-react";
import { formatDate, type MedicalId } from "@/lib/types";

export const CARD_W = 85.6;
export const CARD_H = 54;

const cardStyle: React.CSSProperties = {
  width: `${CARD_W}mm`,
  height: `${CARD_H}mm`,
  padding: "3mm",
  fontSize: "7.5pt",
  lineHeight: 1.25,
  overflow: "hidden",
  boxSizing: "border-box",
  borderRadius: "3mm",
  border: "0.4mm solid #0f6b78",
};

function joinOr(items: string[], fallback: string) {
  return items.length ? items.join(", ") : fallback;
}

export function WalletCardFront({ id }: { id: MedicalId }) {
  return (
    <section
      className="print-doc flex flex-col bg-white text-black"
      style={cardStyle}
      aria-label="Medical ID card, front"
    >
      <header
        className="flex items-center justify-between border-b pb-1"
        style={{ borderColor: "#0f6b78", borderBottomWidth: "0.5mm" }}
      >
        <span className="flex items-center gap-1 font-bold" style={{ color: "#0f6b78", fontSize: "9pt" }}>
          <HeartPulse style={{ width: "4mm", height: "4mm" }} aria-hidden="true" />
          MEDICAL ID
        </span>
        <span
          className="rounded px-1.5 font-bold text-white"
          style={{ background: "#b91c1c", fontSize: "9pt" }}
        >
          Blood: {id.bloodType}
        </span>
      </header>
      <p className="mt-1 truncate font-bold" style={{ fontSize: "13pt" }}>
        {id.fullName || "Your name"}
      </p>
      {id.dateOfBirth && <p>Born {formatDate(id.dateOfBirth)}</p>}
      <dl className="mt-1 space-y-0.5">
        <div>
          <dt className="inline font-bold">Allergies: </dt>
          <dd className="inline">{joinOr(id.allergies, "No known allergies")}</dd>
        </div>
        {id.conditions.length > 0 && (
          <div>
            <dt className="inline font-bold">Conditions: </dt>
            <dd className="inline">{id.conditions.join(", ")}</dd>
          </div>
        )}
      </dl>
      <p className="mt-auto text-right" style={{ fontSize: "6pt", color: "#444" }}>
        See back for contacts and medications
      </p>
    </section>
  );
}

export function WalletCardBack({ id }: { id: MedicalId }) {
  const contacts = id.emergencyContacts.filter((c) => c.name || c.phone);
  return (
    <section
      className="print-doc flex flex-col bg-white text-black"
      style={cardStyle}
      aria-label="Medical ID card, back"
    >
      <h2 className="flex items-center gap-1 font-bold" style={{ color: "#0f6b78", fontSize: "9pt" }}>
        <Phone style={{ width: "3.5mm", height: "3.5mm" }} aria-hidden="true" />
        In an emergency, call
      </h2>
      {contacts.length === 0 ? (
        <p style={{ color: "#444" }}>No emergency contact added</p>
      ) : (
        <ul>
          {contacts.slice(0, 3).map((c) => (
            <li key={c.id}>
              <span className="font-bold">{c.name}</span>
              {c.relationship && ` (${c.relationship})`} {c.phone}
            </li>
          ))}
        </ul>
      )}
      {(id.doctorName || id.doctorPhone) && (
        <p className="mt-1">
          <span className="font-bold">Doctor: </span>
          {[id.doctorName, id.doctorPhone].filter(Boolean).join(" · ")}
        </p>
      )}
      {id.medications.length > 0 && (
        <p className="mt-1">
          <span className="font-bold">Medications: </span>
          {id.medications.join(", ")}
        </p>
      )}
      {id.notes && (
        <p className="mt-1">
          <span className="font-bold">Notes: </span>
          {id.notes}
        </p>
      )}
    </section>
  );
}
