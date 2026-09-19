export const BLOOD_TYPES = [
  "Unknown",
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
};

export type MedicalId = {
  fullName: string;
  dateOfBirth: string;
  bloodType: BloodType;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContacts: EmergencyContact[];
  doctorName: string;
  doctorPhone: string;
  notes: string;
};

export const TIME_SLOTS = ["morning", "noon", "evening", "night"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning",
  noon: "Midday",
  evening: "Evening",
  night: "Bedtime",
};

export const DEFAULT_SLOT_TIMES: Record<TimeSlot, string> = {
  morning: "08:00",
  noon: "12:00",
  evening: "18:00",
  night: "22:00",
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const PILL_SHAPES = [
  "round",
  "oval",
  "capsule",
  "oblong",
  "triangle",
  "square",
] as const;
export type PillShape = (typeof PILL_SHAPES)[number];

export const PILL_COLORS = [
  { name: "White", value: "#f5f5f4" },
  { name: "Yellow", value: "#facc15" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#f472b6" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Brown", value: "#92400e" },
  { name: "Grey", value: "#9ca3af" },
] as const;

export type FoodRule = "with" | "without" | "either";

export type Medication = {
  id: string;
  name: string;
  dose: string;
  shape: PillShape;
  color: string;
  secondaryColor?: string;
  marking: string;
  imageDataUrl?: string;
  food: FoodRule;
  instructions: string;
  slots: TimeSlot[];
  days: Weekday[];
};

export type Cadence = {
  slotTimes: Record<TimeSlot, string>;
  medications: Medication[];
  generalInstructions: string;
};

export type HealthRecord = {
  id: string;
  kind: "self" | "patient";
  medicalId: MedicalId;
  cadence: Cadence;
  updatedAt: string;
};

export const SELF_RECORD_ID = "self";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

export function emptyMedicalId(): MedicalId {
  return {
    fullName: "",
    dateOfBirth: "",
    bloodType: "Unknown",
    allergies: [],
    conditions: [],
    medications: [],
    emergencyContacts: [],
    doctorName: "",
    doctorPhone: "",
    notes: "",
  };
}

export function emptyCadence(): Cadence {
  return {
    slotTimes: { ...DEFAULT_SLOT_TIMES },
    medications: [],
    generalInstructions: "",
  };
}

export function newMedication(): Medication {
  return {
    id: newId(),
    name: "",
    dose: "",
    shape: "round",
    color: PILL_COLORS[0].value,
    marking: "",
    food: "either",
    instructions: "",
    slots: ["morning"],
    days: [...WEEKDAYS],
  };
}

export function newRecord(kind: HealthRecord["kind"], id = newId()): HealthRecord {
  return {
    id,
    kind,
    medicalId: emptyMedicalId(),
    cadence: emptyCadence(),
    updatedAt: new Date().toISOString(),
  };
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const d = new Date();
  d.setHours(h, m ?? 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
