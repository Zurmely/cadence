import { useState } from 'react';
import { encodeProfileToHash } from '../../lib/profile';
import { useProfile } from '../../lib/profile/useProfile';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';

export function EmergencyShell() {
  const [locale] = useLocale();
  const { profile } = useProfile();
  const [status, setStatus] = useState('');

  const isEmpty = !profile.person.fullName && profile.allergies.length === 0 && profile.medications.length === 0;

  const copyLink = async (emergencyOnly: boolean) => {
    const hash = encodeProfileToHash(profile, { emergencyOnly });
    const url = `${window.location.origin}/emergency${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t(locale, 'emergency.copied'));
    } catch {
      setStatus(t(locale, 'emergency.copyFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl sm:text-4xl">{t(locale, 'emergency.title')}</h1>
        <p className="mt-2 max-w-3xl text-cadence-muted">{t(locale, 'emergency.lead')}</p>
      </header>

      <div
        className="rounded-lg border-2 border-cadence-danger bg-cadence-danger px-4 py-3 font-semibold text-cadence-danger-contrast"
        role="status"
      >
        {t(locale, 'emergency.warning')}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-md bg-cadence-primary px-4 font-semibold text-cadence-primary-contrast"
          onClick={() => copyLink(true)}
        >
          {t(locale, 'emergency.copyEmergency')}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border-2 border-cadence-primary px-4 font-semibold text-cadence-primary-dark"
          onClick={() => copyLink(false)}
        >
          {t(locale, 'emergency.copyFull')}
        </button>
      </div>
      <p className="text-cadence-success" aria-live="polite">
        {status || '\u00a0'}
      </p>

      {isEmpty ? (
        <p className="cadence-card p-6 text-cadence-muted">{t(locale, 'emergency.empty')}</p>
      ) : (
        <div className="grid gap-4">
          <section className="cadence-card p-5">
            <h2 className="text-3xl">{profile.person.fullName || '—'}</h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">{t(locale, 'emergency.blood')}</dt>
                <dd className="text-2xl">
                  {profile.person.bloodType === 'unknown'
                    ? t(locale, 'profile.bloodUnknown')
                    : profile.person.bloodType}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">{t(locale, 'emergency.dob')}</dt>
                <dd>{profile.person.dateOfBirth || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="cadence-card border-2 border-cadence-danger p-5">
            <h2 className="text-2xl text-cadence-danger">{t(locale, 'emergency.allergies')}</h2>
            {profile.allergies.length === 0 ? (
              <p className="mt-2">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="mt-2 list-disc pl-6">
                {profile.allergies.map((item) => (
                  <li key={item.id} className="text-xl font-semibold">
                    {item.name}
                    {item.severity !== 'unknown' ? ` (${item.severity})` : ''}
                    {item.reaction ? ` — ${item.reaction}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cadence-card p-5">
            <h2 className="text-2xl">{t(locale, 'emergency.conditions')}</h2>
            {profile.conditions.length === 0 ? (
              <p className="mt-2 text-cadence-muted">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="mt-2 list-disc pl-6">
                {profile.conditions.map((item) => (
                  <li key={item.id}>
                    {item.name}
                    {item.icd10 ? ` (${item.icd10})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cadence-card p-5">
            <h2 className="text-2xl">{t(locale, 'emergency.medications')}</h2>
            {profile.medications.length === 0 ? (
              <p className="mt-2 text-cadence-muted">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="mt-2 list-disc pl-6">
                {profile.medications.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold">{item.name}</span>
                    {item.dose ? ` — ${item.dose}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cadence-card p-5">
            <h2 className="text-2xl">{t(locale, 'emergency.contacts')}</h2>
            {profile.emergencyContacts.length === 0 ? (
              <p className="mt-2 text-cadence-muted">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {profile.emergencyContacts.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold">{item.name}</span>
                    {item.relation ? ` (${item.relation})` : ''}
                    {item.phone ? (
                      <>
                        {' — '}
                        <a className="text-cadence-primary-dark underline" href={`tel:${item.phone}`}>
                          {item.phone}
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profile.doctor.name || profile.doctor.phone ? (
            <section className="cadence-card p-5">
              <h2 className="text-2xl">{t(locale, 'emergency.doctor')}</h2>
              <p className="mt-2">
                {profile.doctor.name}
                {profile.doctor.specialty ? ` — ${profile.doctor.specialty}` : ''}
              </p>
              {profile.doctor.phone ? (
                <a className="text-cadence-primary-dark underline" href={`tel:${profile.doctor.phone}`}>
                  {profile.doctor.phone}
                </a>
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      <p className="text-cadence-muted">{t(locale, 'emergency.placeholder')}</p>
    </div>
  );
}
