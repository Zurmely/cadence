import {
  emptyCadence,
  emptyMedicalId,
  type HealthRecord,
} from "./types";

const RECORDS_KEY = "cadence:records:v1";
const A11Y_KEY = "cadence:a11y:v1";

export type A11yPrefs = { largePrint: boolean; highContrast: boolean };
export const DEFAULT_A11Y: A11yPrefs = { largePrint: false, highContrast: false };

export class StorageError extends Error {}

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadRecords(): HealthRecord[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(RECORDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HealthRecord[];
    if (!Array.isArray(parsed)) return [];
    // Fill in fields added after a record was first saved.
    return parsed.map((r) => ({
      ...r,
      medicalId: { ...emptyMedicalId(), ...r.medicalId },
      cadence: { ...emptyCadence(), ...r.cadence },
    }));
  } catch {
    throw new StorageError(
      "Saved data could not be read. It may have been edited or corrupted."
    );
  }
}

export function saveRecords(records: HealthRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    throw new StorageError(
      "Could not save. Your browser storage may be full — try removing large pill photos."
    );
  }
}

export function loadA11y(): A11yPrefs {
  if (!isBrowser()) return DEFAULT_A11Y;
  try {
    const raw = window.localStorage.getItem(A11Y_KEY);
    return raw ? { ...DEFAULT_A11Y, ...JSON.parse(raw) } : DEFAULT_A11Y;
  } catch {
    return DEFAULT_A11Y;
  }
}

export function saveA11y(prefs: A11yPrefs) {
  if (!isBrowser()) return;
  window.localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
}
