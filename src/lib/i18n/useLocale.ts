import { useEffect, useState } from 'react';
import { getLocale, setLocale, subscribeLocale, type Locale } from '../i18n';

export function useLocale(): [Locale, (locale: Locale) => void] {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => subscribeLocale(setLocaleState), []);

  return [locale, setLocale];
}
