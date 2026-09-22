import { Siren } from 'lucide-react';
import { t, type MessageKey } from '../../lib/i18n';
import { useLocale } from '../../lib/i18n/useLocale';
import { LanguageToggle } from './LanguageToggle';
import { Wordmark } from './Wordmark';

type Props = {
  currentPath: string;
};

const LINKS: { href: string; key: MessageKey }[] = [
  { href: '/', key: 'nav.home' },
  { href: '/schedule', key: 'nav.schedule' },
  { href: '/print', key: 'nav.print' },
];

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export function Nav({ currentPath }: Props) {
  const [locale] = useLocale();
  const path = normalizePath(currentPath);
  const emergencyActive = path === '/emergency';

  return (
    <>
      <a className="cadence-skip-link" href="#main">
        {t(locale, 'nav.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-cadence-border bg-cadence-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <Wordmark />
          <nav
            aria-label={t(locale, 'nav.brand')}
            className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0"
          >
            {LINKS.map(({ href, key }) => {
              const active = path === href;
              return (
                <a
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`cadence-link inline-flex min-h-11 shrink-0 items-center px-2 font-semibold ${
                    active ? 'text-cadence-text' : 'text-cadence-muted hover:text-cadence-text'
                  }`}
                >
                  {t(locale, key)}
                </a>
              );
            })}
            <a
              href="/emergency"
              aria-current={emergencyActive ? 'page' : undefined}
              className={`ml-1 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border-[1.5px] px-3 font-semibold transition-colors ${
                emergencyActive
                  ? 'border-cadence-danger bg-cadence-danger text-cadence-danger-contrast'
                  : 'border-cadence-danger text-cadence-danger hover:bg-cadence-danger hover:text-cadence-danger-contrast'
              }`}
            >
              <Siren className="size-5 shrink-0" aria-hidden="true" />
              {t(locale, 'nav.emergency')}
            </a>
            <span className="mx-2 hidden h-6 w-px bg-cadence-border sm:block" aria-hidden="true" />
            <LanguageToggle />
          </nav>
        </div>
      </header>
    </>
  );
}
