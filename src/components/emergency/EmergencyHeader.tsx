import { Activity } from 'lucide-react';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { LanguageToggle } from '../layout/LanguageToggle';

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
      <header className="border-b-2 border-cadence-border bg-cadence-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-cadence-primary-dark">
            <Activity className="size-6" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">{t(locale, 'nav.brand')}</span>
          </a>
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}
