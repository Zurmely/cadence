import { SCHEDULE_SLOTS, type Profile, type ScheduleSlot } from '../../lib/profile';
import { useProfile } from '../../lib/profile/useProfile';
import { t, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { MedicationGlyph } from '../glyph/MedicationGlyph';

const SLOT_KEYS: Record<ScheduleSlot, MessageKey> = {
  morning: 'profile.slotMorning',
  afternoon: 'profile.slotAfternoon',
  evening: 'profile.slotEvening',
  bedtime: 'profile.slotBedtime',
};

function hasAnyMedication(profile: Profile): boolean {
  return profile.medications.some((med) =>
    SCHEDULE_SLOTS.some((slot) => med.slots[slot]) || med.name.trim().length > 0,
  );
}

export function ScheduleShell() {
  const [locale] = useLocale();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl sm:text-4xl">{t(locale, 'schedule.title')}</h1>
        <p className="mt-2 max-w-3xl text-cadence-muted">{t(locale, 'schedule.lead')}</p>
      </header>

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
        <div className="grid gap-4 lg:grid-cols-2">
          {SCHEDULE_SLOTS.map((slot) => {
            const meds = profile.medications.filter((med) => med.slots[slot]);
            return (
              <section key={slot} className="cadence-card p-5">
                <h2 className="mb-3 text-2xl">{t(locale, SLOT_KEYS[slot])}</h2>
                {meds.length === 0 ? (
                  <p className="text-cadence-muted">{t(locale, 'emergency.none')}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {meds.map((med) => (
                      <li key={med.id} className="flex items-center gap-3">
                        <MedicationGlyph {...med.glyph} size={36} />
                        <div>
                          <p className="font-semibold">{med.name || '—'}</p>
                          <p className="text-cadence-muted">{med.dose}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="text-cadence-muted">{t(locale, 'schedule.placeholder')}</p>
    </div>
  );
}
