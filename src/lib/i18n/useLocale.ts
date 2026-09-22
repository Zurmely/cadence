import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, setLocale, subscribeLocale, type Locale } from '../i18n';

/**
 * Returns the active locale plus a setter.
 *
 * The initial render (including hydration) always starts from
 * `DEFAULT_LOCALE`, matching what the server rendered, since the real
 * locale lives in `localStorage` and is only knowable client-side. The
 * actual stored locale is read after mount inside `subscribeLocale`, so a
 * saved non-default locale is applied one tick after hydration instead of
 * causing a client/server markup mismatch.
 */
export function useLocale(): [Locale, (locale: Locale) => void] {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => subscribeLocale(setLocaleState), []);

  return [locale, setLocale];
}
