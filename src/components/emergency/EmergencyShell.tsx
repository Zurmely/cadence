import type { ReactNode } from 'react';
import { Phone, ShieldAlert, WifiOff } from 'lucide-react';
import { useEmergencyProfile } from '../../lib/profile/useEmergencyProfile';
import { t, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { QrShare } from '../share/QrShare';
import type { Allergy, EmergencyContact } from '../../lib/profile';

const SEVERITY_KEYS = {
  mild: 'profile.severityMild',
  moderate: 'profile.severityModerate',
  severe: 'profile.severitySevere',
  unknown: 'profile.severityUnknown',
} as const satisfies Record<Allergy['severity'], MessageKey>;

/**
 * Section wrapper for the emergency view. Severity/urgency is always
 * conveyed with an icon and a thick border — never color alone — and body
 * text stays near-black on white so it clears WCAG AAA (7:1) regardless of
 * the accent color used for the border.
 */
function EmergencySection({
  title,
  tone = 'neutral',
  children,
}: {
  title: string;
  tone?: 'neutral' | 'critical';
  children: ReactNode;
}) {
  return (
    <section
      className={`cadence-card border-l-8 p-5 sm:p-6 ${
        tone === 'critical' ? 'border-l-cadence-danger' : 'border-l-cadence-primary'
      }`}
    >
      <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function CallLink({ contact }: { contact: EmergencyContact }) {
  const [locale] = useLocale();
  if (!contact.phone) return null;
  return (
    <a
      href={`tel:${contact.phone}`}
      className="flex min-h-14 items-center gap-3 rounded-md border-2 border-cadence-text bg-white px-4 font-bold text-cadence-text underline-offset-4 hover:underline"
    >
      <Phone className="size-6 shrink-0" aria-hidden="true" />
      <span className="text-xl sm:text-2xl">
        {contact.name || t(locale, 'emergency.contacts')}
        {contact.relation ? ` · ${contact.relation}` : ''}
        {contact.isPrimary ? ` · ${t(locale, 'emergency.primaryContact')}` : ''}
      </span>
      <span className="ml-auto whitespace-nowrap text-xl sm:text-2xl">{contact.phone}</span>
    </a>
  );
}

export function EmergencyShell() {
  const [locale] = useLocale();
  const { profile, source } = useEmergencyProfile();

  const isEmpty =
    !profile.person.fullName && profile.allergies.length === 0 && profile.medications.length === 0;

  return (
    <div className="flex flex-col gap-6 text-cadence-text">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black sm:text-5xl">{t(locale, 'emergency.title')}</h1>
        <p className="max-w-3xl text-xl">{t(locale, 'emergency.lead')}</p>
        <div className="flex flex-wrap items-center gap-2 text-lg">
          <span className="rounded-full border-2 border-cadence-text px-3 py-1 font-semibold">
            {source === 'hash' ? t(locale, 'emergency.sourceHash') : t(locale, 'emergency.sourceLocal')}
          </span>
          <span className="inline-flex items-center gap-1">
            <WifiOff className="size-5" aria-hidden="true" />
            {t(locale, 'emergency.offlineNote')}
          </span>
        </div>
      </header>

      <div
        className="flex items-start gap-3 rounded-lg border-4 border-cadence-danger bg-white p-4"
        role="status"
      >
        <ShieldAlert className="mt-0.5 size-8 shrink-0 text-cadence-danger" aria-hidden="true" />
        <p className="text-xl font-bold">{t(locale, 'emergency.warning')}</p>
      </div>

      {isEmpty ? (
        <p className="cadence-card p-6 text-xl">{t(locale, 'emergency.empty')}</p>
      ) : (
        <div className="grid gap-5">
          <EmergencySection title={profile.person.fullName || t(locale, 'emergency.title')} tone="critical">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-lg font-semibold">{t(locale, 'emergency.blood')}</dt>
                <dd className="text-5xl font-black leading-none sm:text-6xl">
                  {profile.person.bloodType === 'unknown'
                    ? t(locale, 'profile.bloodUnknown')
                    : profile.person.bloodType}
                </dd>
              </div>
              <div>
                <dt className="text-lg font-semibold">{t(locale, 'emergency.dob')}</dt>
                <dd className="text-2xl sm:text-3xl">{profile.person.dateOfBirth || '—'}</dd>
              </div>
            </dl>
          </EmergencySection>

          <EmergencySection title={t(locale, 'emergency.allergies')} tone="critical">
            {profile.allergies.length === 0 ? (
              <p className="text-xl">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.allergies.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-md border-2 p-3 ${
                      item.severity === 'severe' ? 'border-cadence-danger' : 'border-cadence-border'
                    }`}
                  >
                    <p className="text-2xl font-bold sm:text-3xl">
                      {item.severity === 'severe' ? (
                        <ShieldAlert
                          className="mr-2 inline size-7 text-cadence-danger"
                          aria-hidden="true"
                        />
                      ) : null}
                      {item.name || '—'}
                      {item.severity !== 'unknown' ? ` — ${t(locale, SEVERITY_KEYS[item.severity])}` : ''}
                    </p>
                    {item.reaction ? <p className="mt-1 text-xl">{item.reaction}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </EmergencySection>

          <EmergencySection title={t(locale, 'emergency.conditions')}>
            {profile.conditions.length === 0 ? (
              <p className="text-xl">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {profile.conditions.map((item) => (
                  <li key={item.id} className="text-xl">
                    <span className="font-bold">{item.name}</span>
                    {item.icd10 ? ` (${item.icd10})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </EmergencySection>

          <EmergencySection title={t(locale, 'emergency.medications')}>
            {profile.medications.length === 0 ? (
              <p className="text-xl">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.medications.map((item) => (
                  <li key={item.id} className="text-xl">
                    <span className="font-bold">{item.name || '—'}</span>
                    {item.dose ? ` — ${item.dose}` : ''}
                    {item.instructions ? <p className="mt-0.5 text-lg">{item.instructions}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </EmergencySection>

          <EmergencySection title={t(locale, 'emergency.contacts')} tone="critical">
            {profile.emergencyContacts.length === 0 ? (
              <p className="text-xl">{t(locale, 'emergency.none')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {profile.emergencyContacts.map((contact) => (
                  <li key={contact.id}>
                    <CallLink contact={contact} />
                  </li>
                ))}
              </ul>
            )}
          </EmergencySection>

          {profile.doctor.name || profile.doctor.phone ? (
            <EmergencySection title={t(locale, 'emergency.doctor')}>
              <p className="text-xl">
                <span className="font-bold">{profile.doctor.name}</span>
                {profile.doctor.specialty ? ` — ${profile.doctor.specialty}` : ''}
              </p>
              {profile.doctor.phone ? (
                <a
                  href={`tel:${profile.doctor.phone}`}
                  className="mt-2 inline-flex min-h-14 items-center gap-2 rounded-md border-2 border-cadence-text px-4 text-xl font-bold underline-offset-4 hover:underline"
                >
                  <Phone className="size-6" aria-hidden="true" />
                  {profile.doctor.phone}
                </a>
              ) : null}
            </EmergencySection>
          ) : null}
        </div>
      )}

      <section className="cadence-card p-5 sm:p-6">
        <h2 className="mb-3 text-2xl font-bold">{t(locale, 'share.title')}</h2>
        <QrShare profile={profile} path="/emergency" />
      </section>
    </div>
  );
}
