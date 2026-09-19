import { HeartPulse } from "lucide-react";
import { formatDate, type MedicalId } from "@/lib/types";

export type SheetFormat = "a4" | "letter";

export const SHEET_SIZES: Record<SheetFormat, { w: number; h: number; label: string }> = {
  a4: { w: 210, h: 297, label: "A4" },
  letter: { w: 215.9, h: 279.4, label: "US Letter" },
};

export const SHEET_MARGIN = 15;

export function SheetPage({
  format,
  children,
  className = "",
}: {
  format: SheetFormat;
  children: React.ReactNode;
  className?: string;
}) {
  const { w, h } = SHEET_SIZES[format];
  return (
    <section
      className={`print-doc print-page bg-white text-black ${className}`}
      style={{
        width: `${w}mm`,
        minHeight: `${h}mm`,
        padding: `${SHEET_MARGIN}mm`,
        boxSizing: "border-box",
        fontSize: "13pt",
        lineHeight: 1.4,
      }}
    >
      {children}
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2
        className="mb-1 border-b font-bold uppercase tracking-wide"
        style={{ color: "#0f6b78", borderColor: "#0f6b78", fontSize: "12pt" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MedicalIdSheet({ id, format }: { id: MedicalId; format: SheetFormat }) {
  const contacts = id.emergencyContacts.filter((c) => c.name || c.phone);
  return (
    <SheetPage format={format}>
      <header
        className="flex items-start justify-between border-b-4 pb-3"
        style={{ borderColor: "#0f6b78" }}
      >
        <div>
          <p className="flex items-center gap-2 font-bold" style={{ color: "#0f6b78", fontSize: "16pt" }}>
            <HeartPulse style={{ width: "8mm", height: "8mm" }} aria-hidden="true" />
            MEDICAL ID
          </p>
          <h1 className="mt-2 font-bold" style={{ fontSize: "30pt", lineHeight: 1.1 }}>
            {id.fullName || "Your name"}
          </h1>
          {id.dateOfBirth && (
            <p style={{ fontSize: "15pt" }}>Date of birth: {formatDate(id.dateOfBirth)}</p>
          )}
        </div>
        <div
          className="rounded-lg px-4 py-2 text-center font-bold text-white"
          style={{ background: "#b91c1c" }}
        >
          <div style={{ fontSize: "10pt" }}>BLOOD TYPE</div>
          <div style={{ fontSize: "28pt", lineHeight: 1 }}>{id.bloodType}</div>
        </div>
      </header>

      <Section title="Allergies">
        {id.allergies.length === 0 ? (
          <p>No known allergies</p>
        ) : (
          <ul className="list-disc pl-6 font-bold" style={{ fontSize: "15pt" }}>
            {id.allergies.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Medical conditions">
        {id.conditions.length === 0 ? (
          <p>None listed</p>
        ) : (
          <ul className="list-disc pl-6">
            {id.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Current medications">
        {id.medications.length === 0 ? (
          <p>None listed</p>
        ) : (
          <ul className="list-disc pl-6">
            {id.medications.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Emergency contacts">
        {contacts.length === 0 ? (
          <p>None listed</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left" style={{ fontSize: "11pt" }}>
                <th className="py-1 pr-3">Name</th>
                <th className="py-1 pr-3">Relationship</th>
                <th className="py-1">Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-1 pr-3 font-bold">{c.name}</td>
                  <td className="py-1 pr-3">{c.relationship}</td>
                  <td className="py-1 font-bold">{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {(id.doctorName || id.doctorPhone) && (
        <Section title="Doctor">
          <p>
            {id.doctorName}
            {id.doctorName && id.doctorPhone && " · "}
            {id.doctorPhone}
          </p>
        </Section>
      )}

      {id.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-wrap">{id.notes}</p>
        </Section>
      )}
    </SheetPage>
  );
}
