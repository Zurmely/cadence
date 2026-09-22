import { z } from 'zod';

/** Schema version stored with the profile. Bump when making breaking changes. */
export const PROFILE_SCHEMA_VERSION = 1;

export const SCHEDULE_SLOTS = ['morning', 'afternoon', 'evening', 'bedtime'] as const;
export type ScheduleSlot = (typeof SCHEDULE_SLOTS)[number];

export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'unknown'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const SEX_VALUES = ['female', 'male', 'other', 'unspecified'] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe', 'unknown'] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];

/**
 * Parametric glyph inputs. The MedicationGlyph island (src/components/glyph)
 * will render these; this type is the shared contract.
 */
export const MEDICATION_FORMS = [
  'tablet-round',
  'tablet-scored',
  'tablet-oval',
  'caplet',
  'capsule',
  'liquid',
  'inhaler',
  'pen',
  'patch',
] as const;
export type MedicationForm = (typeof MEDICATION_FORMS)[number];

export const medicationGlyphParamsSchema = z.object({
  form: z.enum(MEDICATION_FORMS),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  scoring: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(4)]),
});
export type MedicationGlyphParams = z.infer<typeof medicationGlyphParamsSchema>;

export const DEFAULT_GLYPH: MedicationGlyphParams = {
  form: 'tablet-round',
  primaryColor: '#0b5fa8',
  secondaryColor: '#ffffff',
  scoring: 0,
};

export const scheduleSlotsSchema = z.object({
  morning: z.boolean(),
  afternoon: z.boolean(),
  evening: z.boolean(),
  bedtime: z.boolean(),
});
export type ScheduleSlots = z.infer<typeof scheduleSlotsSchema>;

export const EMPTY_SLOTS: ScheduleSlots = {
  morning: false,
  afternoon: false,
  evening: false,
  bedtime: false,
};

export const personSchema = z.object({
  fullName: z.string(),
  preferredName: z.string(),
  dateOfBirth: z.string(),
  sex: z.enum(SEX_VALUES),
  bloodType: z.enum(BLOOD_TYPES),
  documentId: z.string(),
  weightKg: z.string(),
  heightCm: z.string(),
});
export type Person = z.infer<typeof personSchema>;

export const allergySchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.enum(ALLERGY_SEVERITIES),
  reaction: z.string(),
});
export type Allergy = z.infer<typeof allergySchema>;

export const conditionSchema = z.object({
  id: z.string(),
  name: z.string(),
  icd10: z.string(),
  notes: z.string(),
});
export type Condition = z.infer<typeof conditionSchema>;

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Medication catalog id from the autocomplete dataset (public/data/meds/), if selected. */
  code: z.string(),
  dose: z.string(),
  instructions: z.string(),
  slots: scheduleSlotsSchema,
  glyph: medicationGlyphParamsSchema,
});
export type Medication = z.infer<typeof medicationSchema>;

export const emergencyContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  relation: z.string(),
  phone: z.string(),
  isPrimary: z.boolean(),
});
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export const doctorSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  phone: z.string(),
  clinic: z.string(),
  notes: z.string(),
});
export type Doctor = z.infer<typeof doctorSchema>;

export const profileSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  person: personSchema,
  allergies: z.array(allergySchema),
  conditions: z.array(conditionSchema),
  medications: z.array(medicationSchema),
  emergencyContacts: z.array(emergencyContactSchema),
  doctor: doctorSchema,
  notes: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPerson(): Person {
  return {
    fullName: '',
    preferredName: '',
    dateOfBirth: '',
    sex: 'unspecified',
    bloodType: 'unknown',
    documentId: '',
    weightKg: '',
    heightCm: '',
  };
}

export function createEmptyDoctor(): Doctor {
  return { name: '', specialty: '', phone: '', clinic: '', notes: '' };
}

export function createEmptyAllergy(): Allergy {
  return { id: createId(), name: '', severity: 'unknown', reaction: '' };
}

export function createEmptyCondition(): Condition {
  return { id: createId(), name: '', icd10: '', notes: '' };
}

export function createEmptyMedication(): Medication {
  return {
    id: createId(),
    name: '',
    code: '',
    dose: '',
    instructions: '',
    slots: { ...EMPTY_SLOTS },
    glyph: { ...DEFAULT_GLYPH },
  };
}

export function createEmptyContact(): EmergencyContact {
  return { id: createId(), name: '', relation: '', phone: '', isPrimary: false };
}

export function createEmptyProfile(): Profile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    person: createEmptyPerson(),
    allergies: [],
    conditions: [],
    medications: [],
    emergencyContacts: [],
    doctor: createEmptyDoctor(),
    notes: '',
  };
}

/**
 * Coerce unknown JSON into a Profile. Invalid or partial payloads merge onto
 * empty defaults so older hashes and incomplete forms still load.
 */
export function parseProfile(input: unknown): Profile {
  const empty = createEmptyProfile();
  if (!input || typeof input !== 'object') return empty;

  const raw = input as Record<string, unknown>;
  const merged = {
    ...empty,
    ...raw,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    person: { ...empty.person, ...(isRecord(raw.person) ? raw.person : {}) },
    doctor: { ...empty.doctor, ...(isRecord(raw.doctor) ? raw.doctor : {}) },
    allergies: Array.isArray(raw.allergies) ? raw.allergies : empty.allergies,
    conditions: Array.isArray(raw.conditions) ? raw.conditions : empty.conditions,
    medications: Array.isArray(raw.medications) ? raw.medications : empty.medications,
    emergencyContacts: Array.isArray(raw.emergencyContacts)
      ? raw.emergencyContacts
      : empty.emergencyContacts,
    notes: typeof raw.notes === 'string' ? raw.notes : empty.notes,
  };

  const result = profileSchema.safeParse(merged);
  if (result.success) return result.data;

  const personResult = personSchema.safeParse(merged.person);
  const doctorResult = doctorSchema.safeParse(merged.doctor);
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    person: personResult.success ? personResult.data : empty.person,
    doctor: doctorResult.success ? doctorResult.data : empty.doctor,
    allergies: parseArray(merged.allergies, allergySchema),
    conditions: parseArray(merged.conditions, conditionSchema),
    medications: parseArray(merged.medications, medicationSchema, (item) => {
      if (!isRecord(item)) return null;
      const parsed = medicationSchema.safeParse({
        ...createEmptyMedication(),
        ...item,
        slots: { ...EMPTY_SLOTS, ...(isRecord(item.slots) ? item.slots : {}) },
        glyph: { ...DEFAULT_GLYPH, ...(isRecord(item.glyph) ? item.glyph : {}) },
      });
      return parsed.success ? parsed.data : null;
    }),
    emergencyContacts: parseArray(merged.emergencyContacts, emergencyContactSchema),
    notes: typeof merged.notes === 'string' ? merged.notes : '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseArray<T>(
  value: unknown,
  schema: z.ZodType<T>,
  coerce?: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (coerce) {
      const coerced = coerce(item);
      if (coerced) out.push(coerced);
      continue;
    }
    const parsed = schema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** Minimal payload used by emergency share URLs. */
export function toEmergencyProfile(profile: Profile): Profile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    person: {
      ...createEmptyPerson(),
      fullName: profile.person.fullName,
      dateOfBirth: profile.person.dateOfBirth,
      sex: profile.person.sex,
      bloodType: profile.person.bloodType,
    },
    allergies: profile.allergies.map((item) => ({
      id: item.id,
      name: item.name,
      severity: item.severity,
      reaction: item.reaction,
    })),
    conditions: profile.conditions.map((item) => ({
      id: item.id,
      name: item.name,
      icd10: item.icd10,
      notes: '',
    })),
    medications: profile.medications.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      dose: item.dose,
      instructions: '',
      slots: { ...item.slots },
      glyph: { ...DEFAULT_GLYPH },
    })),
    emergencyContacts: profile.emergencyContacts.map((item) => ({ ...item })),
    doctor: {
      ...createEmptyDoctor(),
      name: profile.doctor.name,
      specialty: profile.doctor.specialty,
      phone: profile.doctor.phone,
    },
    notes: '',
  };
}
