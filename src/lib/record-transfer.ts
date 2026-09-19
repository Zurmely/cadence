import {
  BLOOD_TYPES,
  PILL_SHAPES,
  TIME_SLOTS,
  WEEKDAYS,
  type HealthRecord,
} from "./types";

export const TRANSFER_VERSION = 1;

export type RecordExport = {
  app: "Cadence";
  version: typeof TRANSFER_VERSION;
  exportedAt: string;
  records: HealthRecord[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is HealthRecord {
  if (!isObject(value) || !isObject(value.medicalId) || !isObject(value.cadence)) return false;
  const id = value.medicalId;
  const cadence = value.cadence;
  const slotTimes = cadence.slotTimes;
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    (value.kind !== "self" && value.kind !== "patient") ||
    typeof value.updatedAt !== "string" ||
    typeof id.fullName !== "string" ||
    typeof id.dateOfBirth !== "string" ||
    !BLOOD_TYPES.includes(id.bloodType as (typeof BLOOD_TYPES)[number]) ||
    !hasStrings(id.allergies) ||
    !hasStrings(id.conditions) ||
    !hasStrings(id.medications) ||
    !Array.isArray(id.emergencyContacts) ||
    !id.emergencyContacts.every(
      (contact) =>
        isObject(contact) &&
        ["id", "name", "relationship", "phone"].every(
          (field) => typeof contact[field] === "string"
        )
    ) ||
    typeof id.doctorName !== "string" ||
    typeof id.doctorPhone !== "string" ||
    typeof id.notes !== "string" ||
    !isObject(slotTimes) ||
    !TIME_SLOTS.every((slot) => typeof slotTimes[slot] === "string") ||
    !Array.isArray(cadence.medications) ||
    typeof cadence.generalInstructions !== "string"
  ) {
    return false;
  }

  return cadence.medications.every(
    (medication) =>
      isObject(medication) &&
      typeof medication.id === "string" &&
      typeof medication.name === "string" &&
      typeof medication.dose === "string" &&
      PILL_SHAPES.includes(medication.shape as (typeof PILL_SHAPES)[number]) &&
      typeof medication.color === "string" &&
      typeof medication.marking === "string" &&
      (medication.food === "with" ||
        medication.food === "without" ||
        medication.food === "either") &&
      typeof medication.instructions === "string" &&
      Array.isArray(medication.slots) &&
      medication.slots.every((slot) =>
        TIME_SLOTS.includes(slot as (typeof TIME_SLOTS)[number])
      ) &&
      Array.isArray(medication.days) &&
      medication.days.every((day) => WEEKDAYS.includes(day as (typeof WEEKDAYS)[number])) &&
      (medication.secondaryColor === undefined ||
        typeof medication.secondaryColor === "string") &&
      (medication.imageDataUrl === undefined || typeof medication.imageDataUrl === "string")
  );
}

export function createRecordExport(records: HealthRecord[], now = new Date()): RecordExport {
  return {
    app: "Cadence",
    version: TRANSFER_VERSION,
    exportedAt: now.toISOString(),
    records,
  };
}

export function parseRecordImport(text: string): HealthRecord[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not a valid JSON file.");
  }

  if (
    !isObject(value) ||
    value.app !== "Cadence" ||
    value.version !== TRANSFER_VERSION ||
    !Array.isArray(value.records)
  ) {
    throw new Error("This file is not a supported Cadence export.");
  }
  if (value.records.length === 0) {
    throw new Error("This Cadence export contains no records.");
  }
  if (!value.records.every(isRecord)) {
    throw new Error("One or more records are incomplete or invalid.");
  }

  const ids = new Set<string>();
  for (const record of value.records) {
    if (ids.has(record.id)) throw new Error("The file contains duplicate record IDs.");
    ids.add(record.id);
  }
  return value.records;
}

export function mergeRecords(
  existing: HealthRecord[],
  imported: HealthRecord[]
): HealthRecord[] {
  const replacements = new Map(imported.map((record) => [record.id, record]));
  return [
    ...existing.map((record) => replacements.get(record.id) ?? record),
    ...imported.filter((record) => !existing.some((current) => current.id === record.id)),
  ];
}
