import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  ALLERGY_SEVERITIES,
  BLOOD_TYPES,
  MEDICATION_FORMS,
  SCHEDULE_SLOTS,
  SEX_VALUES,
  createEmptyAllergy,
  createEmptyCondition,
  createEmptyContact,
  createEmptyMedication,
  type Allergy,
  type Condition,
  type EmergencyContact,
  type Medication,
  type Profile,
} from '../../lib/profile';
import { useProfile } from '../../lib/profile/useProfile';
import { t, type Locale, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { Switch } from '../ui/Switch';
import { MedicationGlyph } from '../glyph/MedicationGlyph';

const ADVANCED_KEY = 'cadence.ui.advanced.v1';

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'min-h-11 w-full rounded-md border-2 border-cadence-border bg-white px-3 text-cadence-text';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cadence-card p-5 sm:p-6">
      <h2 className="mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function ProfileEditor() {
  const [locale] = useLocale();
  const { profile, store } = useProfile();
  const advancedId = useId();
  const [advanced, setAdvanced] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    try {
      setAdvanced(localStorage.getItem(ADVANCED_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let timeout: number | undefined;
    let first = true;
    const unsubscribe = store.subscribe(() => {
      if (first) {
        first = false;
        return;
      }
      setSavedFlash(true);
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setSavedFlash(false), 1200);
    });
    return () => {
      unsubscribe();
      if (timeout) window.clearTimeout(timeout);
    };
  }, [store]);

  const setAdvancedAndPersist = (value: boolean) => {
    setAdvanced(value);
    try {
      localStorage.setItem(ADVANCED_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const patch = (updater: (current: Profile) => Profile) => {
    store.update(updater);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl">{t(locale, 'profile.title')}</h1>
        <p className="max-w-3xl text-cadence-muted">{t(locale, 'profile.lead')}</p>
        <div className="cadence-card p-4">
          <Switch
            id={advancedId}
            checked={advanced}
            onCheckedChange={setAdvancedAndPersist}
            label={t(locale, 'profile.advanced')}
            description={t(locale, 'profile.advancedHint')}
          />
        </div>
        <p className="text-cadence-success" aria-live="polite">
          {savedFlash ? t(locale, 'profile.saved') : '\u00a0'}
        </p>
      </header>

      <PersonSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <AllergySection locale={locale} profile={profile} patch={patch} />
      <ConditionSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <MedicationSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <ContactSection locale={locale} profile={profile} patch={patch} />
      {advanced ? <DoctorSection locale={locale} profile={profile} patch={patch} /> : null}

      <Section title={t(locale, 'profile.notes')}>
        <textarea
          className={`${inputClass} min-h-32 py-2`}
          value={profile.notes}
          placeholder={t(locale, 'profile.notesPlaceholder')}
          onChange={(event) =>
            patch((current) => ({ ...current, notes: event.target.value }))
          }
        />
      </Section>

      <div>
        <button
          type="button"
          className="min-h-11 rounded-md border-2 border-cadence-danger px-4 font-semibold text-cadence-danger"
          onClick={() => {
            if (window.confirm(t(locale, 'profile.resetConfirm'))) store.reset();
          }}
        >
          {t(locale, 'profile.reset')}
        </button>
      </div>
    </div>
  );
}

function PersonSection({
  locale,
  profile,
  advanced,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  advanced: boolean;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const person = profile.person;
  const setPerson = <K extends keyof Profile['person']>(key: K, value: Profile['person'][K]) =>
    patch((current) => ({
      ...current,
      person: { ...current.person, [key]: value },
    }));

  return (
    <Section title={t(locale, 'profile.person')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t(locale, 'profile.fullName')}>
          <input
            className={inputClass}
            autoComplete="name"
            value={person.fullName}
            onChange={(event) => setPerson('fullName', event.target.value)}
          />
        </Field>
        {advanced ? (
          <Field label={t(locale, 'profile.preferredName')}>
            <input
              className={inputClass}
              value={person.preferredName}
              onChange={(event) => setPerson('preferredName', event.target.value)}
            />
          </Field>
        ) : null}
        <Field label={t(locale, 'profile.dateOfBirth')}>
          <input
            className={inputClass}
            type="date"
            value={person.dateOfBirth}
            onChange={(event) => setPerson('dateOfBirth', event.target.value)}
          />
        </Field>
        <Field label={t(locale, 'profile.sex')}>
          <select
            className={inputClass}
            value={person.sex}
            onChange={(event) => setPerson('sex', event.target.value as Profile['person']['sex'])}
          >
            {SEX_VALUES.map((value) => (
              <option key={value} value={value}>
                {t(
                  locale,
                  (
                    {
                      female: 'profile.sexFemale',
                      male: 'profile.sexMale',
                      other: 'profile.sexOther',
                      unspecified: 'profile.sexUnspecified',
                    } as const
                  )[value],
                )}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t(locale, 'profile.bloodType')}>
          <select
            className={inputClass}
            value={person.bloodType}
            onChange={(event) =>
              setPerson('bloodType', event.target.value as Profile['person']['bloodType'])
            }
          >
            {BLOOD_TYPES.map((value) => (
              <option key={value} value={value}>
                {value === 'unknown' ? t(locale, 'profile.bloodUnknown') : value}
              </option>
            ))}
          </select>
        </Field>
        {advanced ? (
          <>
            <Field label={t(locale, 'profile.documentId')}>
              <input
                className={inputClass}
                value={person.documentId}
                onChange={(event) => setPerson('documentId', event.target.value)}
              />
            </Field>
            <Field label={t(locale, 'profile.weightKg')}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={person.weightKg}
                onChange={(event) => setPerson('weightKg', event.target.value)}
              />
            </Field>
            <Field label={t(locale, 'profile.heightCm')}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={person.heightCm}
                onChange={(event) => setPerson('heightCm', event.target.value)}
              />
            </Field>
          </>
        ) : null}
      </div>
    </Section>
  );
}

function AllergySection({
  locale,
  profile,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const update = (id: string, partial: Partial<Allergy>) =>
    patch((current) => ({
      ...current,
      allergies: current.allergies.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));

  return (
    <Section title={t(locale, 'profile.allergies')}>
      {profile.allergies.length === 0 ? (
        <p className="mb-3 text-cadence-muted">{t(locale, 'profile.allergiesEmpty')}</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-4">
          {profile.allergies.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-md border border-cadence-border p-3 sm:grid-cols-3">
              <Field label={t(locale, 'profile.allergyName')}>
                <input
                  className={inputClass}
                  value={item.name}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
              </Field>
              <Field label={t(locale, 'profile.allergySeverity')}>
                <select
                  className={inputClass}
                  value={item.severity}
                  onChange={(event) =>
                    update(item.id, { severity: event.target.value as Allergy['severity'] })
                  }
                >
                  {ALLERGY_SEVERITIES.map((value) => (
                    <option key={value} value={value}>
                      {t(
                        locale,
                        (
                          {
                            mild: 'profile.severityMild',
                            moderate: 'profile.severityModerate',
                            severe: 'profile.severitySevere',
                            unknown: 'profile.severityUnknown',
                          } as const
                        )[value],
                      )}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(locale, 'profile.allergyReaction')}>
                <input
                  className={inputClass}
                  value={item.reaction}
                  onChange={(event) => update(item.id, { reaction: event.target.value })}
                />
              </Field>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  className="text-cadence-danger underline"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      allergies: current.allergies.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  {t(locale, 'profile.removeAllergy')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddButton
        label={t(locale, 'profile.addAllergy')}
        onClick={() =>
          patch((current) => ({
            ...current,
            allergies: [...current.allergies, createEmptyAllergy()],
          }))
        }
      />
    </Section>
  );
}

function ConditionSection({
  locale,
  profile,
  advanced,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  advanced: boolean;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const update = (id: string, partial: Partial<Condition>) =>
    patch((current) => ({
      ...current,
      conditions: current.conditions.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));

  return (
    <Section title={t(locale, 'profile.conditions')}>
      {profile.conditions.length === 0 ? (
        <p className="mb-3 text-cadence-muted">{t(locale, 'profile.conditionsEmpty')}</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-4">
          {profile.conditions.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-md border border-cadence-border p-3 sm:grid-cols-2">
              <Field label={t(locale, 'profile.conditionName')}>
                <input
                  className={inputClass}
                  value={item.name}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
              </Field>
              {advanced ? (
                <Field label={t(locale, 'profile.conditionIcd10')}>
                  <input
                    className={inputClass}
                    value={item.icd10}
                    onChange={(event) => update(item.id, { icd10: event.target.value })}
                  />
                </Field>
              ) : null}
              {advanced ? (
                <div className="sm:col-span-2">
                  <Field label={t(locale, 'profile.conditionNotes')}>
                    <input
                      className={inputClass}
                      value={item.notes}
                      onChange={(event) => update(item.id, { notes: event.target.value })}
                    />
                  </Field>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="text-cadence-danger underline"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      conditions: current.conditions.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  {t(locale, 'profile.removeCondition')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddButton
        label={t(locale, 'profile.addCondition')}
        onClick={() =>
          patch((current) => ({
            ...current,
            conditions: [...current.conditions, createEmptyCondition()],
          }))
        }
      />
    </Section>
  );
}

function MedicationSection({
  locale,
  profile,
  advanced,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  advanced: boolean;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const update = (id: string, partial: Partial<Medication>) =>
    patch((current) => ({
      ...current,
      medications: current.medications.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));

  const slotLabel: Record<(typeof SCHEDULE_SLOTS)[number], MessageKey> = {
    morning: 'profile.slotMorning',
    afternoon: 'profile.slotAfternoon',
    evening: 'profile.slotEvening',
    bedtime: 'profile.slotBedtime',
  };

  return (
    <Section title={t(locale, 'profile.medications')}>
      {profile.medications.length === 0 ? (
        <p className="mb-3 text-cadence-muted">{t(locale, 'profile.medicationsEmpty')}</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-4">
          {profile.medications.map((item) => (
            <li key={item.id} className="flex flex-col gap-3 rounded-md border border-cadence-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t(locale, 'profile.medicationName')}>
                  <input
                    className={inputClass}
                    value={item.name}
                    onChange={(event) => update(item.id, { name: event.target.value })}
                  />
                </Field>
                <Field label={t(locale, 'profile.medicationDose')}>
                  <input
                    className={inputClass}
                    value={item.dose}
                    onChange={(event) => update(item.id, { dose: event.target.value })}
                  />
                </Field>
              </div>
              <Field label={t(locale, 'profile.medicationInstructions')}>
                <input
                  className={inputClass}
                  value={item.instructions}
                  onChange={(event) => update(item.id, { instructions: event.target.value })}
                />
              </Field>
              <fieldset>
                <legend className="mb-2 font-semibold">{t(locale, 'profile.medicationSlots')}</legend>
                <div className="flex flex-wrap gap-3">
                  {SCHEDULE_SLOTS.map((slot) => (
                    <label key={slot} className="inline-flex min-h-11 items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={item.slots[slot]}
                        onChange={(event) =>
                          update(item.id, {
                            slots: { ...item.slots, [slot]: event.target.checked },
                          })
                        }
                      />
                      {t(locale, slotLabel[slot])}
                    </label>
                  ))}
                </div>
              </fieldset>
              {advanced ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-end gap-3">
                    <MedicationGlyph {...item.glyph} size={48} />
                    <Field label={t(locale, 'profile.glyphForm')}>
                      <select
                        className={inputClass}
                        value={item.glyph.form}
                        onChange={(event) =>
                          update(item.id, {
                            glyph: {
                              ...item.glyph,
                              form: event.target.value as Medication['glyph']['form'],
                            },
                          })
                        }
                      >
                        {MEDICATION_FORMS.map((form) => (
                          <option key={form} value={form}>
                            {form}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label={t(locale, 'profile.glyphPrimary')}>
                    <input
                      className={inputClass}
                      type="color"
                      value={item.glyph.primaryColor}
                      onChange={(event) =>
                        update(item.id, {
                          glyph: { ...item.glyph, primaryColor: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label={t(locale, 'profile.glyphSecondary')}>
                    <input
                      className={inputClass}
                      type="color"
                      value={item.glyph.secondaryColor}
                      onChange={(event) =>
                        update(item.id, {
                          glyph: { ...item.glyph, secondaryColor: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label={t(locale, 'profile.glyphScoring')}>
                    <select
                      className={inputClass}
                      value={item.glyph.scoring}
                      onChange={(event) =>
                        update(item.id, {
                          glyph: {
                            ...item.glyph,
                            scoring: Number(event.target.value) as Medication['glyph']['scoring'],
                          },
                        })
                      }
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                    </select>
                  </Field>
                </div>
              ) : null}
              <button
                type="button"
                className="self-start text-cadence-danger underline"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    medications: current.medications.filter((row) => row.id !== item.id),
                  }))
                }
              >
                {t(locale, 'profile.removeMedication')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <AddButton
        label={t(locale, 'profile.addMedication')}
        onClick={() =>
          patch((current) => ({
            ...current,
            medications: [...current.medications, createEmptyMedication()],
          }))
        }
      />
    </Section>
  );
}

function ContactSection({
  locale,
  profile,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const update = (id: string, partial: Partial<EmergencyContact>) =>
    patch((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.map((item) =>
        item.id === id ? { ...item, ...partial } : item,
      ),
    }));

  return (
    <Section title={t(locale, 'profile.contacts')}>
      {profile.emergencyContacts.length === 0 ? (
        <p className="mb-3 text-cadence-muted">{t(locale, 'profile.contactsEmpty')}</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-4">
          {profile.emergencyContacts.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-md border border-cadence-border p-3 sm:grid-cols-2">
              <Field label={t(locale, 'profile.contactName')}>
                <input
                  className={inputClass}
                  value={item.name}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
              </Field>
              <Field label={t(locale, 'profile.contactRelation')}>
                <input
                  className={inputClass}
                  value={item.relation}
                  onChange={(event) => update(item.id, { relation: event.target.value })}
                />
              </Field>
              <Field label={t(locale, 'profile.contactPhone')}>
                <input
                  className={inputClass}
                  type="tel"
                  value={item.phone}
                  onChange={(event) => update(item.id, { phone: event.target.value })}
                />
              </Field>
              <label className="inline-flex min-h-11 items-center gap-2 self-end">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={item.isPrimary}
                  onChange={(event) => update(item.id, { isPrimary: event.target.checked })}
                />
                {t(locale, 'profile.contactPrimary')}
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="text-cadence-danger underline"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      emergencyContacts: current.emergencyContacts.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  {t(locale, 'profile.removeContact')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddButton
        label={t(locale, 'profile.addContact')}
        onClick={() =>
          patch((current) => ({
            ...current,
            emergencyContacts: [...current.emergencyContacts, createEmptyContact()],
          }))
        }
      />
    </Section>
  );
}

function DoctorSection({
  locale,
  profile,
  patch,
}: {
  locale: Locale;
  profile: Profile;
  patch: (updater: (current: Profile) => Profile) => void;
}) {
  const doctor = profile.doctor;
  return (
    <Section title={t(locale, 'profile.doctor')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t(locale, 'profile.doctorName')}>
          <input
            className={inputClass}
            value={doctor.name}
            onChange={(event) =>
              patch((current) => ({
                ...current,
                doctor: { ...current.doctor, name: event.target.value },
              }))
            }
          />
        </Field>
        <Field label={t(locale, 'profile.doctorSpecialty')}>
          <input
            className={inputClass}
            value={doctor.specialty}
            onChange={(event) =>
              patch((current) => ({
                ...current,
                doctor: { ...current.doctor, specialty: event.target.value },
              }))
            }
          />
        </Field>
        <Field label={t(locale, 'profile.doctorPhone')}>
          <input
            className={inputClass}
            type="tel"
            value={doctor.phone}
            onChange={(event) =>
              patch((current) => ({
                ...current,
                doctor: { ...current.doctor, phone: event.target.value },
              }))
            }
          />
        </Field>
        <Field label={t(locale, 'profile.doctorClinic')}>
          <input
            className={inputClass}
            value={doctor.clinic}
            onChange={(event) =>
              patch((current) => ({
                ...current,
                doctor: { ...current.doctor, clinic: event.target.value },
              }))
            }
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t(locale, 'profile.doctorNotes')}>
            <input
              className={inputClass}
              value={doctor.notes}
              onChange={(event) =>
                patch((current) => ({
                  ...current,
                  doctor: { ...current.doctor, notes: event.target.value },
                }))
              }
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="min-h-11 rounded-md bg-cadence-primary px-4 font-semibold text-cadence-primary-contrast"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
