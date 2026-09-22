import { useEffect, useId, useState, type ReactNode } from 'react';
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  ALLERGY_SEVERITIES,
  BLOOD_TYPES,
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
import { GlyphControls } from '../glyph/GlyphControls';
import { MedicalCombobox } from '../search/MedicalCombobox';
import { QrShare } from '../share/QrShare';

const ADVANCED_KEY = 'cadence.ui.advanced.v1';

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-cadence-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'cadence-input';

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="cadence-card p-5 sm:p-7">
      <header className="mb-6 flex items-baseline gap-4 border-b border-cadence-border pb-4">
        <span className="cadence-eyebrow tabular">{number}</span>
        <div>
          <h2 className="text-[1.75rem] sm:text-3xl">{title}</h2>
          {description ? <p className="mt-1 text-cadence-muted">{description}</p> : null}
        </div>
      </header>
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
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-cadence-border pb-6">
          <h1 className="text-4xl sm:text-6xl">{t(locale, 'profile.title')}</h1>
          <p className="max-w-2xl text-xl text-cadence-muted">{t(locale, 'profile.lead')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Switch
            id={advancedId}
            checked={advanced}
            onCheckedChange={setAdvancedAndPersist}
            label={t(locale, 'profile.advanced')}
            description={t(locale, 'profile.advancedHint')}
          />
          <p
            className={`inline-flex min-h-8 items-center gap-1.5 self-start font-semibold text-cadence-primary transition-opacity sm:self-center ${
              savedFlash ? 'opacity-100' : 'opacity-0'
            }`}
            aria-live="polite"
          >
            <Check className="size-4" aria-hidden="true" />
            {savedFlash ? t(locale, 'profile.saved') : '\u00a0'}
          </p>
        </div>
      </header>

      <PersonSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <AllergySection locale={locale} profile={profile} patch={patch} />
      <ConditionSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <MedicationSection locale={locale} profile={profile} advanced={advanced} patch={patch} />
      <ContactSection locale={locale} profile={profile} patch={patch} />
      {advanced ? <DoctorSection locale={locale} profile={profile} patch={patch} /> : null}

      <Section title={t(locale, 'profile.notes')} number="07">
        <textarea
          className={`${inputClass} min-h-32 py-2`}
          value={profile.notes}
          placeholder={t(locale, 'profile.notesPlaceholder')}
          onChange={(event) =>
            patch((current) => ({ ...current, notes: event.target.value }))
          }
        />
      </Section>

      {/* emergency-and-schedule-ui: share this profile via QR/link */}
      <Section title={t(locale, 'share.title')} number="08">
        <QrShare profile={profile} path="/emergency" />
      </Section>

      <div>
        <button
          type="button"
          className="cadence-btn cadence-btn-danger"
          onClick={() => {
            if (window.confirm(t(locale, 'profile.resetConfirm'))) store.reset();
          }}
        >
          <RotateCcw className="size-5" aria-hidden="true" />
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
    <Section title={t(locale, 'profile.person')} number="01">
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
    <Section title={t(locale, 'profile.allergies')} number="02">
      {profile.allergies.length === 0 ? (
        <p className="mb-5 font-display text-xl italic text-cadence-muted">{t(locale, 'profile.allergiesEmpty')}</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-5">
          {profile.allergies.map((item) => (
            <li key={item.id} className="cadence-row grid gap-4 sm:grid-cols-3">
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
                  className="cadence-btn-ghost-danger -ml-2.5"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      allergies: current.allergies.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
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
    <Section title={t(locale, 'profile.conditions')} number="03">
      {profile.conditions.length === 0 ? (
        <p className="mb-5 font-display text-xl italic text-cadence-muted">{t(locale, 'profile.conditionsEmpty')}</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-5">
          {profile.conditions.map((item) => (
            <li key={item.id} className="cadence-row grid gap-4 sm:grid-cols-2">
              <MedicalCombobox
                label={t(locale, 'profile.conditionName')}
                dataset="icd10"
                locale={locale}
                inputValue={item.name}
                placeholder={t(locale, 'search.conditionPlaceholder')}
                hint={t(locale, 'search.hint')}
                onInputChange={(value) => update(item.id, { name: value })}
                onSelect={(result) => update(item.id, { name: result.label, icd10: result.value })}
              />
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
                  className="cadence-btn-ghost-danger -ml-2.5"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      conditions: current.conditions.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
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
    <Section title={t(locale, 'profile.medications')} number="04">
      {profile.medications.length === 0 ? (
        <p className="mb-5 font-display text-xl italic text-cadence-muted">{t(locale, 'profile.medicationsEmpty')}</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-5">
          {profile.medications.map((item) => (
            <li key={item.id} className="cadence-row flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MedicalCombobox
                  label={t(locale, 'profile.medicationName')}
                  dataset="meds"
                  locale={locale}
                  inputValue={item.name}
                  placeholder={t(locale, 'search.medicationPlaceholder')}
                  hint={t(locale, 'search.hint')}
                  onInputChange={(value) => update(item.id, { name: value })}
                  onSelect={(result) => update(item.id, { name: result.label, code: result.value })}
                />
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
                        className="size-5 accent-cadence-primary"
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
                <div className="border-t border-dashed border-cadence-border-soft pt-4">
                  <GlyphControls
                    value={item.glyph}
                    locale={locale}
                    onChange={(glyph) =>
                      update(item.id, { glyph: glyph as Medication['glyph'] })
                    }
                  />
                </div>
              ) : null}
              <button
                type="button"
                className="cadence-btn-ghost-danger -ml-2.5 self-start"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    medications: current.medications.filter((row) => row.id !== item.id),
                  }))
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
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
    <Section title={t(locale, 'profile.contacts')} number="05">
      {profile.emergencyContacts.length === 0 ? (
        <p className="mb-5 font-display text-xl italic text-cadence-muted">{t(locale, 'profile.contactsEmpty')}</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-5">
          {profile.emergencyContacts.map((item) => (
            <li key={item.id} className="cadence-row grid gap-4 sm:grid-cols-2">
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
                  className="size-5 accent-cadence-primary"
                  checked={item.isPrimary}
                  onChange={(event) => update(item.id, { isPrimary: event.target.checked })}
                />
                {t(locale, 'profile.contactPrimary')}
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="cadence-btn-ghost-danger -ml-2.5"
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      emergencyContacts: current.emergencyContacts.filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
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
    <Section title={t(locale, 'profile.doctor')} number="06">
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
    <button type="button" className="cadence-btn cadence-btn-outline" onClick={onClick}>
      <Plus className="size-5" aria-hidden="true" />
      {label}
    </button>
  );
}
