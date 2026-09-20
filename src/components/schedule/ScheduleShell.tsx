import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { SCHEDULE_SLOTS, type Profile, type ScheduleSlot } from '../../lib/profile';
import { useProfile } from '../../lib/profile/useProfile';
import { t, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { MedicationGlyph } from '../glyph/MedicationGlyph';
import { SponsorSlot } from '../ads/SponsorSlot';
import { Checkbox } from '../ui/Checkbox';
import { expectedKeysForProfile, useCompliance } from '../../lib/schedule';

const SLOT_KEYS: Record<ScheduleSlot, MessageKey> = {
  morning: 'profile.slotMorning',
  afternoon: 'profile.slotAfternoon',
  evening: 'profile.slotEvening',
  bedtime: 'profile.slotBedtime',
};

function hasAnyMedication(profile: Profile): boolean {
  return profile.medications.some(
    (med) => SCHEDULE_SLOTS.some((slot) => med.slots[slot]) || med.name.trim().length > 0,
  );
}

export function ScheduleShell() {
  const [locale] = useLocale();
  const { profile } = useProfile();

  const expected = useMemo(() => expectedKeysForProfile(profile.medications), [profile.medications]);
  const { isChecked, toggle, summary, streak } = useCompliance(expected);

  const complete = summary.total > 0 && summary.checked === summary.total;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl sm:text-4xl">{t(locale, 'schedule.title')}</h1>
        <p className="mt-2 max-w-3xl text-cadence-muted">{t(locale, 'schedule.lead')}</p>
      </header>

      {/* Ads: mobile sponsor card, between the summary and the daily timetable. Desktop uses the sidebar slot instead. */}
      <SponsorSlot variant="inline" className="lg:hidden" />

      {!hasAnyMedication(profile) ? (
        <div className="cadence-card p-6">
          <p className="text-cadence-muted">{t(locale, 'schedule.empty')}</p>
          <a
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-cadence-primary px-4 font-semibold text-cadence-primary-contrast"
          >
            {t(locale, 'schedule.openProfile')}
          </a>
        </div>
      ) : (
        <>
          <div
            className={`cadence-card flex flex-wrap items-center gap-4 border-l-8 p-4 sm:p-5 ${
              complete ? 'border-l-cadence-success' : 'border-l-cadence-primary'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-xl font-semibold">
              {t(locale, 'schedule.summaryToday', {
                checked: summary.checked,
                total: summary.total,
              })}
            </p>
            <p className="inline-flex items-center gap-2 text-xl font-semibold text-cadence-primary-dark">
              <Flame className="size-6" aria-hidden="true" />
              {t(locale, 'schedule.streak', { count: streak })}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {SCHEDULE_SLOTS.map((slot) => {
              const meds = profile.medications.filter((med) => med.slots[slot]);
              return (
                <section key={slot} className="cadence-card p-5">
                  <h2 className="mb-3 text-2xl">{t(locale, SLOT_KEYS[slot])}</h2>
                  {meds.length === 0 ? (
                    <p className="text-cadence-muted">{t(locale, 'emergency.none')}</p>
                  ) : (
                    <ul className="flex flex-col gap-4">
                      {meds.map((med) => {
                        const checked = isChecked(med.id, slot);
                        const checkboxId = `dose-${med.id}-${slot}`;
                        const label = `${med.name || t(locale, 'schedule.unnamedMedication')}${
                          med.dose ? ` — ${med.dose}` : ''
                        }`;
                        return (
                          <li
                            key={med.id}
                            className={`flex items-start gap-3 rounded-md border-2 p-3 ${
                              checked ? 'border-cadence-success bg-cadence-success/5' : 'border-cadence-border'
                            }`}
                          >
                            <MedicationGlyph {...med.glyph} size={36} />
                            <div className="flex-1">
                              <p className="font-semibold">{med.name || t(locale, 'schedule.unnamedMedication')}</p>
                              {med.dose ? <p className="text-cadence-muted">{med.dose}</p> : null}
                              {med.instructions ? (
                                <p className="text-cadence-muted">{med.instructions}</p>
                              ) : null}
                            </div>
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={() => toggle(med.id, slot)}
                              label={t(locale, 'schedule.taken')}
                              srLabel={t(locale, 'schedule.markTaken', { medication: label })}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      <p className="text-cadence-muted">{t(locale, 'schedule.placeholder')}</p>
    </div>
  );
}
