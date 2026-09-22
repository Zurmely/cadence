import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { useProfile } from '../../lib/profile/useProfile';
import { DownloadButtons } from '../pdf/DownloadButtons';

export function PrintShell() {
  const [locale] = useLocale();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl sm:text-4xl">{t(locale, 'print.title')}</h1>
        <p className="mt-2 max-w-3xl text-cadence-muted">{t(locale, 'print.lead')}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cadence-card p-5">
          <h2 className="text-2xl">A</h2>
          <p className="mt-2">{t(locale, 'print.templateA')}</p>
          <p className="mt-4 font-semibold">{profile.person.fullName || '—'}</p>
        </section>
        <section className="cadence-card p-5">
          <h2 className="text-2xl">B</h2>
          <p className="mt-2">{t(locale, 'print.templateB')}</p>
          <p className="mt-4 text-cadence-muted">
            {profile.medications.length} {t(locale, 'profile.medications').toLowerCase()}
          </p>
        </section>
      </div>

      <DownloadButtons profile={profile} locale={locale} />

      <a
        href="/emergency"
        className="inline-flex min-h-11 w-fit items-center rounded-md bg-cadence-primary px-4 font-semibold text-cadence-primary-contrast"
      >
        {t(locale, 'print.openEmergency')}
      </a>
    </div>
  );
}
