import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { Wordmark } from './Wordmark';

export function Footer() {
  const [locale] = useLocale();

  return (
    <footer className="mt-auto border-t border-cadence-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-3">
          <Wordmark compact />
          <p className="text-base text-cadence-muted">{t(locale, 'footer.copyright')}</p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="border-t border-cadence-border-soft pt-3">
            <dt className="cadence-eyebrow">01</dt>
            <dd className="mt-2 text-cadence-muted">{t(locale, 'footer.privacy')}</dd>
          </div>
          <div className="border-t border-cadence-border-soft pt-3">
            <dt className="cadence-eyebrow">02</dt>
            <dd className="mt-2 text-cadence-muted">{t(locale, 'footer.lgpd')}</dd>
          </div>
        </dl>
      </div>
    </footer>
  );
}
