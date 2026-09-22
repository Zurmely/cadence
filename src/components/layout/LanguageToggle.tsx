import { Languages } from 'lucide-react';
import { LOCALES, t } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';

export function LanguageToggle() {
  const [locale, setLocale] = useLocale();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Languages className="size-5 shrink-0 text-cadence-muted" aria-hidden="true" />
      <label htmlFor="cadence-language" className="sr-only">
        {t(locale, 'nav.language')}
      </label>
      <select
        id="cadence-language"
        className="cadence-input min-h-11 w-auto py-1 pr-8 font-semibold"
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
