import { describe, expect, it } from "vitest";
import {
  createRecordExport,
  mergeRecords,
  parseRecordImport,
} from "./record-transfer";
import { newRecord } from "./types";

describe("record import and export", () => {
  it("round-trips a Medical ID and medication cadence", () => {
    const record = newRecord("patient", "patient-1");
    record.medicalId.fullName = "Margaret Okafor";
    record.cadence.medications.push({
      id: "med-1",
      name: "Metformin",
      dose: "500 mg",
      shape: "round",
      color: "#fff",
      marking: "M",
      food: "with",
      instructions: "Take after breakfast",
      slots: ["morning"],
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    });

    const json = JSON.stringify(createRecordExport([record], new Date("2026-09-19")));
    expect(parseRecordImport(json)).toEqual([record]);
  });

  it("rejects invalid, empty, and duplicate record files", () => {
    expect(() => parseRecordImport("not json")).toThrow("not a valid JSON");
    expect(() =>
      parseRecordImport(
        JSON.stringify({ app: "Cadence", version: 1, exportedAt: "", records: [] })
      )
    ).toThrow("contains no records");

    const record = newRecord("patient", "duplicate");
    expect(() =>
      parseRecordImport(JSON.stringify(createRecordExport([record, record])))
    ).toThrow("duplicate record IDs");
  });

  it("replaces matching records and preserves other local records", () => {
    const existing = newRecord("patient", "one");
    const untouched = newRecord("patient", "two");
    const imported = { ...existing, medicalId: { ...existing.medicalId, fullName: "Updated" } };
    expect(mergeRecords([existing, untouched], [imported])).toEqual([imported, untouched]);
  });
});
