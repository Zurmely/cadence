import { Languages } from 'lucide-react';
import { LOCALES, t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';

export function LanguageToggle() {
  const [locale, setLocale] = useLocale();

  return (
    <div className="flex items-center gap-2">
      <Languages className="size-5 shrink-0" aria-hidden="true" />
      <label htmlFor="cadence-language" className="sr-only">
        {t(locale, 'nav.language')}
      </label>
      <select
        id="cadence-language"
        className="min-h-11 rounded-md border-2 border-cadence-border bg-cadence-surface px-2 py-1 font-semibold text-cadence-text"
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (next === 'en-US' || next === 'pt-BR') setLocale(next);
        }}
      >
        {LOCALES.map((item) => (
          <option key={item} value={item}>
            {item === 'en-US' ? t(locale, 'nav.languageEn') : t(locale, 'nav.languagePt')}
          </option>
        ))}
      </select>
    </div>
  );
}
