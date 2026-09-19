import { CalendarClock } from "lucide-react";
import { SheetPage, type SheetFormat } from "@/components/medical-id/id-sheet";
import { PillSvg } from "./pill-svg";
import { FOOD_LABELS, FoodIcon, TimeSlotIcon } from "./time-icons";
import {
  formatDate,
  formatTime,
  SLOT_LABELS,
  TIME_SLOTS,
  WEEKDAYS,
  type Cadence,
  type MedicalId,
} from "@/lib/types";

const TEAL = "#0f6b78";

export function CadenceSheet({
  id,
  cadence,
  format,
}: {
  id: MedicalId;
  cadence: Cadence;
  format: SheetFormat;
}) {
  const meds = cadence.medications.filter((m) => m.slots.length > 0);
  const needsWeekly = meds.some((m) => m.days.length !== WEEKDAYS.length);
  const activeSlots = TIME_SLOTS.filter((s) => meds.some((m) => m.slots.includes(s)));

  return (
    <>
      <SheetPage format={format}>
        <header className="border-b-4 pb-3" style={{ borderColor: TEAL }}>
          <p className="flex items-center gap-2 font-bold" style={{ color: TEAL, fontSize: "16pt" }}>
            <CalendarClock style={{ width: "8mm", height: "8mm" }} aria-hidden="true" />
            MY MEDICINES — DAILY SCHEDULE
          </p>
          <h1 className="mt-1 font-bold" style={{ fontSize: "24pt", lineHeight: 1.1 }}>
            {id.fullName || "Your name"}
          </h1>
          <p style={{ fontSize: "11pt", color: "#333" }}>
            {id.dateOfBirth && `Born ${formatDate(id.dateOfBirth)} · `}
            Prepared {new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            {id.doctorName && ` · Doctor: ${id.doctorName}${id.doctorPhone ? ` ${id.doctorPhone}` : ""}`}
          </p>
        </header>

        {meds.length === 0 ? (
          <p className="mt-8 text-center" style={{ fontSize: "14pt" }}>
            No medicines have been scheduled yet.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            {activeSlots.map((slot) => {
              const slotMeds = meds.filter((m) => m.slots.includes(slot));
              return (
                <section
                  key={slot}
                  className="rounded-lg border-2"
                  style={{ borderColor: TEAL, breakInside: "avoid" }}
                >
                  <h2
                    className="flex items-center gap-3 rounded-t-md px-4 py-2 font-bold text-white"
                    style={{ background: TEAL, fontSize: "16pt" }}
                  >
                    <TimeSlotIcon slot={slot} style={{ width: "9mm", height: "9mm" }} />
                    {SLOT_LABELS[slot]}
                    <span className="ml-auto" style={{ fontSize: "14pt" }}>
                      around {formatTime(cadence.slotTimes[slot])}
                    </span>
                  </h2>
                  <ul>
                    {slotMeds.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-4 border-t px-4 py-3"
                        style={{ borderColor: "#ccc" }}
                      >
                        <PillSvg med={m} size="18mm" />
                        <div className="flex-1">
                          <p className="font-bold" style={{ fontSize: "15pt" }}>
                            {m.name || "Unnamed medicine"}
                            {m.dose && <span className="font-normal"> — {m.dose}</span>}
                          </p>
                          <p className="flex items-center gap-2" style={{ fontSize: "11pt" }}>
                            <FoodIcon rule={m.food} style={{ width: "5mm", height: "5mm" }} />
                            {FOOD_LABELS[m.food]}
                            {m.days.length !== WEEKDAYS.length && (
                              <span> · {m.days.length ? m.days.join(", ") : "no days chosen"}</span>
                            )}
                          </p>
                          {m.instructions && (
                            <p style={{ fontSize: "11pt", color: "#333" }}>{m.instructions}</p>
                          )}
                        </div>
                        <div
                          aria-label="Tick when taken"
                          className="shrink-0 rounded border-2"
                          style={{ width: "10mm", height: "10mm", borderColor: "#555" }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {cadence.generalInstructions && (
          <section className="mt-6 rounded-lg border p-4" style={{ borderColor: "#999" }}>
            <h2 className="font-bold" style={{ fontSize: "13pt" }}>
              Advice from your doctor
            </h2>
            <p className="whitespace-pre-wrap">{cadence.generalInstructions}</p>
          </section>
        )}

        <p className="mt-6" style={{ fontSize: "10pt", color: "#444" }}>
          Keep this page where you take your medicines. If you are unsure about any medicine,
          call your doctor or pharmacist before taking it.
        </p>
      </SheetPage>

      {needsWeekly && (
        <SheetPage format={format}>
          <h1 className="font-bold" style={{ fontSize: "20pt", color: TEAL }}>
            Weekly plan — {id.fullName || "Your name"}
          </h1>
          <p className="mb-4" style={{ fontSize: "11pt" }}>
            Some medicines are not taken every day. This table shows which day each is due.
          </p>
          <table className="w-full border-collapse" style={{ fontSize: "10pt" }}>
            <thead>
              <tr>
                <th className="border p-2 text-left" style={{ borderColor: "#555" }}>
                  Medicine
                </th>
                {WEEKDAYS.map((d) => (
                  <th key={d} className="border p-2" style={{ borderColor: "#555" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => (
                <tr key={m.id}>
                  <th
                    scope="row"
                    className="border p-2 text-left font-bold"
                    style={{ borderColor: "#555" }}
                  >
                    <span className="flex items-center gap-2">
                      <PillSvg med={m} size="8mm" />
                      <span>
                        {m.name || "Unnamed"}
                        <br />
                        <span className="font-normal">
                          {m.slots.map((s) => SLOT_LABELS[s]).join(", ")}
                        </span>
                      </span>
                    </span>
                  </th>
                  {WEEKDAYS.map((d) => {
                    const due = m.days.includes(d);
                    return (
                      <td
                        key={d}
                        className="border p-2 text-center"
                        style={{ borderColor: "#555", background: due ? "#e6f4f6" : "#fff" }}
                      >
                        <span className="sr-only">{due ? "Take" : "Do not take"}</span>
                        <span aria-hidden="true" style={{ fontSize: "14pt" }}>
                          {due ? "✔" : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </SheetPage>
      )}
    </>
  );
}
