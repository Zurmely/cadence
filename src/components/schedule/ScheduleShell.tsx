import { useMemo } from 'react';
import { Flame, Moon, Sun, Sunrise, Sunset, UserRound } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { SCHEDULE_SLOTS, type Profile, type ScheduleSlot } from '../../lib/profile';
import { useProfile } from '../../lib/profile/useProfile';
import { t, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { MedicationGlyph } from '../glyph/MedicationGlyph';
import { SponsorSlot } from '../ads/SponsorSlot';
import { Checkbox } from '../ui/Checkbox';
import { expectedKeysForProfile, useCompliance } from '../../lib/schedule';

const SLOT_ICONS: Record<ScheduleSlot, ComponentType<SVGProps<SVGSVGElement>>> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  bedtime: Moon,
};

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
  const percent = summary.total > 0 ? Math.round((summary.checked / summary.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-cadence-border pb-6">
        <h1 className="text-4xl sm:text-6xl">{t(locale, 'schedule.title')}</h1>
        <p className="max-w-2xl text-xl text-cadence-muted">{t(locale, 'schedule.lead')}</p>
      </header>

      {/* Ads: mobile sponsor card, between the summary and the daily timetable. Desktop uses the sidebar slot instead. */}
      <SponsorSlot variant="inline" className="lg:hidden" />

      {!hasAnyMedication(profile) ? (
        <div className="cadence-card flex flex-col items-start gap-5 p-7 sm:p-10">
          <p className="max-w-xl font-display text-2xl italic text-cadence-muted sm:text-3xl">
            {t(locale, 'schedule.empty')}
          </p>
          <a href="/" className="cadence-btn cadence-btn-primary">
            <UserRound className="size-5" aria-hidden="true" />
            {t(locale, 'schedule.openProfile')}
          </a>
        </div>
      ) : (
        <>
          <div className="cadence-card flex flex-col gap-4 p-5 sm:p-7" role="status" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="font-display text-3xl sm:text-4xl">
                {t(locale, 'schedule.summaryToday', {
                  checked: summary.checked,
                  total: summary.total,
                })}
              </p>
              <p className="inline-flex items-center gap-2 font-semibold text-cadence-primary">
                <Flame className="size-5" aria-hidden="true" />
                {t(locale, 'schedule.streak', { count: streak })}
              </p>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-cadence-border-soft"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={summary.total}
              aria-valuenow={summary.checked}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  complete ? 'bg-cadence-success' : 'bg-cadence-primary'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {SCHEDULE_SLOTS.map((slot) => {
              const meds = profile.medications.filter((med) => med.slots[slot]);
              const SlotIcon = SLOT_ICONS[slot];
              const slotDone = meds.length > 0 && meds.every((med) => isChecked(med.id, slot));
              return (
                <section key={slot} className="cadence-card p-5 sm:p-6">
                  <h2 className="mb-5 flex items-center justify-between gap-3 border-b border-cadence-border pb-3 text-2xl sm:text-3xl">
                    {t(locale, SLOT_KEYS[slot])}
                    <SlotIcon
                      className={`size-6 shrink-0 ${slotDone ? 'text-cadence-primary' : 'text-cadence-muted'}`}
                      aria-hidden="true"
                    />
                  </h2>
                  {meds.length === 0 ? (
                    <p className="font-display text-xl italic text-cadence-muted">{t(locale, 'emergency.none')}</p>
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
                            className={`flex items-start gap-4 rounded-sm border-l-4 py-3 pl-4 pr-1 transition-colors ${
                              checked
                                ? 'border-l-cadence-primary bg-cadence-primary-soft'
                                : 'border-l-cadence-border-soft'
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

      <p className="text-base text-cadence-muted">{t(locale, 'schedule.placeholder')}</p>
    </div>
  );
}
