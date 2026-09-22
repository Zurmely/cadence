import { CalendarDays, IdCard, Siren } from 'lucide-react';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { useProfile } from '../../lib/profile/useProfile';
import { DownloadButtons } from '../pdf/DownloadButtons';

export function PrintShell() {
  const [locale] = useLocale();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-cadence-border pb-6">
        <h1 className="text-4xl sm:text-6xl">{t(locale, 'print.title')}</h1>
        <p className="max-w-2xl text-xl text-cadence-muted">{t(locale, 'print.lead')}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cadence-card flex flex-col gap-4 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-cadence-border pb-3">
            <span className="cadence-eyebrow">Template A</span>
            <IdCard className="size-6 text-cadence-muted" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl leading-snug sm:text-3xl">{t(locale, 'print.templateA')}</p>
          <p className="mt-auto truncate text-cadence-muted">{profile.person.fullName || '—'}</p>
        </section>
        <section className="cadence-card flex flex-col gap-4 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-cadence-border pb-3">
            <span className="cadence-eyebrow">Template B</span>
            <CalendarDays className="size-6 text-cadence-muted" aria-hidden="true" />
          </div>
          <p className="font-display text-2xl leading-snug sm:text-3xl">{t(locale, 'print.templateB')}</p>
          <p className="mt-auto text-cadence-muted">
            {profile.medications.length} {t(locale, 'profile.medications').toLowerCase()}
          </p>
        </section>
      </div>

      <DownloadButtons profile={profile} locale={locale} />

      <a href="/emergency" className="cadence-btn cadence-btn-outline w-fit">
        <Siren className="size-5" aria-hidden="true" />
        {t(locale, 'print.openEmergency')}
      </a>
    </div>
  );
}
