import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { LanguageToggle } from '../layout/LanguageToggle';
import { Wordmark } from '../layout/Wordmark';

/**
 * Minimal chrome for the emergency view: brand link, skip link, and the
 * language toggle only — no full nav menu competing for a first responder's
 * attention.
 */
export function EmergencyHeader() {
  const [locale] = useLocale();
  return (
    <>
      <a className="cadence-skip-link" href="#main">
        {t(locale, 'nav.skip')}
      </a>
      <header className="border-b border-cadence-border bg-cadence-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Wordmark compact />
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}
