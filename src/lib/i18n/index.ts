import enUS from '../../i18n/en-US.json';
import ptBR from '../../i18n/pt-BR.json';

export const LOCALES = ['en-US', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en-US';
export const LOCALE_STORAGE_KEY = 'cadence.locale.v1';

export const messages = {
  'en-US': enUS,
  'pt-BR': ptBR,
} as const;

export type MessageTree = typeof enUS;
export type MessageKey = Paths<MessageTree>;

type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? Paths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

const catalogs: Record<Locale, MessageTree> = {
  'en-US': enUS,
  'pt-BR': ptBR as MessageTree,
};

export function isLocale(value: unknown): value is Locale {
  return value === 'en-US' || value === 'pt-BR';
}

function getByPath(tree: MessageTree, key: MessageKey): string {
  const parts = key.split('.');
  let node: unknown = tree;
  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : key;
}

/**
 * Typed translator. Keys are derived from `src/i18n/en-US.json`.
 * Usage: `t(locale, 'nav.home')` or `t(locale, 'profile.fullName')`.
 */
export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let value = getByPath(catalogs[locale] ?? catalogs[DEFAULT_LOCALE], key);
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function htmlLang(locale: Locale): string {
  return locale === 'pt-BR' ? 'pt-BR' : 'en';
}

export function collectKeys(tree: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [name, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

type LocaleListener = (locale: Locale) => void;
const listeners = new Set<LocaleListener>();

function readStoredLocale(): Locale {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LOCALE;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

let currentLocale: Locale = DEFAULT_LOCALE;
let hydrated = false;

export function getLocale(): Locale {
  if (!hydrated) {
    currentLocale = readStoredLocale();
    hydrated = true;
  }
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  hydrated = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = htmlLang(locale);
  }
  for (const listener of listeners) listener(locale);
}

export function subscribeLocale(listener: LocaleListener): () => void {
  listeners.add(listener);
  listener(getLocale());
  return () => {
    listeners.delete(listener);
  };
}

export function useLocaleState(): {
  locale: Locale;
  setLocale: typeof setLocale;
} {
  return { locale: getLocale(), setLocale };
}
