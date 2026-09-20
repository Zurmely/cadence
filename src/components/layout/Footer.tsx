import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';

export function Footer() {
  const [locale] = useLocale();

  return (
    <footer className="mt-auto border-t-2 border-cadence-border bg-cadence-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-cadence-muted">
        <p>{t(locale, 'footer.privacy')}</p>
        <p>{t(locale, 'footer.lgpd')}</p>
        <p className="font-semibold text-cadence-text">{t(locale, 'footer.copyright')}</p>
      </div>
    </footer>
  );
}
